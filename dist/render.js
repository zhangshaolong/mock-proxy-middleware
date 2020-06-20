
        module.exports = (data) => {
          data.__main__ = "!function(e){var t={};function n(r){if(t[r])return t[r].exports;var o=t[r]={i:r,l:!1,exports:{}};return e[r].call(o.exports,o,o.exports,n),o.l=!0,o.exports}n.m=e,n.c=t,n.d=function(e,t,r){n.o(e,t)||Object.defineProperty(e,t,{enumerable:!0,get:r})},n.r=function(e){\"undefined\"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:\"Module\"}),Object.defineProperty(e,\"__esModule\",{value:!0})},n.t=function(e,t){if(1&t&&(e=n(e)),8&t)return e;if(4&t&&\"object\"==typeof e&&e&&e.__esModule)return e;var r=Object.create(null);if(n.r(r),Object.defineProperty(r,\"default\",{enumerable:!0,value:e}),2&t&&\"string\"!=typeof e)for(var o in e)n.d(r,o,function(t){return e[t]}.bind(null,o));return r},n.n=function(e){var t=e&&e.__esModule?function(){return e.default}:function(){return e};return n.d(t,\"a\",t),t},n.o=function(e,t){return Object.prototype.hasOwnProperty.call(e,t)},n.p=\"\",n(n.s=26)}([function(e,t,n){\"use strict\";var r=n(3),o=n(9),s=Object.prototype.toString;function i(e){return\"[object Array]\"===s.call(e)}function a(e){return null!==e&&\"object\"==typeof e}function u(e){return\"[object Function]\"===s.call(e)}function c(e,t){if(null!=e)if(\"object\"!=typeof e&&(e=[e]),i(e))for(var n=0,r=e.length;n<r;n++)t.call(null,e[n],n,e);else for(var o in e)Object.prototype.hasOwnProperty.call(e,o)&&t.call(null,e[o],o,e)}e.exports={isArray:i,isArrayBuffer:function(e){return\"[object ArrayBuffer]\"===s.call(e)},isBuffer:o,isFormData:function(e){return\"undefined\"!=typeof FormData&&e instanceof FormData},isArrayBufferView:function(e){return\"undefined\"!=typeof ArrayBuffer&&ArrayBuffer.isView?ArrayBuffer.isView(e):e&&e.buffer&&e.buffer instanceof ArrayBuffer},isString:function(e){return\"string\"==typeof e},isNumber:function(e){return\"number\"==typeof e},isObject:a,isUndefined:function(e){return void 0===e},isDate:function(e){return\"[object Date]\"===s.call(e)},isFile:function(e){return\"[object File]\"===s.call(e)},isBlob:function(e){return\"[object Blob]\"===s.call(e)},isFunction:u,isStream:function(e){return a(e)&&u(e.pipe)},isURLSearchParams:function(e){return\"undefined\"!=typeof URLSearchParams&&e instanceof URLSearchParams},isStandardBrowserEnv:function(){return(\"undefined\"==typeof navigator||\"ReactNative\"!==navigator.product)&&(\"undefined\"!=typeof window&&\"undefined\"!=typeof document)},forEach:c,merge:function e(){var t={};function n(n,r){\"object\"==typeof t[r]&&\"object\"==typeof n?t[r]=e(t[r],n):t[r]=n}for(var r=0,o=arguments.length;r<o;r++)c(arguments[r],n);return t},extend:function(e,t,n){return c(t,(function(t,o){e[o]=n&&\"function\"==typeof t?r(t,n):t})),e},trim:function(e){return e.replace(/^\\s*/,\"\").replace(/\\s*$/,\"\")}}},function(e,t,n){e.exports=n(8)},function(e,t,n){\"use strict\";(function(t){var r=n(0),o=n(12),s={\"Content-Type\":\"application/x-www-form-urlencoded\"};function i(e,t){!r.isUndefined(e)&&r.isUndefined(e[\"Content-Type\"])&&(e[\"Content-Type\"]=t)}var a,u={adapter:((\"undefined\"!=typeof XMLHttpRequest||void 0!==t)&&(a=n(4)),a),transformRequest:[function(e,t){return o(t,\"Content-Type\"),r.isFormData(e)||r.isArrayBuffer(e)||r.isBuffer(e)||r.isStream(e)||r.isFile(e)||r.isBlob(e)?e:r.isArrayBufferView(e)?e.buffer:r.isURLSearchParams(e)?(i(t,\"application/x-www-form-urlencoded;charset=utf-8\"),e.toString()):r.isObject(e)?(i(t,\"application/json;charset=utf-8\"),JSON.stringify(e)):e}],transformResponse:[function(e){if(\"string\"==typeof e)try{e=JSON.parse(e)}catch(e){}return e}],timeout:0,xsrfCookieName:\"XSRF-TOKEN\",xsrfHeaderName:\"X-XSRF-TOKEN\",maxContentLength:-1,validateStatus:function(e){return e>=200&&e<300}};u.headers={common:{Accept:\"application/json, text/plain, */*\"}},r.forEach([\"delete\",\"get\",\"head\"],(function(e){u.headers[e]={}})),r.forEach([\"post\",\"put\",\"patch\"],(function(e){u.headers[e]=r.merge(s)})),e.exports=u}).call(this,n(11))},function(e,t,n){\"use strict\";e.exports=function(e,t){return function(){for(var n=new Array(arguments.length),r=0;r<n.length;r++)n[r]=arguments[r];return e.apply(t,n)}}},function(e,t,n){\"use strict\";var r=n(0),o=n(13),s=n(15),i=n(16),a=n(17),u=n(5);e.exports=function(e){return new Promise((function(t,c){var l=e.data,f=e.headers;r.isFormData(l)&&delete f[\"Content-Type\"];var d=new XMLHttpRequest;if(e.auth){var p=e.auth.username||\"\",h=e.auth.password||\"\";f.Authorization=\"Basic \"+btoa(p+\":\"+h)}if(d.open(e.method.toUpperCase(),s(e.url,e.params,e.paramsSerializer),!0),d.timeout=e.timeout,d.onreadystatechange=function(){if(d&&4===d.readyState&&(0!==d.status||d.responseURL&&0===d.responseURL.indexOf(\"file:\"))){var n=\"getAllResponseHeaders\"in d?i(d.getAllResponseHeaders()):null,r={data:e.responseType&&\"text\"!==e.responseType?d.response:d.responseText,status:d.status,statusText:d.statusText,headers:n,config:e,request:d};o(t,c,r),d=null}},d.onerror=function(){c(u(\"Network Error\",e,null,d)),d=null},d.ontimeout=function(){c(u(\"timeout of \"+e.timeout+\"ms exceeded\",e,\"ECONNABORTED\",d)),d=null},r.isStandardBrowserEnv()){var m=n(18),g=(e.withCredentials||a(e.url))&&e.xsrfCookieName?m.read(e.xsrfCookieName):void 0;g&&(f[e.xsrfHeaderName]=g)}if(\"setRequestHeader\"in d&&r.forEach(f,(function(e,t){void 0===l&&\"content-type\"===t.toLowerCase()?delete f[t]:d.setRequestHeader(t,e)})),e.withCredentials&&(d.withCredentials=!0),e.responseType)try{d.responseType=e.responseType}catch(t){if(\"json\"!==e.responseType)throw t}\"function\"==typeof e.onDownloadProgress&&d.addEventListener(\"progress\",e.onDownloadProgress),\"function\"==typeof e.onUploadProgress&&d.upload&&d.upload.addEventListener(\"progress\",e.onUploadProgress),e.cancelToken&&e.cancelToken.promise.then((function(e){d&&(d.abort(),c(e),d=null)})),void 0===l&&(l=null),d.send(l)}))}},function(e,t,n){\"use strict\";var r=n(14);e.exports=function(e,t,n,o,s){var i=new Error(e);return r(i,t,n,o,s)}},function(e,t,n){\"use strict\";e.exports=function(e){return!(!e||!e.__CANCEL__)}},function(e,t,n){\"use strict\";function r(e){this.message=e}r.prototype.toString=function(){return\"Cancel\"+(this.message?\": \"+this.message:\"\")},r.prototype.__CANCEL__=!0,e.exports=r},function(e,t,n){\"use strict\";var r=n(0),o=n(3),s=n(10),i=n(2);function a(e){var t=new s(e),n=o(s.prototype.request,t);return r.extend(n,s.prototype,t),r.extend(n,t),n}var u=a(i);u.Axios=s,u.create=function(e){return a(r.merge(i,e))},u.Cancel=n(7),u.CancelToken=n(24),u.isCancel=n(6),u.all=function(e){return Promise.all(e)},u.spread=n(25),e.exports=u,e.exports.default=u},function(e,t){\n/*!\n * Determine if an object is a Buffer\n *\n * @author   Feross Aboukhadijeh <https://feross.org>\n * @license  MIT\n */\ne.exports=function(e){return null!=e&&null!=e.constructor&&\"function\"==typeof e.constructor.isBuffer&&e.constructor.isBuffer(e)}},function(e,t,n){\"use strict\";var r=n(2),o=n(0),s=n(19),i=n(20);function a(e){this.defaults=e,this.interceptors={request:new s,response:new s}}a.prototype.request=function(e){\"string\"==typeof e&&(e=o.merge({url:arguments[0]},arguments[1])),(e=o.merge(r,{method:\"get\"},this.defaults,e)).method=e.method.toLowerCase();var t=[i,void 0],n=Promise.resolve(e);for(this.interceptors.request.forEach((function(e){t.unshift(e.fulfilled,e.rejected)})),this.interceptors.response.forEach((function(e){t.push(e.fulfilled,e.rejected)}));t.length;)n=n.then(t.shift(),t.shift());return n},o.forEach([\"delete\",\"get\",\"head\",\"options\"],(function(e){a.prototype[e]=function(t,n){return this.request(o.merge(n||{},{method:e,url:t}))}})),o.forEach([\"post\",\"put\",\"patch\"],(function(e){a.prototype[e]=function(t,n,r){return this.request(o.merge(r||{},{method:e,url:t,data:n}))}})),e.exports=a},function(e,t){var n,r,o=e.exports={};function s(){throw new Error(\"setTimeout has not been defined\")}function i(){throw new Error(\"clearTimeout has not been defined\")}function a(e){if(n===setTimeout)return setTimeout(e,0);if((n===s||!n)&&setTimeout)return n=setTimeout,setTimeout(e,0);try{return n(e,0)}catch(t){try{return n.call(null,e,0)}catch(t){return n.call(this,e,0)}}}!function(){try{n=\"function\"==typeof setTimeout?setTimeout:s}catch(e){n=s}try{r=\"function\"==typeof clearTimeout?clearTimeout:i}catch(e){r=i}}();var u,c=[],l=!1,f=-1;function d(){l&&u&&(l=!1,u.length?c=u.concat(c):f=-1,c.length&&p())}function p(){if(!l){var e=a(d);l=!0;for(var t=c.length;t;){for(u=c,c=[];++f<t;)u&&u[f].run();f=-1,t=c.length}u=null,l=!1,function(e){if(r===clearTimeout)return clearTimeout(e);if((r===i||!r)&&clearTimeout)return r=clearTimeout,clearTimeout(e);try{r(e)}catch(t){try{return r.call(null,e)}catch(t){return r.call(this,e)}}}(e)}}function h(e,t){this.fun=e,this.array=t}function m(){}o.nextTick=function(e){var t=new Array(arguments.length-1);if(arguments.length>1)for(var n=1;n<arguments.length;n++)t[n-1]=arguments[n];c.push(new h(e,t)),1!==c.length||l||a(p)},h.prototype.run=function(){this.fun.apply(null,this.array)},o.title=\"browser\",o.browser=!0,o.env={},o.argv=[],o.version=\"\",o.versions={},o.on=m,o.addListener=m,o.once=m,o.off=m,o.removeListener=m,o.removeAllListeners=m,o.emit=m,o.prependListener=m,o.prependOnceListener=m,o.listeners=function(e){return[]},o.binding=function(e){throw new Error(\"process.binding is not supported\")},o.cwd=function(){return\"/\"},o.chdir=function(e){throw new Error(\"process.chdir is not supported\")},o.umask=function(){return 0}},function(e,t,n){\"use strict\";var r=n(0);e.exports=function(e,t){r.forEach(e,(function(n,r){r!==t&&r.toUpperCase()===t.toUpperCase()&&(e[t]=n,delete e[r])}))}},function(e,t,n){\"use strict\";var r=n(5);e.exports=function(e,t,n){var o=n.config.validateStatus;n.status&&o&&!o(n.status)?t(r(\"Request failed with status code \"+n.status,n.config,null,n.request,n)):e(n)}},function(e,t,n){\"use strict\";e.exports=function(e,t,n,r,o){return e.config=t,n&&(e.code=n),e.request=r,e.response=o,e}},function(e,t,n){\"use strict\";var r=n(0);function o(e){return encodeURIComponent(e).replace(/%40/gi,\"@\").replace(/%3A/gi,\":\").replace(/%24/g,\"$\").replace(/%2C/gi,\",\").replace(/%20/g,\"+\").replace(/%5B/gi,\"[\").replace(/%5D/gi,\"]\")}e.exports=function(e,t,n){if(!t)return e;var s;if(n)s=n(t);else if(r.isURLSearchParams(t))s=t.toString();else{var i=[];r.forEach(t,(function(e,t){null!=e&&(r.isArray(e)?t+=\"[]\":e=[e],r.forEach(e,(function(e){r.isDate(e)?e=e.toISOString():r.isObject(e)&&(e=JSON.stringify(e)),i.push(o(t)+\"=\"+o(e))})))})),s=i.join(\"&\")}return s&&(e+=(-1===e.indexOf(\"?\")?\"?\":\"&\")+s),e}},function(e,t,n){\"use strict\";var r=n(0),o=[\"age\",\"authorization\",\"content-length\",\"content-type\",\"etag\",\"expires\",\"from\",\"host\",\"if-modified-since\",\"if-unmodified-since\",\"last-modified\",\"location\",\"max-forwards\",\"proxy-authorization\",\"referer\",\"retry-after\",\"user-agent\"];e.exports=function(e){var t,n,s,i={};return e?(r.forEach(e.split(\"\\n\"),(function(e){if(s=e.indexOf(\":\"),t=r.trim(e.substr(0,s)).toLowerCase(),n=r.trim(e.substr(s+1)),t){if(i[t]&&o.indexOf(t)>=0)return;i[t]=\"set-cookie\"===t?(i[t]?i[t]:[]).concat([n]):i[t]?i[t]+\", \"+n:n}})),i):i}},function(e,t,n){\"use strict\";var r=n(0);e.exports=r.isStandardBrowserEnv()?function(){var e,t=/(msie|trident)/i.test(navigator.userAgent),n=document.createElement(\"a\");function o(e){var r=e;return t&&(n.setAttribute(\"href\",r),r=n.href),n.setAttribute(\"href\",r),{href:n.href,protocol:n.protocol?n.protocol.replace(/:$/,\"\"):\"\",host:n.host,search:n.search?n.search.replace(/^\\?/,\"\"):\"\",hash:n.hash?n.hash.replace(/^#/,\"\"):\"\",hostname:n.hostname,port:n.port,pathname:\"/\"===n.pathname.charAt(0)?n.pathname:\"/\"+n.pathname}}return e=o(window.location.href),function(t){var n=r.isString(t)?o(t):t;return n.protocol===e.protocol&&n.host===e.host}}():function(){return!0}},function(e,t,n){\"use strict\";var r=n(0);e.exports=r.isStandardBrowserEnv()?{write:function(e,t,n,o,s,i){var a=[];a.push(e+\"=\"+encodeURIComponent(t)),r.isNumber(n)&&a.push(\"expires=\"+new Date(n).toGMTString()),r.isString(o)&&a.push(\"path=\"+o),r.isString(s)&&a.push(\"domain=\"+s),!0===i&&a.push(\"secure\"),document.cookie=a.join(\"; \")},read:function(e){var t=document.cookie.match(new RegExp(\"(^|;\\\\s*)(\"+e+\")=([^;]*)\"));return t?decodeURIComponent(t[3]):null},remove:function(e){this.write(e,\"\",Date.now()-864e5)}}:{write:function(){},read:function(){return null},remove:function(){}}},function(e,t,n){\"use strict\";var r=n(0);function o(){this.handlers=[]}o.prototype.use=function(e,t){return this.handlers.push({fulfilled:e,rejected:t}),this.handlers.length-1},o.prototype.eject=function(e){this.handlers[e]&&(this.handlers[e]=null)},o.prototype.forEach=function(e){r.forEach(this.handlers,(function(t){null!==t&&e(t)}))},e.exports=o},function(e,t,n){\"use strict\";var r=n(0),o=n(21),s=n(6),i=n(2),a=n(22),u=n(23);function c(e){e.cancelToken&&e.cancelToken.throwIfRequested()}e.exports=function(e){return c(e),e.baseURL&&!a(e.url)&&(e.url=u(e.baseURL,e.url)),e.headers=e.headers||{},e.data=o(e.data,e.headers,e.transformRequest),e.headers=r.merge(e.headers.common||{},e.headers[e.method]||{},e.headers||{}),r.forEach([\"delete\",\"get\",\"head\",\"post\",\"put\",\"patch\",\"common\"],(function(t){delete e.headers[t]})),(e.adapter||i.adapter)(e).then((function(t){return c(e),t.data=o(t.data,t.headers,e.transformResponse),t}),(function(t){return s(t)||(c(e),t&&t.response&&(t.response.data=o(t.response.data,t.response.headers,e.transformResponse))),Promise.reject(t)}))}},function(e,t,n){\"use strict\";var r=n(0);e.exports=function(e,t,n){return r.forEach(n,(function(n){e=n(e,t)})),e}},function(e,t,n){\"use strict\";e.exports=function(e){return/^([a-z][a-z\\d\\+\\-\\.]*:)?\\/\\//i.test(e)}},function(e,t,n){\"use strict\";e.exports=function(e,t){return t?e.replace(/\\/+$/,\"\")+\"/\"+t.replace(/^\\/+/,\"\"):e}},function(e,t,n){\"use strict\";var r=n(7);function o(e){if(\"function\"!=typeof e)throw new TypeError(\"executor must be a function.\");var t;this.promise=new Promise((function(e){t=e}));var n=this;e((function(e){n.reason||(n.reason=new r(e),t(n.reason))}))}o.prototype.throwIfRequested=function(){if(this.reason)throw this.reason},o.source=function(){var e;return{token:new o((function(t){e=t})),cancel:e}},e.exports=o},function(e,t,n){\"use strict\";e.exports=function(e){return function(t){return e.apply(null,t)}}},function(e,t,n){\"use strict\";n.r(t);var r=n(1),o=n.n(r);o.a.defaults.timeout=6e4,o.a.defaults.headers[\"x-requested-with\"]=\"XMLHttpRequest\";const s=o.a.CancelToken;let i=/\\{([^\\}]+)\\}/g,a={},u=()=>{},c=()=>{},l=()=>{},f=e=>{let t=e.code;if(302===t);else if(403!==t)return 200===t||0===t},d=e=>e;const p=function(){const e=[];return{add:t=>{e.push(t)},remove:t=>{for(let n=0;n<e.length;n++)if(e[n]===t)return void e.splice(n,1)},clear:()=>{for(;e.length;)e.pop().cancel()}}}();o.a.interceptors.response.use(e=>e,e=>{if(o.a.isCancel(e))throw e;return l(e)});const h=(e,t,n,r)=>{let l,h=n.context;h&&u(h);let m=n.sync,g=n.headers,y=n.timeout,v=n.responseType||\"json\";const w=new Promise((u,x)=>{let b={url:e,method:r,cancelToken:new s(e=>{l=e})};g&&(b.headers=g),y&&(b.timeout=y),b.responseType=v,\"GET\"===r?b.params=t:(b.data=t,b.transformRequest=[(e,t)=>{if(e){let n=t[\"Content-Type\"]||t.post[\"Content-Type\"];if(n){if(n.indexOf(\"application/json\")>-1)return JSON.stringify(e);if(n.indexOf(\"application/x-www-form-urlencoded\")>-1){let t=\"\";for(let n in e)t+=\"&\"+encodeURIComponent(n)+\"=\"+encodeURIComponent(e[n]);if(t)return t.substr(1)}return e}}}]),b=d(b);const T=(e,s)=>{const a=t=>{h&&(c(h),delete n.context),f(t)?e(!0,t,s):e(!1,t,s)},u=t=>{h&&(c(h),delete n.context),o.a.isCancel(t)||e(!1,t,s)};let l=b.url,d=l,g=!1;if(l=l.replace(i,(e,n)=>(g=!0,t[n])),g&&(t.__url__=d,b.url=l),m){let e=new XMLHttpRequest;if(\"GET\"===r){let e=[];for(let n in t)e.push(encodeURIComponent(n)+\"=\"+encodeURIComponent(t[n]));e.length&&(l+=\"?\"+e.join(\"&\"))}y&&(e.timeout=y),e.open(r,l,!1);let n=Object.assign({},o.a.defaults.headers[r.toLowerCase()]);for(let t in n)e.setRequestHeader(t,n[t]);if(b.headers)for(let t in b.headers)e.setRequestHeader(t,b.headers[t]);\"POST\"===r?e.send(b.transformRequest[0](t,o.a.defaults.headers)):e.send();try{a(JSON.parse(e.responseText))}catch(e){u(e)}p.remove(w)}else o()(b).then(e=>{a(e.data)}).catch(u).finally(()=>{p.remove(w)})};if(n.ignoreBefore){e=e.split(\"?\")[0];const t=(t,n,r)=>{s.ts===r&&(s=a[e]=null,delete a[e],t?u(n):x(n))};let r=(new Date).getTime(),o=n.ignoreDelay||50,s=a[e];s?\"todo\"===s.status?(clearTimeout(s.timer),s.timer=setTimeout(()=>{T(t,r),s.status=\"doing\"},o)):\"doing\"===s.status&&T(t,r):(s={status:\"todo\"}).timer=setTimeout(()=>{T(t,r),s.status=\"doing\"},o),s.ts=r}else T((e,t)=>{e?u(t):x(t)})});return w.cancel=e=>{l(e),p.remove(w)},p.add(w),w};var m={config:e=>{e.showLoading&&(u=e.showLoading),e.hideLoading&&(c=e.hideLoading),e.dealError&&(l=e.dealError),e.checkStatus&&(f=e.checkStatus),e.globalContextType&&(o.a.defaults.headers.post[\"Content-Type\"]=e.globalContextType),e.beforeSend&&(d=e.beforeSend)},get:(e,t={},n={})=>h(e,t,n,\"GET\"),post:(e,t={},n={})=>h(e,t,n,\"POST\"),jsonp:(e,t={},n={})=>{let r=n.callbackKey||\"callback\";const o=document.createElement(\"script\");document.body.appendChild(o);const s=\"cb\"+(new Date).getTime()+\"_\"+(\"\"+Math.random()).substr(2,8);return new Promise((n,i)=>{window[s]=e=>{n(e),document.body.removeChild(o),window[s]=null,delete window[s]},o.onerror=e=>{i(e.message),document.body.removeChild(o),window[s]=null,delete window[s]},e+=(e.indexOf(\"?\")>-1?\"&\":\"?\")+`${r}=${s}`;let a=\"\";for(let e in t)a+=`&${encodeURIComponent(e)}=${encodeURIComponent(t[e])}`;o.src=e+a})},clear(){p.clear()}};const g=(e,t=!0,n,r)=>{if(null==e)return\"\"+e;n=null!=n?n:\"  \",r=r||\"\";var o=e.constructor;if(o===String)return t?'<span class=\"json-string-value\">\"'+e+'\"</span>':'\"'+e+'\"';if(o===Number||o===Boolean)return t?'<span class=\"json-number-value\">'+e+\"</span>\":e;if(o===Array){var s=t?'<span class=\"json-array-tag\">[</span>\\n':\"[\\n\",i=e.length;if(i){for(var a=0;a<i-1;a++)s+=r+n+g(e[a],t,n,r+n)+\",\\n\";s+=r+n+g(e[i-1],t,n,r+n)+\"\\n\"}return s+r+(t?'<span class=\"json-array-tag\">]</span>':\"]\")}if(o===Object){var u=t?'<span class=\"json-object-tag\">{</span>\\n':\"{\\n\",c=!0;for(var l in e)c=!1,u+=r+n+(t?'<span class=\"json-object-key\">\"'+l+'\"</span>':'\"'+l+'\"')+\": \"+g(e[l],t,n,r+n)+\",\\n\";return c||(u=u.slice(0,-2)+\"\\n\"),u+r+(t?'<span class=\"json-object-tag\">}</span>':\"}\")}},y={showLoading:(e,t)=>{let n=e.dataset._loadingCount||0;if(e.dataset._loadingCount=++n,1===n){e.classList.add(\"loading\");let n=document.createElement(\"center\");n.className=\"mask\",n.style.cssText=\"position:absolute;top:0;right:0;bottom:0;left:0;z-index:1000;\",e.appendChild(n);const r=\"@keyframes loading-css {\\n      0%, 80%, 100% {\\n        transform: scale(0);\\n      }\\n      40% {\\n        transform: scale(1);\\n      }\\n    }\",o=document.createElement(\"style\");o.type=\"text/css\",o.innerHTML=r,n.appendChild(o);let s=document.createElement(\"div\");s.style.cssText=\"position:absolute;width:100%;height:40px;top:50%;margin-top:-20px;\";for(let e=0;e<12;e++){let t=document.createElement(\"div\"),n=\"\",r=\"\";e&&(n=\"animation-delay:\"+(.1*e-1.2)+\"s;\",r=\"transform:rotate(\"+30*e+\"deg);\"),t.style.cssText=\"width:5px;height:5px;background-color:#333;border-radius:100%;animation:loading-css 1.2s infinite ease-in-out both;\"+n;let o=document.createElement(\"div\");o.style.cssText=\"position:absolute;top:0;right:0;bottom:0;left:0;\"+r,s.appendChild(o),o.appendChild(t)}if(n.appendChild(s),t){let e=document.createElement(\"div\");e.innerHTML=t,e.className=\"tip\",e.style.cssText=\"position:absolute;top:50%;margin-top:25px;left:0;right:0;text-align:center;\",s.appendChild(e)}n.onclick=function(e){e.stopPropagation()}}},hideLoading:e=>{if(--e.dataset._loadingCount<=0){e.classList.remove(\"loading\");let t=null;for(let n=0;n<e.children.length;n++)if(e.children[n].classList.contains(\"mask\")){t=e.children[n];break}t&&e.removeChild(t)}},checkStatus:e=>!0,dealError:e=>!0},v=function(e){let t=arguments.length;if(1===t){let t={};return e.replace(/(?:\\?|&|^)([^=]+)=([^&$]*)/g,(e,n,r)=>{t[n]=decodeURIComponent(r)}),t}if(2===t){let t=new RegExp(\"(?:\\\\?|&|^)\"+arguments[1]+\"=([^&$]*)\").exec(e);return t&&decodeURIComponent(t[1])}},w={form:\"application/x-www-form-urlencoded;charset=utf-8\",formdata:\"multipart/form-data\",json:\"application/json;charset=utf-8\"};var x;m.config(Object.assign({},y,x));const b=(e,t)=>{if(t)return t.parentNode===e||t===e||b(e,t.parentNode)};let T={};window.onload=()=>{let e=APIDATA,t={},n=document.getElementById(\"result\");e.forEach(e=>{let n=e.path;e.rules.forEach(e=>{let r=e.name;e.apis.forEach(e=>{let o=e.path;t[n+r+o]=e})})}),document.querySelectorAll(\".folder\").forEach(e=>{e.onclick=t=>{t.target===e.firstChild&&e.classList.toggle(\"closed\")}}),document.querySelectorAll(\".view\").forEach(e=>{e.onclick=r=>{if(r.stopPropagation(),r.preventDefault(),r.target===e){let o=e.dataset.id,s=t[o];T=s.respDescMap;let i,a=document.querySelector('[name=\"'+o+'\"]:checked').value,u=document.getElementById(o+\"-textarea\");if(u&&(i=u.value.trim(),i))if(/^\\s*\\{/.test(i))try{i=Function(\"return \"+i)()}catch(r){}else i=v(i);let c={context:document.body},l=document.getElementById(o+\"-headers\"),f={};if(l&&(f=l.value.trim(),f))if(/^\\s*\\{/.test(f))try{f=Function(\"return \"+f)()}catch(r){}else f=v(f);s.type&&(f[\"Content-Type\"]=w[s.type]),c.headers=f,m[a](s.path,i,c).then(e=>{n.innerHTML=g(e),n.classList.remove(\"hide\"),n.style.marginLeft=-n.clientWidth/2+\"px\",n.style.marginTop=-n.clientHeight/2+\"px\",n.querySelectorAll(\".json-object-key\").forEach(e=>{let t=T[e.innerHTML.trim()];if(t){let n=e.nextElementSibling.nextSibling;n&&3===n.nodeType&&(n.nodeValue=n.nodeValue.replace(/^(,)?([^$]+)$/,(e,n,r)=>(n||\"\")+\" //\"+t+r))}})})}}}),document.onclick=e=>{b(result,e.target)||result.classList.add(\"hide\")}}}]);"
          return Function('_this',"\"use strict\"\nvar _t=this,_o=\"<!DOCTYPE html><html><head><meta charset=\\\"UTF-8\\\" \\/><meta name=\\\"viewport\\\" content=\\\"width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no\\\"\\/><style type=\\\"text\\/css\\\"> table { border: 1px solid #e8e8e8; border-right: 0; border-bottom: 0; width: 100%; border-collapse: collapse; text-align: left; border-radius: 4px 4px 0 0; text-align: center; } th { background: #fafafa; } td { border-bottom: 1px solid #e8e8e8; border-right: 1px solid #e8e8e8; padding: 6px; } textarea { width: 100%; outline: none; resize: none; border-color: #ddd; box-sizing: border-box; padding: 4px; } .title { font-weight: bold; margin-right: 5px; } #result { position: fixed; top: 50%; left: 50%; padding: 15px; border: 1px solid #eee; background: #fff; box-shadow: 4px 4px 10px #ddd; max-height: 500px; max-width: 800px; overflow: auto; } .hide { display: none; } .folder > div:first-child:before { vertical-align: top; content: '-'; color: #1890ff; line-height: 20px; margin-right: 5px; } .folder.closed > div:first-child:before { content: '+'; } .folder.closed > div:nth-child(n+2) { display: none; } .view { padding: 1px 10px; background: #3bc3ff; border-radius: 4px; color: #fff; cursor: pointer; margin-right: 10px; } pre { font-family: Consolas, 'Courier New', Courier, FreeMono, monospace, 'Helvetica Neue', 'PingFang SC', 'Hiragino Sans GB', Helvetica, Arial, sans-serif; text-align: left; } pre .json-string-value { color: #007777; } pre .json-number-value { color: #AA00AA; white-space: pre-line; word-wrap: break-word; } pre .json-array-tag { color: #0033FF; font-weight: bold; } pre .json-object-tag { color: #00AA00; font-weight: bold; } pre .json-object-key { color: #CC0000; font-weight: bold; } a { color: #1890ff; background-color: transparent; text-decoration: none; outline: none; cursor: pointer; transition: color 0.3s; -webkit-text-decoration-skip: objects; } a:focus { text-decoration: underline; -webkit-text-decoration-skip: ink; text-decoration-skip-ink: auto; } a:hover { color: #40a9ff; } a:active { color: #096dd9; } a:active, a:hover { outline: 0; text-decoration: none; } a[disabled] { color: rgba(0, 0, 0, 0.25); cursor: not-allowed; pointer-events: none; } <\\/style><script> let APIDATA = \"+_t.defaultAttr( JSON.stringify(_this) )+\" <\\/script><\\/head><body><center style=\\\"font-size: 18px; font-weight: bold; margin-bottom: 20px;\\\">API接口列表<\\/center>\";for (let p = 0; p < _this.length; p++) { let project = _this[p].path && _this[p].path.split('/').pop(); let rules = _this[p].rules;\n_o+=\"<div class=\\\"folder\\\" style=\\\"display: inline-block; vertical-align: top; margin: 10px; padding: 10px; border: 1px solid #eee;\\\"><div style=\\\"font-size: 17px; font-weight: bold; margin-bottom: 10px; display: inline-block;\\\">Project: \"+_t.defaultAttr( project )+\"<\\/div>\";for (let i = 0; i < rules.length; i++) { let item = rules[i]; let prefix = item.name; let apis = item.apis;\n_o+=\"<div class=\\\"folder\\\" style=\\\"margin-left: 20px;\\\"><div style=\\\"font-size: 16px; font-weight: bold; display: inline-block;\\\">\"+_t.defaultAttr( prefix )+\" <\\/div>\";for (let j = 0; j < apis.length; j++) { let meta = apis[j];\n_o+=\"<div style=\\\"border: 1px solid #eee; padding: 5px 10px;\\\"><div style=\\\"font-size: 14px; line-height: 30px;\\\"><span class=\\\"view\\\" data-id=\\\"\"+_t.defaultAttr( project + prefix + meta.path)+\"\\\">Postman<\\/span><a href=\\\"\"+_t.defaultAttr( meta.path )+\"\\\" target=\\\"_blank\\\">\"+_t.defaultAttr( meta.path )+\"<\\/a><\\/div>\";if (meta.desc) {\n_o+=\"<div style=\\\"font-size: 12px; line-height: 20px;\\\"><span class=\\\"title\\\">Desc<\\/span> \"+_t.defaultAttr( meta.desc )+\"<\\/div>\";}\n_o+=\"<div style=\\\"font-size: 12px; line-height: 20px;\\\"><span class=\\\"title\\\">Method<\\/span>\";if (/get/i.test(meta.method)) {\n_o+=\"<label style=\\\"margin-right: 10px;\\\">get<input type=\\\"radio\\\" name=\\\"\"+_t.defaultAttr( project + prefix + meta.path)+\"\\\" value=\\\"get\\\" checked><\\/label>\";}\n_o+=\"\";if (/post/i.test(meta.method)) {\n_o+=\"<label>post<input type=\\\"radio\\\" name=\\\"\"+_t.defaultAttr( project + prefix + meta.path)+\"\\\" value=\\\"post\\\" checked><\\/label>\";}\n_o+=\"<\\/div>\";if (meta.type) {\n_o+=\"<div style=\\\"font-size: 12px; line-height: 20px;\\\"><span class=\\\"title\\\">Type<\\/span>\"+_t.defaultAttr( meta.type )+\"<\\/div>\";}\n_o+=\"\";if (meta.params || meta.paramsMap) { let params = meta.params; let paramsMap = meta.paramsMap;\n_o+=\"<div style=\\\"font-size: 12px; line-height: 20px;\\\"><span class=\\\"title\\\">Params<\\/span>\";if (params) {\n_o+=\"<textarea id=\\\"\"+_t.defaultAttr( project + prefix + meta.path )+\"-textarea\\\">\"+_t.defaultAttr( meta.params || '' )+\"<\\/textarea>\";}\n_o+=\"\";if (paramsMap) {\n_o+=\"<table><thead><tr><th>字段<\\/th><th>类型<\\/th><th>是否必填<\\/th><th>描述<\\/th><\\/tr><\\/thead>\";for (let key in paramsMap) { let cls = paramsMap[key];\n_o+=\"<tr><td>\"+_t.defaultAttr( key )+\"<\\/td>\";cls.forEach((cl) => {\n_o+=\"<td>\"+_t.defaultAttr( cl )+\"<\\/td>\";})\n_o+=\"<\\/tr>\";}\n_o+=\"<\\/table>\";}\n_o+=\"<\\/div>\";}\n_o+=\"\";if (meta.headers) {\n_o+=\"<div style=\\\"font-size: 12px; line-height: 20px;\\\"><span class=\\\"title\\\">Headers<\\/span><textarea id=\\\"\"+_t.defaultAttr( project + prefix + meta.path )+\"-headers\\\">\"+_t.defaultAttr( meta.headers )+\"<\\/textarea><\\/div>\";}\n_o+=\"<\\/div>\";}\n_o+=\"<\\/div>\";}\n_o+=\"<\\/div>\";}\n_o+=\"<pre id=\\\"result\\\" class=\\\"hide\\\"><\\/pre><script>\"+_t.defaultAttr(_this.__main__)+\"<\\/script><\\/body><\\/html>\";return _o;").call({defaultAttr:v=>v},data);
        }
      