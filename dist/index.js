"use strict";const queryString=require("querystring"),URL=require("url"),http=require("http"),formDataReg=/multipart\/form-data/,path=require("path"),fs=require("fs"),encoding="UTF-8",proxyReg=/^([^:]+):(\d+)$/,showProxyLog=(options,method,redirectUrl,data)=>{data.length>2e3?console.log(`proxy request: \n\tHost:${options.host}\n\tPort:${options.port}\n\tMethod:${method}\n\tPath:${redirectUrl}\n\tParams:too large not display`):console.log(`proxy request: \n\tHost:${options.host}\n\tPort:${options.port}\n\tMethod:${method}\n\tPath:${redirectUrl}\n\tParams:${data}`)},writeResponse=(proxyRes,res,encoding)=>{let chunks=[],size=0,headers=proxyRes.headers,statusCode=proxyRes.statusCode;try{if(headers)for(let key in headers)res.setHeader(key,headers[key]);res.writeHead(statusCode,headers)}catch(e){console.log("setHeader error",e.message)}proxyRes.on("data",chunk=>{chunks.push(chunk),size+=chunk.length}),proxyRes.on("end",()=>{let data=null,len=chunks.length;switch(len){case 0:data=new Buffer(0);break;case 1:data=chunks[0];break;default:data=new Buffer(size);for(let i=0,pos=0;i<len;i++){let chunk=chunks[i];chunk.copy(data,pos),pos+=chunk.length}}res.end(data,encoding)})};module.exports=(opts=>{let proxyInfo;return(req,res,next)=>{const apiConfig=opts.apiConfig,ignoreProxyPaths=opts.ignoreProxyPaths||{},mockPath=opts.mockPath||"mock";proxyInfo=opts.proxyInfo||proxyInfo;const reqUrl=req.url,withoutArgUrl=reqUrl.split(/\?/)[0],apiType=apiConfig.type,apiValue=apiConfig.value;"string"==typeof apiValue&&(apiValue=[apiValue]);const len=apiValue.length;let isApi=!1;if("prefix"===apiType){for(let i=0;i<len;i++)if(0===reqUrl.indexOf(apiValue[i])){isApi=!0;break}}else if("suffix"===apiType)for(let i=0;i<len;i++)if(withoutArgUrl.endsWith(apiValue[i])){isApi=!0;break}if(!isApi)return next();{const headers={},method=req.method.toUpperCase(),urlInfo=URL.parse(reqUrl,!0),contentType=req.headers["content-type"]||"text/plain;charset=UTF-8",getProxyInfo=()=>{const pageUrl=req.headers.referer;if(pageUrl){const query=URL.parse(pageUrl,!0).query;if(query&&query.proxy){const pair=query.proxy.replace(/^https?\:\/\//,"").split(":");return{host:pair[0],port:pair[1]||80}}}},doProxy=proxyInfo=>{let redirectUrl=reqUrl;proxyInfo.redirect&&(redirectUrl=proxyInfo.redirect(reqUrl)),headers.host=proxyInfo.host+":"+proxyInfo.port,contentType&&(headers["Content-Type"]=contentType);const options={host:proxyInfo.host,port:proxyInfo.port,path:redirectUrl,method:req.method,timeout:3e4,headers:headers};let postData="";if("POST"===method)if(req.on("error",e=>{console.log("req error: "+e.message)}),req.body){postData=contentType&&contentType.indexOf("application/x-www-form-urlencoded")>-1?queryString.stringify(req.body):JSON.stringify(req.body),showProxyLog(options,method,redirectUrl,postData),headers.contentLength=postData.length;let proxyReq=http.request(options,proxyRes=>{writeResponse(proxyRes,res,"UTF-8")});proxyReq.on("error",e=>{res.end(JSON.stringify({status:500,e:e.message})),console.log("proxyReq error: "+e.message)}),proxyReq.end(postData,"UTF-8")}else req.on("data",data=>{postData+=data}),req.on("end",()=>{headers.contentLength=postData.length;let proxyReq=http.request(options,proxyRes=>{writeResponse(proxyRes,res,"UTF-8")});proxyReq.on("error",e=>{res.end(JSON.stringify({status:500,e:e.message})),console.log("proxyReq error: "+e.message)}),showProxyLog(options,method,redirectUrl,postData),proxyReq.end(postData,"UTF-8")});else if("GET"===method){postData=JSON.stringify(urlInfo.query),headers.contentLength=Buffer.byteLength(postData),showProxyLog(options,method,redirectUrl,postData);let proxyReq=http.request(options,proxyRes=>{writeResponse(proxyRes,res,"UTF-8")});proxyReq.on("error",e=>{res.end(JSON.stringify({status:500,e:e.message})),console.log("proxyReq error: "+e.message)}),proxyReq.end(postData,"UTF-8")}};for(let key in req.headers)headers[key]=req.headers[key];if(proxyInfo||(proxyInfo=getProxyInfo()),proxyInfo&&proxyInfo.host&&!ignoreProxyPaths[withoutArgUrl])return void doProxy(proxyInfo);if(proxyReg.test(ignoreProxyPaths[withoutArgUrl]))return void doProxy({host:RegExp.$1,port:RegExp.$2||80});const doMock=(params,pathName)=>{try{params.__url__&&(pathName=params.__url__,delete params.__url__);let slashReg=/^\/|\/$/g;for(let i=0;i<len;i++)if(pathName["prefix"===apiType?"startsWith":"endsWith"](apiValue[i])){const parts=(pathName=pathName.replace(apiValue[i],"")).replace(slashReg,"").split(/\//);pathName=path.resolve(mockPath,apiValue[i].replace(slashReg,"").replace(/\//g,"_"),parts.join("_"));break}pathName+=".js",fs.exists(pathName,exist=>{if(exist)try{const content=new String(fs.readFileSync(pathName,"UTF-8"),"UTF-8");try{let result=new Function("return "+content)();"function"==typeof result&&(result=result(params)),!isNaN(result.sleep)&&result.sleep>0?setTimeout(()=>{delete result.sleep,res.end(JSON.stringify(result))},result.sleep):("string"!=typeof result&&(result=JSON.stringify(result)),res.end(result))}catch(e){try{const content=fs.readFileSync(pathName,"binary");res.writeHead(200),res.write(content,"binary"),res.end()}catch(e){res.writeHead(500),res.end(JSON.stringify(e.message))}}}catch(e){res.writeHead(500),res.end(JSON.stringify(e.message))}else res.writeHead(500),res.end(pathName+" file is not existed~")})}catch(e){try{result=json.parse(result),res.end(result)}catch(e){res.writeHead(500),res.end(JSON.stringify(e.message))}}};if(formDataReg.test(contentType))return void req.once("data",data=>{doMock(queryString.parse(String(data,"UTF-8")),urlInfo.pathname)});let params="";"POST"===method?req.body?doMock(req.body,urlInfo.pathname):(req.on("data",data=>{params+=data}),req.on("end",()=>{params=contentType&&contentType.indexOf("application/x-www-form-urlencoded")>-1?queryString.parse(params):JSON.parse(params),doMock(params,urlInfo.pathname)})):"GET"===method&&(params=urlInfo.query,doMock(params,urlInfo.pathname))}}});