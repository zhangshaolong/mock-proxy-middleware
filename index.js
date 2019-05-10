/**
 * @file 本地mock支持及远程代理 local mock and remote proxy
 * @author zhangshaolong
 */

'use strict'

const queryString = require('querystring')

const URL = require('url')

const http = require('http')

const formDataReg = /multipart\/form-data/

const path = require('path')

const fs = require('fs')

const encoding = 'UTF-8'

const proxyReg = /^([^:]+):(\d+)$/

const showProxyLog = (options, method, redirectUrl, data) => {
  if (data.length > 2000) {
    console.log(`proxy request: \n\tHost:${options.host}\n\tPort:${options.port}\n\tMethod:${method}\n\tPath:${redirectUrl}\n\tParams:too large not display`)
  } else {
    console.log(`proxy request: \n\tHost:${options.host}\n\tPort:${options.port}\n\tMethod:${method}\n\tPath:${redirectUrl}\n\tParams:${data}`)
  }
}

const writeResponse = (proxyRes, res, encoding) => {
  let chunks = []
  let size = 0
  proxyRes.on('data', (chunk) => {
    chunks.push(chunk)
    size += chunk.length
  })
  proxyRes.on('end', () => {
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

      const getProxyInfo = () => {
        const pageUrl = req.headers.referer
        if (pageUrl) {
          const query = URL.parse(pageUrl, true).query
          if (query && query.proxy) {
            const pair = query.proxy.replace(/^https?\:\/\//, '').split(':')
            return {
              host: pair[0],
              port: pair[1] || 80
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
        if (contentType) {
          headers['Content-Type'] = contentType
        }
        // delete headers['accept-encoding']
        const options = {
          host: proxyInfo.host,
          port: proxyInfo.port,
          path: redirectUrl,
          method: req.method,
          timeout: 30000,
          headers: headers
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
            showProxyLog(options, method, redirectUrl, postData)
            headers.contentLength = postData.length
            let proxyReq = http.request(options, (proxyRes) => {
              let headers = proxyRes.headers
              let statusCode = proxyRes.statusCode
              try {
                res.writeHeader(statusCode, headers)
              } catch (e) {
                console.log('setHeader error', e.message)
              }
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
          } else {
            req.on('data', (data) => {
              postData += data
            })
            req.on('end', () => {
              headers.contentLength = postData.length
              let proxyReq = http.request(options, (proxyRes) => {
                let headers = proxyRes.headers
                let statusCode = proxyRes.statusCode
                try {
                  res.writeHeader(statusCode, headers)
                } catch (e) {
                  console.log('setHeader error', e.message)
                }
                writeResponse(proxyRes, res, encoding)
              })
              proxyReq.on('error', (e) => {
                res.end(JSON.stringify({
                  status: 500,
                  e: e.message
                }))
                console.log('proxyReq error: ' + e.message)
              })
              showProxyLog(options, method, redirectUrl, postData)
              proxyReq.end(postData, encoding)
            })
          }
        } else if (method === 'GET') {
          postData = JSON.stringify(urlInfo.query)
          headers.contentLength = Buffer.byteLength(postData)
          showProxyLog(options, method, redirectUrl, postData)
          let proxyReq = http.request(options, (proxyRes) => {
            let headers = proxyRes.headers
            let statusCode = proxyRes.statusCode
            try {
              res.writeHeader(statusCode, headers)
            } catch (e) {
              console.log('setHeader error', e.message)
            }
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
          port: RegExp.$2 || 80
        })
        return
      }

      const doMock = (params, pathName) => {
        try {
          if (params.__url__) {
            pathName = params.__url__
            delete params.__url__
          }
          let slashReg = /^\/|\/$/g;
          for (let i = 0; i < len; i++) {
            if (pathName[apiType === 'prefix' ? 'startsWith' : 'endsWith'](apiValue[i])) {
              pathName = pathName.replace(apiValue[i], '')
              const parts = pathName.replace(slashReg, '').split(/\//)
              pathName = path.resolve(mockPath, apiValue[i].replace(slashReg, '').replace(/\//g, '_'), parts.join('_'))
              break
            }
          }
          pathName += '.js';
          fs.exists(pathName, (exist) => {
            if (exist) {
              try {
                const content = new String(fs.readFileSync(pathName, encoding), encoding)
                try {
                  let result = new Function('return ' + content)()
                  if (typeof result === 'function') {
                    result = result(params)
                  }
                  if (!isNaN(result.sleep) && result.sleep > 0) {
                    setTimeout(() => {
                      delete result.sleep
                      res.end(JSON.stringify(result))
                    }, result.sleep)
                  } else {
                    if (typeof result !== 'string') {
                      result = JSON.stringify(result)
                    }
                    res.end(result)
                  }
                } catch (e) {
                  try {
                    const content = fs.readFileSync(pathName, 'binary')
                    res.writeHeader(200)
                    res.write(content, 'binary')
                    res.end()
                  } catch (e) {
                    res.writeHeader(500)
                    res.end(JSON.stringify(e.message))
                  }
                }
              } catch (e) {
                res.writeHeader(500);
                res.end(JSON.stringify(e.message))
              }
            } else {
              res.writeHeader(500)
              res.end(pathName + ' file is not existed~')
            }
          })
        } catch (e) {
          try {
            result = json.parse(result)
            res.end(result)
          } catch (e) {
            res.writeHeader(500)
            res.end(JSON.stringify(e.message))
          }
        }
      }
      if (formDataReg.test(contentType)) {
        req.once('data', (data) => {
          doMock(queryString.parse(String(data, encoding)), urlInfo.pathname)
        })
        return
      }
      let params = ''
      if (method === 'POST') {
        if (req.body) {
          doMock(req.body, urlInfo.pathname)
        } else {
          req.on('data', (data) => {
            params += data
          })
          req.on('end', () => {
            if (contentType && contentType.indexOf('application/x-www-form-urlencoded') > -1) {
              params = queryString.parse(params)
            } else {
              params = JSON.parse(params)
            }
            doMock(params, urlInfo.pathname)
          })
        }
      } else if (method === 'GET') {
        params = urlInfo.query
        doMock(params, urlInfo.pathname)
      }
    } else {
      return next()
    }
  }
}