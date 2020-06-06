const queryString=require("querystring"),encoding="UTF-8",mergeData=original=>new Promise(resolve=>{let chunks=[],size=0;original.on("data",chunk=>{chunks.push(chunk),size+=chunk.length}),original.on("end",()=>{let data=null,len=chunks.length;switch(len){case 0:data=new Buffer(0);break;case 1:data=chunks[0];break;default:data=new Buffer(size);for(let i=0,pos=0;i<len;i++){let chunk=chunks[i];chunk.copy(data,pos),pos+=chunk.length}}resolve(data)})}),isApi=(pathName,opt)=>{const type=opt.type,rules=opt.rules;"string"==typeof rules&&(rules=[rules]);const len=rules.length;if("prefix"===type){for(let i=0;i<len;i++)if(pathName.startsWith(rules[i]))return!0}else if("suffix"===type)for(let i=0;i<len;i++)if(pathName.endsWith(rules[i]))return!0;return!1},getParams=(request,query,method,isFormData,isProxy)=>{if("POST"===method){let bodyData=request.body;return bodyData?Promise.resolve([isFormData?queryString:JSON][isProxy?"stringify":"parse"](bodyData)):mergeData(request).then(data=>(isProxy||(data=(isFormData?queryString:JSON).parse(data.toString())),data))}if("GET"===method)return Promise.resolve(isProxy?JSON.stringify(query):query)};module.exports={encoding:"UTF-8",mergeData:mergeData,isApi:isApi,getParams:getParams};