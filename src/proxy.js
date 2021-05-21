const http = require('http')

const https = require('https')

const chrome = require('chrome-cookies-secure')

const utilsTool = require('./utils')

const encoding = utilsTool.encoding

const pendings = {}

const cookiePairReg = /^([^=]+)=(.*)$/

const headerCharRegex = /[^\t\x20-\x7e\x80-\xff]/

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

const flushQueues = (host, cookies) => {
  const {queues} = pendings[host]
  queues.forEach((resolve) => {
    resolve(cookies)
  })
}

const getProxyCookies = (host) => {
  let pending = pendings[host]
  if (!pending) {
    pending = pendings[host] = {
      status: 'done',
      queues: []
    }
  }
  const {status, queues} = pending
  if (status === 'pending') {
    return new Promise((resolve) => {
      queues.push(resolve)
    })
  }
  return new Promise((resolve) => {
    try {
      pending.status = 'pending'
      chrome.getCookies(host, function(_, cookies = {}) {
        resolve(cookies)
        flushQueues(host, cookies)
        pending.status = 'done'
      })
    } catch (e) {
      resolve({})
      flushQueues(host, cookies)
      pending.status = 'done'
    }
  })
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
    if (method === 'GET' || method === 'HEAD') {
      request.pipe(proxyReq)
    } else {
      proxyReq.end(postData, encoding)
    }
  }

  const isHttps = proxyConfig.isHttps != null ? proxyConfig.isHttps : request.protocol === 'https'
  let redirectUrl = request.url
  if (proxyConfig.redirect) {
    redirectUrl = proxyConfig.redirect(redirectUrl)
  }
  headers.host = proxyConfig.host + (proxyConfig.port ? ':' + proxyConfig.port : '')
  headers.connection = 'close'

  getProxyCookies(`http${isHttps? 's' : ''}://${headers.host}`).then((cookies) => {
    const mergedCookies = {...cookies}
    if (proxyConfig.headers) {
      const configCookieStr = proxyConfig.headers.cookie
      if (configCookieStr) {
        let cookieKv = configCookieStr.split(/\s*;\s*/)
        for (let i = 0; i < cookieKv.length; i++) {
          let cookiePair = cookiePairReg.exec(cookieKv[i])
          if (cookiePair) {
            mergedCookies[cookiePair[1]] = cookiePair[2]
          }
        }
      }
    }

    const mergedCookieArr = []
    for (let key in mergedCookies) {
      const val = mergedCookies[key]
      if (!headerCharRegex.test(val)) {
        mergedCookieArr.push(`${key}=${val}`)
      }
    }
    headers = {...headers, ...proxyConfig.headers, ...{
      cookie: mergedCookieArr.join(';')
    }}

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
  })
}

module.exports = {
  doProxy,
  getProxy
}
