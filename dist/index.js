"use strict";const URL=require("url"),fs=require("fs"),path=require("path"),utilsTool=require("./utils"),proxyTool=require("./proxy"),mockTool=require("./mock"),generateApi=require("./manage/generate-api"),encoding=utilsTool.encoding,allConfigs=[];let timer=null;module.exports=(opts=>(allConfigs.push(opts),clearTimeout(timer),timer=setTimeout(()=>{generateApi(allConfigs)},500),(req,res,next)=>{const urlInfo=URL.parse(req.url,!0);if(utilsTool.isApi(urlInfo.pathname,opts)){const isFormData=(req.headers["content-type"]||"text/plain;charset="+encoding).indexOf("application/x-www-form-urlencoded")>-1,method=req.method.toUpperCase(),headers={};for(let key in req.headers)headers[key]=req.headers[key];let proxyConfig=proxyTool.getProxy(req,opts.proxyConfig);utilsTool.getParams(req,urlInfo.query,method,isFormData,proxyConfig).then(params=>{proxyConfig?proxyTool.doProxy(req,res,headers,params,method,proxyConfig):mockTool.doMock(urlInfo.pathname,res,params,opts)})}else{if("/show-apis"!==urlInfo.pathname)return next();res.end(fs.readFileSync(path.resolve(__dirname,"./manage/show-apis.html")))}}));