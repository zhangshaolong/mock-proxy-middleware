    
/**
 * @file 本地mock支持及远程代理 local mock and remote proxy
 * @author zhangshaolong
 */

'use strict'

const queryString = require('querystring')

const URL = require('url')

const http = require('http')

const https = require('https')

const path = require('path')

const fs = require('fs')

const encoding = 'UTF-8'

const proxyReg = /^([^:]+):(\d+)$/

const cachedApis = {}

const showProxyLog = (options, method, redirectUrl, data) => {
  if (data.length > 2000) {
    console.log(`proxy request: \n\tHost:${options.host}\n\tPort:${options.port}\n\tMethod:${method}\n\tPath:${redirectUrl}\n\tParams:too large not display`)
  } else {
    console.log(`proxy request: \n\tHost:${options.host}\n\tPort:${options.port}\n\tMethod:${method}\n\tPath:${redirectUrl}\n\tParams:${data}`)
  }
}

const proxyData = (original, callback) => {
  let chunks = []
  let size = 0
  original.on('data', (chunk) => {
    chunks.push(chunk)
    size += chunk.length
  })
  original.on('end', () => {
    let data = null
    let len = chunks.length
    switch (len) {
    case 0:
      data = new Buffer(0)
      break
    case 1:
      data = chunks[0]
      break
    default:
      data = new Buffer(size)
      for (let i = 0, pos = 0; i < len; i++) {
        let chunk = chunks[i]
        chunk.copy(data, pos)
        pos += chunk.length
      }
      break
    }
    callback(data)
  })
}

const writeResponse = (proxyRes, res, encoding) => {
  let headers = proxyRes.headers
  let statusCode = proxyRes.statusCode
  try {
    if (headers) {
      for (let key in headers) {
        res.setHeader(key, headers[key])
      }
    }
    res.writeHead(statusCode)
  } catch (e) {
    console.log('setHeader error', e.message)
  }
  proxyData(proxyRes, (data) => {
    res.end(data, encoding)
  })
}

/*
  opts.apiConfig = {
    type: 'prefix', // prefix or suffix
    value: ['/api/', '/common-api/'] // or array like ['/api/', '/api-prefix/']
  }
  opts.ignoreProxyPaths = {
    '/api/a/b/c': 1,
    '/api/get_index_data': 1,
    '/api/user_info': 'aaa.bbb.ccc:8080' // 可以指定其他代理服务
  }
  opts.proxyInfo = {
    host: '1.1.1.1',
    port: 8080,
    redirect: function
  }
  opts.mockPath = 'xxx'; // default dir is 'mock' under project`s path
**/

