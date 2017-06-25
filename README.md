# mock-proxy-middleware
前后端分析项目中的本地mock及远程代理

    install
    npm install mock-proxy-middleware --save-dev

```javascript
var mockMiddleware = require('mock-proxy-middleware')
```
if you use express server, you can use it like here:
```javascript
var app = express()

app.use(mockMiddleware({
  apiConfig: {
    type: 'prefix', // prefix or suffix
    value: ['/api/', '/common-api/'] // string or array like ['/api/', ...]
  },
  ignoreProxyPaths: { // when use proxy mode, this apis use local mode
    '/api/a/b/c': 1,
    '/api/get_index_data': 1,
    '/api/user_info': 1
  },
  mockPath: 'mock' // project`s mock dir name， default 'mock'
}));
```
for example，a api like '/common-api/get_user_info', you can define a js file at
${project}/mock/common-api/get_user_info.js, it`s content like
```javascript
function (params) {
    return {
        err_no: 0,
        err_msg: '',
        sleep: 1000, // mock 1 second delay
        data: {
            name: 'zhangsan'
        }
    }
}
```
or
```javascript
{
    err_no: 0,
    err_msg: '',
    data: {
        name: 'zhangsan'
    }
}
```
for example another, a api like '/api/a/b/c', you can define a js file at
${project}/mock/api/a_b_c.js

if you use gulp-connect server, you can use it like here:
```javascript
var connect = require('gulp-connect');
connect.server({
    host: host,
    port: port,
    root: ['/'],
    middleware: function(connect, opt) {
        return [
            mockMiddleware({
                apiConfig: {
                    type: 'prefix', // prefix or suffix
                    value: ['/api/', '/common-api/'] // string or array like ['/api/', ...]
                },
                ignoreProxyPaths: { // when use proxy mode, this apis use local mode
                    '/api/a/b/c': 1,
                    '/api/get_index_data': 1,
                    '/api/user_info': 1
                },
                mockPath: 'mock' // project`s mock dir name， default 'mock'
            })
        ];
    }
});
```
    proxy mode
    you can set param proxy=xxx.xxx.com:${prot} for current page, then all api proxy to server xxx.xxx.com, if you want use some api local mode, you can set ignoreProxyPaths config
