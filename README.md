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

app.use(mockMiddleware(
  [{
    rules: ['^/api/', '^/common-api/'], // 字符串规则和正则规则
    proxyConfig: {
      host: '12.12.12.12',
      port: 8080,
      isHttps: false, // 是否以https协议进行转发，代理的时候会根据配置选择协议，这里配置的isHttps优先级最高，如果这里没设置，那么协议和源协议一致
      timeout: 30000, // ms, default 3000ms
      headers: { // 可以设置一些header信息到代理服务器
        cookie: 'xxxx'
      },
      redirect: (path) => { // could config rredirect path for remote api
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
  }],
  '/xxx/xxx/personal_path_config.js' // 可选参数，可以设置为一个绝对路径的config path，设置的规则会覆盖第一个配置的相同rule对应的配置。为了解决多人协作代码冲突问题，这个文件需要设置为gitignore文件
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
connect.server({
    host: host,
    port: port,
    root: ['/'],
    middleware: function(connect, opt) {
        return [
            mockMiddleware([{
                rules: ['^/api/', /^\/common-api\//] // string or regexp like ['^/api/', ...],
                proxyConfig: { // proxy mode
                    host: '1.1.1.1',
                    port: 8080
                },
                mockConfig: {}
            }])
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
  before: function(app) {
    app.use(mockProxyMiddleware(mockProxyFilePath)) // if set a path of config, config is immediate effect
  }
}
```
if you look at all of apis at this project, input 'https?:{host}/show-apis', need has mock file and meta about api description

scaffold is a demo project with mock proxy tool [scaffold](https://github.com/zhangshaolong/scaffold "scaffold lib")

serverany is a local static server with the mock proxy tool [serverany](https://github.com/zhangshaolong/serverany "serverany")

