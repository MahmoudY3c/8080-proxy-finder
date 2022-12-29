const https = require("https");
const http = require("http");
const fs = require("fs");
const FormData = require("form-data");
const urlParser = require("url")
const $ = require("jquery-jsdom");
const { JSDOM } = jsdom = require("jsdom");


/*
//command line
const util = require('util');
const exec = util.promisify(require('child_process').exec);
*/

//handlers
function httpRequest(url, options) {
  return new Promise ((resolve, reject) => {
    //parse url
    url = urlParser.parse(url);
    let opts = {
      method: options.method,
      host: url.host,
      path: url.path,
      protocol: url.protocol
    },
    body = [], form, mod, headers = {}
    //choose module to send the request
    if (url.protocol === "http:") {
      mod = http
    } else if (url.protocol === "https:") {
      mod = https
    }
    //handle formData
    if(options.formData) {
      form = new FormData();
      for(let i in options.formData) form.append(i, options.formData[i])
      let fData = form.getHeaders()
      for(let i in fData) headers[i] = fData[i]
    }
    opts.headers = headers
    //send the request
    let req = mod.request(opts, res => {
      res.setEncoding('utf8');
      res.on('data', function(data) {
        //push parsed parts inside array
        body.push(data)
      })
      res.on('end', function() {
        let response = ''
        //get the parsed parts in one piece
        for(let i of body) {
            if (typeof i === 'string') {
                response += i
            } else if(typeof i === 'object') {
                response = i
            }
        }
        resolve(response)
      })
    })
    req.on('error', function() {
      console.error("error this request cannot be done")
    })
    if (form) {form.pipe(req)}
    req.end();
  })
}
function documentParser(data) {
  var doc = new JSDOM(data)
  return doc.window.document
}
//check not used file name
function checkFileName(obj, n = 0) {
  return new Promise((resolve, reject) => {
    fs.open(obj.path+n+"."+obj.ext, 'r', function(err, res) {
      if (err) {
        resolve(obj.path+n+"."+obj.ext)
      } else {
        n++
        checkFileName(obj, n).then(resolve).catch(reject)
      }
    })
  })
}
//recursion function to loop data one by one untill finish all requests
function loopData(type, options, n = 0) {
  return new Promise((resolve, reject) => {
    //getting keys as array
    let iterable = Object.keys(options.iterable), opts = {}
    if (iterable.length > n) {
      //handle request requirements
      if(options.formData) {
        if(typeof options.formData  === 'function') {
          opts['formData'] = options.formData(n)
        } else {
          opts['formData'] = options.formData
        }
      }
      if(typeof options.url === 'function') {
        opts['url'] = options.url(n)
      } else {
        opts['url'] = options.url
      }
      opts['method'] = options.method
      //sending the request
      httpRequest(opts.url, opts).then(data => {
        //check if it's (arr|obj) to choose the way to pushing data 
        data = options.fn(data)
        if (type.constructor === Array) {
          type.push(data)
        } else if (type.constructor === Object) {
         if (data) {
           for(let i in data) type[i] = data[i]
         }
        }
        //still alive message 
        options.message(data)
        //re call the function and handle promise
        n++
        loopData(type, options, n).then(resolve).catch(reject)
      })
    } else {
      //execute callback function after receving all responses
      resolve(type)
    }
  })
}
//first step get the proxy list
httpRequest("https://free-proxy-list.net/", {method: "GET"}).then((response) => {
  //still alive message 
  console.log("proxy list in progress please wait...")
  let dom = documentParser(response),
  table = dom.getElementsByTagName('table')[0],
  tr = table.getElementsByTagName("tr"),
  proxy = [], port = []
  for(let i of tr) {
    if (i.getElementsByTagName("td")[1]) {
      //proxy, port list
      proxy.push(i.getElementsByTagName("td")[0].innerHTML.trim())
      port.push(i.getElementsByTagName("td")[1].innerHTML.trim())
    }
  }
  //filter and get 8080 proxyies
  function get8080List(proxy8080 = {}, n = 0) {
    if (port.length > n) {
      if (port[n] === "8080") {
        proxy8080[proxy[n]] = port[n]
        n++
        get8080List(proxy8080, n)
      } else {
        n++
        get8080List(proxy8080, n)
      }
    }
    if(proxy8080) return proxy8080
  }
  let proxy8080 = get8080List(),
  proxy8080Keys = Object.keys(proxy8080)
  
  //second step get checking code
  loopData([], {
    url: "http://www.proxy-checker.org/result.php",
    method: 'POST',
    iterable: proxy8080,
    formData: function(num) {
      return {
        "list": proxy8080Keys[num]+":"+ proxy8080[proxy8080Keys[num]]
      }
    },
    fn: function(data) {
      let dom = documentParser(data),
      code = dom.getElementsByTagName("table")[0].getElementsByTagName("tr")[1].getAttribute("code")
      return code
    },
    message: function(code) {
      return console.log(code, ' getting checker code...')
    }
  })
  .then(function(code) {
    //last step check proxies and save them
    loopData({}, {
      url: function(num) {
        return "http://www.proxy-checker.org/checkproxy.php?proxy="+proxy8080Keys[num]+":"+proxy8080[proxy8080Keys[num]]+"&code="+ code[num]
      },
      method: 'GET',
      iterable: proxy8080,
      fn: function(data) {
        let td, proxy, port, status, country;
        td = $(data).find("td");
        proxy = td.prevObject[1].innerHTML.trim()
        port = td.prevObject[2].innerHTML.trim()
        status = td.prevObject[3].innerHTML.trim()
        country = td.prevObject[5].innerHTML.trim()
        if (status !== 'dead') {
          return {
              [proxy+':'+port]: {
              'status': status,
              'country': country
            }
          }
        } else {
          return false
        }
      },
      message: function(proxy) {
        if (proxy) {
          return console.log(proxy, ' checking proxies...')
        } else {
          return console.log("<dead>")
        }
      }
    })
    .then(function(list) {
      //check if the file name is exist or not to create a anw one
      checkFileName({
        path: "./proxy-list ",
        ext: "json"
      }).then(name => {
        fs.writeFileSync(name, JSON.stringify(list, null, 4));
        console.log("done!")
        console.log('File name is:', name.replace(/\.\//g, ''))
        /*
        //open the file
        try {
            exec('notepad ' + name)
        } catch(e) {} finally {}
        */
      })
    })
  })
})