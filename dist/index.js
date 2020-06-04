"use strict";const utilsTool=require("./utils"),proxyTool=require("./proxy"),mockTool=require("./mock"),encoding=utilsTool.encoding;module.exports=(opts=>(req,res,next)=>{if(!utilsTool.isApi(req,opts))return next();{const isFormData=(req.headers["content-type"]||"text/plain;charset="+encoding).indexOf("application/x-www-form-urlencoded")>-1,method=req.method.toUpperCase(),headers={};for(let key in req.headers)headers[key]=req.headers[key];let proxyConfig=proxyTool.getProxy(req,opts.proxyConfig);utilsTool.getParams(req,method,isFormData,proxyConfig).then(params=>{proxyConfig?proxyTool.doProxy(req,res,headers,params,method,proxyConfig):mockTool.doMock(req,res,params,opts)})}});