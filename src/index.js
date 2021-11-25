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
  publicConfigs = [{
    rules: ['^/api/', /^\/common-api\//]
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
      ],
      fillMissingMock: false
    },
    mockConfig: {
      path: 'mock', // default dir is 'mock' under project`s path
      ext: '.js'
    }
  }]
  ||
  publicConfigs = ${publicConfigPath}
*/

const mergeConfigs = (publicConfigs, personalConfigs) => {
  const publicRuleMap = {}
  const personalRuleMap = {}
  const mergedConfigs = []
  for (let i = 0; i < publicConfigs.length; i++) {
    const publicConfig = publicConfigs[i]
    const rules = [].concat(publicConfig.rules)
    for (let j = 0; j < rules.length; j++) {
      const rule = rules[j]
      publicRuleMap[rule] = Object.assign({}, publicConfig, {rules: [rule]})
    }
  }
  for (let i = 0; i < personalConfigs.length; i++) {
    const personalConfig = personalConfigs[i]
    const rules = [].concat(personalConfig.rules)
    for (let j = 0; j < rules.length; j++) {
      const rule = rules[j]
      personalRuleMap[rule] = Object.assign({}, publicRuleMap[rule], personalConfig, {rules: [rule]})
    }
  }
  for (let i = 0; i < personalConfigs.length; i++) {
    const personalConfig = personalConfigs[i]
    const rules = [].concat(personalConfig.rules)
    for (let j = 0; j < rules.length; j++) {
      mergedConfigs.push(personalRuleMap[rules[j]])
    }
  }
  for (let i = 0; i < publicConfigs.length; i++) {
    const publicConfig = publicConfigs[i]
    const rules = [].concat(publicConfig.rules)
    for (let j = 0; j < rules.length; j++) {
      const rule = rules[j]
      if (!personalRuleMap[rule]) {
        mergedConfigs.push(publicRuleMap[rule])
      }
    }
  }
  return mergedConfigs
}

module.exports = (publicConfigs, personalConfigPath) => {
  let publicConfigPath
  if (typeof publicConfigs === 'string') {
    publicConfigPath = publicConfigs
  }
  return (req, res, next) => {
    if (publicConfigPath) {
      delete require.cache[publicConfigPath]
      publicConfigs = require(publicConfigPath)
    }
    if (typeof personalConfigPath === 'string') {
      delete require.cache[personalConfigPath]
      try {
        const personalConfigs = require(personalConfigPath)
        publicConfigs = mergeConfigs(publicConfigs, personalConfigs)
      } catch (e) {}
    }
    const urlInfo = URL.parse(req.url, true)
    const cfg = utilsTool.getApiConfig(urlInfo.pathname, publicConfigs)
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
          const promise = proxyTool.doProxy(req, res, headers, params, method, proxyConfig)
          if (proxyConfig.fillMissingMock) {
            promise.then((buffer) => {
              mockTool.fillMissingMock(urlInfo.pathname, buffer, cfg)
            })
          }
        } else {
          mockTool.doMock(urlInfo.pathname, req, res, params, cfg)
        }
      })
    } else if (urlInfo.pathname === '/show-apis') {
      res.end(require('./render')(utilsTool.getApiDocData(publicConfigs)))
    } else {
      return next()
    }
  }
}