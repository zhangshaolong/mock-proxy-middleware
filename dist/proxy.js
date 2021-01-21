const http=require("http"),https=require("https"),utilsTool=require("./utils"),encoding=utilsTool.encoding,pendings={},showProxyLog=(options,method,redirectUrl,data)=>{data.length>2e3?console.log(`proxy request: \n\tHost:${options.host}\n\tPort:${options.port}\n\tMethod:${method}\n\tPath:${redirectUrl}\n\tParams:too large not display`):console.log(`proxy request: \n\tHost:${options.host}\n\tPort:${options.port}\n\tMethod:${method}\n\tPath:${redirectUrl}\n\tParams:${data}`)},proxyResponse=(proxyRes,res)=>{let headers=proxyRes.headers,statusCode=proxyRes.statusCode;try{if(headers)for(let key in headers)res.setHeader(key,headers[key]);res.writeHead(statusCode)}catch(e){console.log("setHeader error",e.message)}utilsTool.mergeData(proxyRes).then(data=>{res.end(data,encoding)})},getProxy=(request,proxyConfig)=>{if(proxyConfig&&proxyConfig.host){const excludes=proxyConfig.excludes;if(excludes)for(let i=0;i<excludes.length;i++){const exclude=excludes[i];if(console.log(request.path,exclude),"function"==typeof exclude){if(exclude(request,proxyConfig))return!1}else if(new RegExp(exclude).test(request.path))return!1}return proxyConfig}return!1},doProxy=(request,response,headers,params,method,proxyConfig)=>{const isHttps=null!=proxyConfig.isHttps?proxyConfig.isHttps:"https"===request.protocol;let redirectUrl=request.url;if(proxyConfig.redirect&&(redirectUrl=proxyConfig.redirect(redirectUrl)),headers.host=proxyConfig.host+(proxyConfig.port?":"+proxyConfig.port:""),headers.connection="close",proxyConfig.headers){const mergedCookies={};if(headers.cookie){let cookieKv=headers.cookie.split(/\s*;\s*/);for(let i=0;i<cookieKv.length;i++){let cookiePair=cookieKv[i].split(/=/);mergedCookies[cookiePair[0]]=cookiePair[1]}}const configCookieStr=proxyConfig.headers.cookie;if(configCookieStr){let cookieKv=configCookieStr.split(/\s*;\s*/);for(let i=0;i<cookieKv.length;i++){let cookiePair=cookieKv[i].split(/=/);mergedCookies[cookiePair[0]]=cookiePair[1]}const mergedCookieArr=[];for(let key in mergedCookies)mergedCookieArr.push(`${key}=${escape(unescape(mergedCookies[key]))}`);headers={...headers,...proxyConfig.headers,...{cookie:mergedCookieArr.join(";")}}}else headers={...headers,...proxyConfig.headers}}const options={host:proxyConfig.host,path:redirectUrl,method:request.method,headers:headers,timeout:proxyConfig.timeout||3e4,rejectUnauthorized:!1,agent:!1};proxyConfig.port&&(options.port=proxyConfig.port),showProxyLog(proxyConfig,method,redirectUrl,params),((postData,options)=>{let proxyReq=(isHttps?https:http).request(options,proxyRes=>{proxyResponse(proxyRes,response)});proxyReq.on("error",e=>{response.end(JSON.stringify({status:500,e:e.message})),console.log("proxyReq error: "+e.message)}),"POST"===method?proxyReq.end(postData,encoding):request.pipe(proxyReq)})(params,options)};module.exports={doProxy:doProxy,getProxy:getProxy};