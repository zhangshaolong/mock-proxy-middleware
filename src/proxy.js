const queryString = require('querystring')

const http = require('http')

const https = require('https')

const utilsTool = require('./utils')

const encoding = utilsTool.encoding

const proxyReg = /^([^:]+):(\d+)$/

const showProxyLog = (options, method, redirectUrl, data) => {
  if (data.length > 2000) {
    console.log(`proxy request: \n\tHost:${options.host}\n\tPort:${options.port}\n\tMethod:${method}\n\tPath:${redirectUrl}\n\tParams:too large not display`)
  } else {
    console.log(`proxy request: \n\tHost:${options.host}\n\tPort:${options.port}\n\tMethod:${method}\n\tPath:${redirectUrl}\n\tParams:${data}`)
  }
}

const proxyResponse = (proxyRes, res) => {
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
  utilsTool.mergeData(proxyRes).then((data) => {
    res.end(data, encoding)
  })
}

const getProxy = (request, proxyConfig) => {
  if (proxyConfig) {
    if (proxyConfig.host && !(proxyConfig.ignorePaths && proxyConfig.ignorePaths[request.path])) {
      return proxyConfig
    }
    if (proxyConfig.ignorePaths && proxyReg.test(proxyConfig.ignorePaths[request.path])) {
      return {
        ...proxyConfig,
        host: RegExp.$1,
        port: RegExp.$2 || ''
      }
    }
  }
  return false
}

const doProxy = (request, response, headers, params, method, proxyConfig) => {
  const isHttps = proxyConfig.isHttps != null ? proxyConfig.isHttps : request.protocol === 'https'
  let redirectUrl = request.url
  if (proxyConfig.redirect) {
    redirectUrl = proxyConfig.redirect(redirectUrl)
  }
  headers.host = proxyConfig.host + (proxyConfig.port ? ':' + proxyConfig.port : '')
  headers.connection = 'close'
  if (proxyConfig.headers) {
    headers = {...headers, ...proxyConfig.headers}
  }
  const options = {
    host: proxyConfig.host,
    path: redirectUrl,
    method: request.method,
    headers: headers,
    timeout: proxyConfig.timeout || 30000,
    rejectUnauthorized: false,
    agent: false
  }
  if (proxyConfig.port) {
    options.port = proxyConfig.port
  }
  const proxy = (postData) => {
    let proxyReq = (isHttps ? https : http)['request'](options, (proxyRes) => {
      proxyResponse(proxyRes, response, encoding)
    })
    proxyReq.on('error', (e) => {
      response.end(JSON.stringify({
        status: 500,
        e: e.message
      }))
      console.log('proxyReq error: ' + e.message)
    })
    proxyReq.end(postData, encoding)
  }
  showProxyLog(proxyConfig, method, redirectUrl, params)
  proxy(params)
}

module.exports = {
  doProxy,
  getProxy
}
