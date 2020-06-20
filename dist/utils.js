const queryString=require("querystring"),path=require("path"),fs=require("fs"),metaReg=/^\s*\/\*([\s\S]*?)\*\//m,docKeyReg=/^[\s\*]*@(path|method|params|desc|type|headers)\s*([\s\S]+)$/gi,descReg=/^\s*((["'])([^\2]+)\2|([^\s]+))\s*:\s*((['"])[^\6]+\6|[\s\S]*\/\/([^$]+))$/,encoding="UTF-8",addedPathes={},mergeData=original=>new Promise(resolve=>{let chunks=[],size=0;original.on("data",chunk=>{chunks.push(chunk),size+=chunk.length}),original.on("end",()=>{let data=null,len=chunks.length;switch(len){case 0:data=new Buffer(0);break;case 1:data=chunks[0];break;default:data=new Buffer(size);for(let i=0,pos=0;i<len;i++){let chunk=chunks[i];chunk.copy(data,pos),pos+=chunk.length}}resolve(data)})}),isApi=(pathName,opt)=>{const rules=opt.rules;Array.isArray(rules)||(rules=[rules]);for(let i=0;i<rules.length;i++)if(new RegExp(rules[i]).test(pathName))return!0;return!1},getParams=(request,query,method,isFormData,isProxy)=>{if("POST"===method){let bodyData=request.body;return bodyData?Promise.resolve([isFormData?queryString:JSON][isProxy?"stringify":"parse"](bodyData)):mergeData(request).then(data=>(isProxy||(data=(isFormData?queryString:JSON).parse(data.toString())),data))}if("GET"===method)return Promise.resolve(isProxy?JSON.stringify(query):query)},parseMeta=data=>{const meta={method:"get",type:"json"};let dt=data,matched=!0;for(;matched;)matched=!1,dt=dt.replace(metaReg,(all,contents)=>{matched=!0;let paramsMap={},hasParamMap=!1;return contents.split(/\n/).forEach(line=>{line.replace(docKeyReg,(str,type,val)=>{if("params"===type&&/^\.([^\s]+)/.test(val)){let key=RegExp.$1,columns=val.replace(/^\.([^\s]+)/,"").split(/\s*,\s*/);return columns.length>3&&(columns[2]=columns.slice(2).join(","),columns.length=3),paramsMap[key]=columns,void(hasParamMap=!0)}meta[type]=val})}),hasParamMap&&(meta.paramsMap=paramsMap),""});let respDescMap={};return dt.split(/\n/).forEach(line=>{descReg.test(line)&&RegExp.$7&&(respDescMap[RegExp.$3||RegExp.$4]=RegExp.$7)}),meta.respDescMap=respDescMap,meta},findAPIs=pathName=>{let arr=[];return fs.readdirSync(pathName).forEach(fileName=>{if(!/^\./.test(fileName)){let filePath=path.join(pathName,fileName);if(fs.statSync(filePath).isDirectory()){let apis=[],dir={name:fileName,apis:apis};arr.push(dir),fs.readdirSync(filePath).forEach(api=>{let data=fs.readFileSync(path.join(filePath,api),"utf8");apis.push(parseMeta(data))})}}}),arr},getApiDocData=configs=>{let projects=[];return configs.forEach(config=>{let mockConfig=config.mockConfig;if(mockConfig){let mockPath=mockConfig.path;if(!addedPathes[mockPath]){let rules=findAPIs(path.resolve(mockPath));projects.push({path:"",rules:rules}),addedPathes[mockPath]=!0}}}),projects};module.exports={encoding:"UTF-8",mergeData:mergeData,isApi:isApi,getParams:getParams,getApiDocData:getApiDocData};