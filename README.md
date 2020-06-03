# mock-proxy-middleware
前后端分离项目中的本地mock及远程代理
注意：2.0+版本针对参数做了一些格式调整，不兼容低版本，如果需要低版本请找对应版本(1.9.30)npm包

[qa mock for test demo](https://github.com/zhangshaolong/mock-proxy-tool "mock demo")

    install
    npm install mock-proxy-middleware --save-dev

```javascript
var mockMiddleware = require('mock-proxy-middleware')
```
if you use express server, you can use it like here:
```javascript
var app = express()

app.use(mockMiddleware({
  type: 'prefix', // prefix or suffix
  rules: ['/api/', '/common-api/'], // string or array like ['/api/', ...]
  proxyConfig: {
    host: '12.12.12.12',
    port: 8080,
    isHttps: false, // 是否以https协议进行转发，代理的时候会根据配置选择协议，这里配置的isHttps优先级最高，如果这里没设置，那么协议和源协议一致
    timeout: 30000, // ms, default 3000ms
    redirect: (path) => { // could config rredirect path for remote api
      return path
    },
    ignorePaths: { // when use proxy mode, this apis use local mode
      '/api/get_index_data': 1,
      '/api/user_info': 'aaa.bbb.ccc:8080' // you can set other host and port for muti porxy mode
    }
  },
  mockConfig: {
    path: 'mock', // project`s mock dir name， default 'mock'
    ext: '.js'
  }

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
                type: 'prefix', // prefix or suffix
                value: ['/api/', '/common-api/'] // string or array like ['/api/', ...],
                proxyConfig: { // proxy mode
                    host: '1.1.1.1',
                    port: 8080
                },
                mockConfig: {}
            })
        ];
    }
});
```
if you use webpack-dev-server, you can use it like here on webpack.config.js:
```javascript
devServer: {
  contentBase: '/dist',
  port: 8888,
  historyApiFallback: true,
  inline: true,
  setup: function(app) {
    app.use(mockProxyMiddleware(mockProxyConfig))
  }
}
```
if you want to cache mock status by prev request, you can do it like this:
```javascript
let times = 0
return function () {
  return {
    code: xxx,
    data: {
      times: times++ // this can cache prev value
    }
  }
}
```
scaffold is a demo project with mock proxy tool [scaffold](https://github.com/zhangshaolong/scaffold "scaffold lib")
