const http = require('http')

const https = require('https')

const utilsTool = require('./utils')

const encoding = utilsTool.encoding

const pendings = {}

const showProxyLog = (options, method, redirectUrl, data) => {
  if (data.length > 2000) {
    console.log(
      `proxy request: \n\tHost:${options.host}\n\tPort:${options.port}\n\tMethod:${method}\n\tPath:${redirectUrl}\n\tParams:too large not display`
    )
  } else {
    console.log(
      `proxy request: \n\tHost:${options.host}\n\tPort:${options.port}\n\tMethod:${method}\n\tPath:${redirectUrl}\n\tParams:${data}`
    )
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
    if (proxyConfig.host) {
      const excludes = proxyConfig.excludes
      if (excludes) {
        for (let i = 0; i < excludes.length; i++) {
          const exclude = excludes[i]
          if (typeof exclude === 'function') {
            if (exclude(request, proxyConfig)) {
              return false
            }
          } else if (new RegExp(exclude).test(request.path)) {
            return false
          }
        }
      }
      return proxyConfig
    }
  }
  return false
}

const doProxy = (request, response, headers, params, method, proxyConfig) => {
  const proxy = (postData, options) => {
    let proxyReq = (isHttps ? https : http)['request'](options, (proxyRes) => {
      proxyResponse(proxyRes, response, encoding)
    })
    proxyReq.on('error', (e) => {
      response.end(
        JSON.stringify({
          status: 500,
          e: e.message
        })
      )
      console.log('proxyReq error: ' + e.message)
    })
    if (method === 'POST') {
      proxyReq.end(postData, encoding)
    } else {
      request.pipe(proxyReq)
    }
  }

  const isHttps = proxyConfig.isHttps != null ? proxyConfig.isHttps : request.protocol === 'https'
  let redirectUrl = request.url
  if (proxyConfig.redirect) {
    redirectUrl = proxyConfig.redirect(redirectUrl)
  }
  headers.host = proxyConfig.host + (proxyConfig.port ? ':' + proxyConfig.port : '')
  headers.connection = 'close'

  if (proxyConfig.headers) {
    const mergedCookies = {}
    if (headers.cookie) {
      let cookieKv = headers.cookie.split(/\s*;\s*/)
      for (let i = 0; i < cookieKv.length; i++) {
        let cookiePair = cookieKv[i].split(/=/)
        mergedCookies[cookiePair[0]] = cookiePair[1]
      }
    }
    const configCookieStr = proxyConfig.headers.cookie
    if (configCookieStr) {
      let cookieKv = configCookieStr.split(/\s*;\s*/)
      for (let i = 0; i < cookieKv.length; i++) {
        let cookiePair = cookieKv[i].split(/=/)
        mergedCookies[cookiePair[0]] = cookiePair[1]
      }
      const mergedCookieArr = []
      for (let key in mergedCookies) {
        mergedCookieArr.push(`${key}=${escape(unescape(mergedCookies[key]))}`)
      }
      headers = {...headers, ...proxyConfig.headers, ...{
      cookie: mergedCookieArr.join(';')
    }}
    } else {
      headers = { ...headers, ...proxyConfig.headers }
    }
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
  showProxyLog(proxyConfig, method, redirectUrl, params)
  proxy(params, options)
}

module.exports = {
  doProxy,
  getProxy
}
