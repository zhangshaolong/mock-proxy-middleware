# mock-proxy-middleware
前后端分析项目中的本地mock及远程代理


var mockMiddleware = require('mock-proxy-middleware')

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

for example，a api like '/common-api/get_user_info', you can define a js file at
${project}/mock/common-api/get_user_info.js, it`s content like
function (params) {
    return {
        err_no: 0,
        err_msg: '',
        data: {
            name: 'zhangsan'
        }
    }
}
or
{
    err_no: 0,
    err_msg: '',
    data: {
        name: 'zhangsan'
    }
}

for example another, a api like '/api/a/b/c', you can define a js file at
${project}/mock/api/a_b_c.js