module.exports = (opts) => {
  let proxyInfo
  return (req, res, next) => {
    const apiConfig = opts.apiConfig
    const ignoreProxyPaths = opts.ignoreProxyPaths || {}
    const mockPath = opts.mockPath || 'mock'
    proxyInfo = opts.proxyInfo || proxyInfo
    const reqUrl = req.url
    const withoutArgUrl = reqUrl.split(/\?/)[0]
    const apiType = apiConfig.type
    const apiValue = apiConfig.value
    if (typeof apiValue === 'string') {
      apiValue = [apiValue]
    }
    const len = apiValue.length
    let isApi = false
    if (apiType === 'prefix') {
      for (let i = 0; i < len; i++) {
        if (reqUrl.indexOf(apiValue[i]) === 0) {
          isApi = true
          break
        }
      }
    } else if (apiType === 'suffix') {
      for (let i = 0; i < len; i++) {
        if (withoutArgUrl.endsWith(apiValue[i])) {
          isApi = true
          break
        }
      }
    }
    if (isApi) {
      const headers = {}
      const method = req.method.toUpperCase()
      const urlInfo = URL.parse(reqUrl, true)
      const contentType = req.headers['content-type'] || 'text/plain;charset=' + encoding
      const isHttps = req.protocol === 'https'

      const getProxyInfo = () => {
        const pageUrl = req.headers.referer
        if (pageUrl) {
          const query = URL.parse(pageUrl, true).query
          if (query && query.proxy) {
            const pair = query.proxy.replace(/^https?\:\/\//, '').split(':')
            return {
              host: pair[0],
              port: pair[1] || (isHttps ? 443 : 80)
            }
          }
        }
      }

      const doProxy = (proxyInfo) => {
        let redirectUrl = reqUrl
        if (proxyInfo.redirect) {
          redirectUrl = proxyInfo.redirect(reqUrl)
        }
        headers.host = proxyInfo.host + ':' + proxyInfo.port
        headers['Content-Type'] = contentType
        const options = {
          host: proxyInfo.host,
          port: proxyInfo.port || (isHttps ? 443 : 80),
          path: redirectUrl,
          method: req.method,
          timeout: 30000,
          headers: headers
        }

        const proxy = (postData) => {
          headers.contentLength = postData.length
          let proxyReq = (isHttps ? https : http)['request'](options, (proxyRes) => {
            writeResponse(proxyRes, res, encoding)
          })
          proxyReq.on('error', (e) => {
            res.end(JSON.stringify({
              status: 500,
              e: e.message
            }))
            console.log('proxyReq error: ' + e.message)
          })
          proxyReq.end(postData, encoding)
        }
        let postData = ''
        if (method === 'POST') {
          req.on('error', (e) => {
            console.log('req error: ' + e.message)
          })
          if (req.body) {
            if (contentType && contentType.indexOf('application/x-www-form-urlencoded') > -1) {
              postData = queryString.stringify(req.body)
            } else {
              postData = JSON.stringify(req.body)
            }
            proxy(postData)
            showProxyLog(options, method, redirectUrl, postData)
          } else {
            proxyData(req, (data) => {
              proxy(data)
              showProxyLog(options, method, redirectUrl, data)
            })
          }
        } else if (method === 'GET') {
          postData = JSON.stringify(urlInfo.query)
          proxy(postData)
          showProxyLog(options, method, redirectUrl, postData)
        }
      }

      for (let key in req.headers) {
        headers[key] = req.headers[key]
      }

      if (!proxyInfo) {
        proxyInfo = getProxyInfo()
      }

      if (proxyInfo && proxyInfo.host && !ignoreProxyPaths[withoutArgUrl]) {
        doProxy(proxyInfo)
        return
      }

      const isOtherProxy = proxyReg.test(ignoreProxyPaths[withoutArgUrl])
      if (isOtherProxy) {
        doProxy({
          host: RegExp.$1,
          port: RegExp.$2 || (isHttps ? 443 : 80)
        })
        return
      }

      const doMock = (params, pathName) => {
        try {
          if (params.__url__) {
            pathName = params.__url__
            delete params.__url__
          }
          let slashReg = /^\/|\/$/g
          for (let i = 0; i < len; i++) {
            if (pathName[apiType === 'prefix' ? 'startsWith' : 'endsWith'](apiValue[i])) {
              pathName = pathName.replace(apiValue[i], '')
              const parts = pathName.replace(slashReg, '').split(/\//)
              pathName = path.resolve(mockPath, apiValue[i].replace(slashReg, '').replace(/\//g, '_'), parts.join('_'))
              break
            }
          }
          pathName += '.js'
          fs.exists(pathName, (exist) => {
            if (exist) {
              let mtime = fs.statSync(pathName).mtime.getTime()
              let cachedApi = cachedApis[pathName]
              if (!cachedApi || cachedApi.mtime !== mtime) {
                try {
                  let content = new String(fs.readFileSync(pathName, encoding), encoding).trim()
                  // 支持在mock配置一些描述信息，实现对API生成接口文档
                  content = content.replace(/^\s*(?:\<meta\>[\s\S]*?<\/meta\>\s*)?/im, '')
                  if (/^(?:function|\{)/.test(content)) {
                    content = 'return ' + content
                  }
                  let result = Function(content)()
                  cachedApis[pathName] = cachedApi = {
                    result,
                    mtime
                  }
                } catch (e) {
                  try {
                    const content = fs.readFileSync(pathName, 'binary')
                    res.writeHead(200)
                    res.write(content, 'binary')
                    res.end()
                  } catch (e) {
                    res.writeHead(500)
                    res.end(JSON.stringify(e.message))
                  }
                  return
                }
              }
              let result = cachedApi.result
              if (typeof result === 'function') {
                result = result(params)
              }
              res.writeHead(200, {'Content-Type': 'text/plain;charset=' + encoding})
              if (!isNaN(result.sleep)) {
                setTimeout(() => {
                  delete result.sleep
                  res.end(JSON.stringify(result), encoding)
                }, result.sleep)
              } else {
                if (typeof result !== 'string') {
                  result = JSON.stringify(result)
                }
                res.end(result, encoding)
              }
            } else {
              res.writeHead(500)
              res.end(pathName + ' file is not existed~')
            }
          })
        } catch (e) {
          try {
            result = json.parse(result)
            res.end(result)
          } catch (e) {
            res.writeHead(500)
            res.end(JSON.stringify(e.message))
          }
        }
      }
      let params = ''
      if (method === 'POST') {
        if (req.body) {
          if (contentType.indexOf('application/x-www-form-urlencoded') > -1) {
            params = queryString.parse(req.body)
          } else {
            params = JSON.parse(req.body)
          }
          doMock(params, urlInfo.pathname)
        } else {
          proxyData(req, (data) => {
            if (contentType.indexOf('application/x-www-form-urlencoded') > -1) {
              params = queryString.parse(String(data, encoding))
            } else {
              params = JSON.parse(data)
            }
            doMock(params, urlInfo.pathname)
          })
        }
      } else if (method === 'GET') {
        doMock(urlInfo.query, urlInfo.pathname)
      }
    } else {
      return next()
    }
  }
}