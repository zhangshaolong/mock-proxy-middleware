/**
 * @file 本地mock支持及远程代理 local mock and remote proxy
 * @author zhangshaolong
 */

'use strict'

const URL = require('url')

const fs = require('fs')

const path = require('path')

const utilsTool = require('./utils')

const proxyTool = require('./proxy')

const mockTool = require('./mock')

const encoding = utilsTool.encoding

/**
  opts = {
    rules: [/^\/api\//, /^\/common-api\//]
    proxyConfig: {
      host: '1.1.1.1',
      port: 8080,
      redirect: (path) => {return path},
      timeout: 30000,
      isHttps: false,
      headers: {
        cookie: 'xxx'
      },
      excludes: [
        '^/api/get_index_data',
        '^/api/user_info',
        /^\/test-api\/mock\//
      ]
    },
    mockConfig: {
      path: 'mock', // default dir is 'mock' under project`s path
      ext: '.js'
    }
  }
*/
const allConfigs = []
let timer = null
let projects = []
module.exports = (opts) => {
  allConfigs.push(opts)
  clearTimeout(timer)
  timer = setTimeout(() => {
    projects = utilsTool.getApiDocData(allConfigs)
  }, 500)
  return (req, res, next) => {
    const urlInfo = URL.parse(req.url, true)
    if (utilsTool.isApi(urlInfo.pathname, opts)) {
      const contentType = req.headers['content-type'] || 'text/plain;charset=' + encoding
      const isFormData = contentType.indexOf('application/x-www-form-urlencoded') > -1
      const method = req.method.toUpperCase()
      const headers = {}
      for (let key in req.headers) {
        headers[key] = req.headers[key]
      }
      let proxyConfig = proxyTool.getProxy(req, opts.proxyConfig)
      utilsTool.getParams(req, urlInfo.query, method, isFormData, proxyConfig).then((params) => {
        if (proxyConfig) {
          proxyTool.doProxy(req, res, headers, params, method, proxyConfig)
        } else {
          mockTool.doMock(urlInfo.pathname, req, res, params, opts)
        }
      })
    } else if (urlInfo.pathname === '/show-apis') {
      res.end(require('./render')(projects))
    } else {
      return next()
    }
  }
}