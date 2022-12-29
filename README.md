# 8080-proxy-finder
this isn a simple script for testing purpose that getting list proxy list from `https://free-proxy-list.net/` and then use `http://www.proxy-checker.org/` trying to get you a list of working 8080 proxies
# Requirements
1. make sure that you are already installed `nodejs` if you are not installed you can download lastest version from [this link](https://nodejs.org/en/download/) 
2. download the files 
3. open cmd and navigate to script folder `cd /path/to/script-folder` 
4. run `npm install` to install requirements
5. run `node proxyList` to run the script

- after running the script it's will show you some status while walking through proxies and after finished you will find a new file created in the same script diectory called `proxy-list (Number).json` about `(Number)` it's a number generated something like `proxy-list 0.json`, `proxy-list 1.json` to avoid overriding the `proxy-list` which means in every time you run the script it's will generate a new file with the proxy list and status

Tip
=====
- if you get error like `Unexpected token ...` that's maybe because of `jsdom` version isn't compitable with your node version you can find jsdom reslises [here](https://github.com/jsdom/jsdom/releases?page=3)
- Pick one that can be work good enough in you node version. The current jsdom version in `package.json` is `15.1.0` that's compitable with `Node v12`

# Issues
- if you have any problems in running the script you can open an issues
