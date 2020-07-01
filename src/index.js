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
  cfgs = [{
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
  }]
  |
  cfgs = ${dync_config_path}
*/

module.exports = (cfgs) => {
  let dyncConfigPath
  if (typeof cfgs === 'string') {
    dyncConfigPath = cfgs
  }
  return (req, res, next) => {
    if (dyncConfigPath) {
      delete require.cache[dyncConfigPath]
      cfgs = require(dyncConfigPath)
    }
    const urlInfo = URL.parse(req.url, true)
    const cfg = utilsTool.getApiConfig(urlInfo.pathname, cfgs)
    if (cfg) {
      const contentType = req.headers['content-type'] || 'text/plain;charset=' + encoding
      const isFormData = contentType.indexOf('application/x-www-form-urlencoded') > -1
      const method = req.method.toUpperCase()
      const headers = {}
      for (let key in req.headers) {
        headers[key] = req.headers[key]
      }
      let proxyConfig = proxyTool.getProxy(req, cfg.proxyConfig)
      utilsTool.getParams(req, urlInfo.query, method, isFormData, proxyConfig).then((params) => {
        if (proxyConfig) {
          proxyTool.doProxy(req, res, headers, params, method, proxyConfig)
        } else {
          mockTool.doMock(urlInfo.pathname, req, res, params, cfg)
        }
      })
    } else if (urlInfo.pathname === '/show-apis') {
      res.end(require('./render')(utilsTool.getApiDocData(cfgs)))
    } else {
      return next()
    }
  }
}