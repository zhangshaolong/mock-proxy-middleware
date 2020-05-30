/**
 * @file 本地mock支持及远程代理 local mock and remote proxy
 * @author zhangshaolong
 */

'use strict'

const queryString = require('querystring')

const utilsTool = require('./utils')

const proxyTool = require('./proxy')

const mockTool = require('./mock')

const encoding = utilsTool.encoding

/**
  opts = {
    type: 'prefix', // prefix or suffix
    rules: ['/api/', '/common-api/'] // or array like ['/api/', '/api-prefix/']
    proxyConfig: {
      host: '1.1.1.1',
      port: 8080,
      redirect: (path) => {return path},
      ignorePaths: {
        '/api/get_index_data': 1,
        '/api/user_info': 'aaa.bbb.ccc:8080' // 可以指定其他代理服务
      }
    },
    mockConfig: {
      path: 'mock', // default dir is 'mock' under project`s path
      ext: '.js'
    }
  }
*/

module.exports = (opts) => {
  return (req, res, next) => {
    if (utilsTool.isApi(req, opts)) {
      const contentType = req.headers['content-type'] || 'text/plain;charset=' + encoding
      const isFormData = contentType.indexOf('application/x-www-form-urlencoded') > -1
      const method = req.method.toUpperCase()
      const headers = {}
      for (let key in req.headers) {
        headers[key] = req.headers[key]
      }
      utilsTool.getParams(req, method, isFormData).then((params) => {
        let proxyConfig = proxyTool.getProxy(req, opts.proxyConfig)
      if (proxyConfig) {
      	if (method === 'GET') {
      		params = JSON.stringify(params)
      	}
        proxyTool.doProxy(req, res, headers, params, method, proxyConfig)
      } else {
        mockTool.doMock(req, res, params, opts)
      }
      })
    } else {
      return next()
    }
  }
}