# mock-proxy-middleware

前后端分离项目中的本地mock及远程代理

install
```shell
npm install mock-proxy-middleware --save-dev
```

```javascript
var mockMiddleware = require('mock-proxy-middleware')
```

define config /xxx/config.js
```javascript
module.exports = [
  {
    rules: ['^/api/', ^/common-api/], // array，typeof string or regexp
    rules: '^/api/', // string or regexp
    proxyConfig: {
      host: '12.12.12.12',
      port: 8080,
      isHttps: false, // default the same with original
      timeout: 30000, // ms, default 30000ms
      headers: { // set custom headers to proxy server, default proxy original headers
        cookie: 'xxxx'
      },
      redirect: (path) => { // could config redirect path for remote api
        return path
      },
      excludes: [ // when use proxy mode, this apis use local mode
        '^/api/get_index_data/', // string
        /^\/api\/user_info/ // regexp
      ],
      fillMissingMock: false // fill missing mock file when lost
    },
    mockConfig: {
      path: 'mock', // project`s mock dir name， default 'mock'
      ext: '.js'
    }
  }
]
```
if you use express server, you can use it like here:
```javascript
var app = express()
var config = require('/xxx/config')

app.use(mockMiddleware(config));

app.use(mockMiddleware(
  '/xxx/config.js' // if set the config path as first param，the change is immediate effect when modify config
));

app.use(mockMiddleware(
  config,
  '/xxx/xxx/personal_path_config.js' // optional，prevent modification conflicts, could set the second param as self config, add this config file to .gitignore file
));

app.use(mockMiddleware(
  '/xxx/config.js',
  '/xxx/personal_path_config.js'
));
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
if you want to cache mock status by context, you can do it like this:

```javascript
let times = 0
return function (params) { // this 'return' is required
  return {
    code: xxx,
    data: {
      times: times++ // this can cache prev value
    }
  }
}
```
for example another, a api like '/api/a/b/c', you can define a js file at
${project}/mock/api/a_b_c.js
if you use gulp-connect server, you can use it like here:

```javascript
var connect = require('gulp-connect');
var config = require('/xxx/config');
connect.server({
    host: host,
    port: port,
    root: ['/'],
    middleware: function(connect, opt) {
        return [
            mockMiddleware(config || '/xxx/config')  // if set a path of config, config is immediate effect
        ];
    }
});
```
if you use webpack-dev-server, you can use it like here on webpack.config.js:

```javascript
var config = require('/xxx/config');
devServer: {
  contentBase: '/dist',
  port: 8888,
  historyApiFallback: true,
  inline: true,
  before: function(app) {
    app.use(mockProxyMiddleware(config || '/xxx/config')) // if set a path of config, config is immediate effect
  }
}
```
if you look at all of apis at this project, input 'https?:{host}/show-apis', need has mock file and meta about api description

scaffold is a demo project with mock proxy tool [scaffold](https://github.com/zhangshaolong/scaffold "scaffold lib")

serverany is a local static server with the mock proxy tool [serverany](https://github.com/zhangshaolong/serverany "serverany")

[qa mock for test demo](https://github.com/zhangshaolong/mock-proxy-tool "mock demo")

注意：2.0+版本针对参数做了一些格式调整，不兼容低版本，如果需要低版本请找对应版本(1.9.30)npm包

