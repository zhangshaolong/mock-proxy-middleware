const http = require('http')

const https = require('https')

const utilsTool = require('./utils')

const encoding = utilsTool.encoding

const cookiePairReg = /^([^=]+)=(.*)$/

const headerCharRegex = /[^\t\x20-\x7e\x80-\xff]/

const refreshQueryString = (queryStr, params) => {
  for (let ki in params) {
    let has = false
    let value = params[ki]
    queryStr = queryStr.replace(new RegExp('([?#&]' + ki + '=)([^&$]*)'), (all, k, v) => {
      has = true
      if (value === '') {
        return ''
      }
      return k + value
    })
    if (!has && value !== '') {
      queryStr += '&' + ki + '=' + value
    }
  }
  return queryStr.replace(/[?&]/, '?')
}

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

const trimCookie = (val) => {
  return val.replace(/\s*HttpOnly[^;]*;?/ig, '').replace(/\s*Secure[^;]*;?/ig, '').replace(/\s*SameSite[^;]*;?/ig, '')
}

const proxyResponse = (proxyRes, res) => {
  let headers = proxyRes.headers
  let statusCode = proxyRes.statusCode
  try {
    if (headers) {
      for (let key in headers) {
        let val = headers[key]
        if (key.toLowerCase() === 'set-cookie') {
          if (Array.isArray(val)) {
            for (let i = 0; i < val.length; i++) {
              val[i] = trimCookie(val[i])
            }
          } else if (typeof val === 'string') {
            val = trimCookie(val)
          }
        }
        res.setHeader(key, val)
      }
    }
    res.writeHead(statusCode)
  } catch (e) {
    console.log('setHeader error', e.message)
  }
  return utilsTool.mergeData(proxyRes).then((data) => {
    res.end(data, encoding)
    return {
      buffer: data,
      headers: headers
    }
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
        let cookiePair = cookiePairReg.exec(cookieKv[i])
        if (cookiePair) {
          mergedCookies[cookiePair[1]] = cookiePair[2]
        }
      }
    }
    const configCookieStr = proxyConfig.headers.cookie
    if (configCookieStr) {
      let cookieKv = configCookieStr.split(/\s*;\s*/)
      for (let i = 0; i < cookieKv.length; i++) {
        let cookiePair = cookiePairReg.exec(cookieKv[i])
        if (cookiePair) {
          mergedCookies[cookiePair[1]] = cookiePair[2]
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
    } else {
      headers = { ...headers, ...proxyConfig.headers }
    }
  }

  let options = {
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
  const beforeRequest = proxyConfig.beforeRequest
  if (beforeRequest) {
    try {
      let p = params;
      const isBuffer = Buffer.isBuffer(params)
      if (isBuffer) {
        p = params.toString()
      }
      p = JSON.parse(p)
      const extraData = beforeRequest(p, options)
      if (extraData) {
        const [extraParams = {}, extraOptions = {}] = extraData
        options = {...options, ...extraOptions}
        p = JSON.stringify({...p, ...extraParams})
        if (isBuffer) {
          p = Buffer.from(p)
          options.headers['content-length'] = p.length
        }
        params = p
        for (let key in extraParams) {
          options.path = refreshQueryString(options.path, extraParams)
          break;
        }
      }
    } catch (e) {
      console.log('beforeRequest called error', e)
    }
  }
  showProxyLog(proxyConfig, method, options.path, params)

  return new Promise((resolve) => {
    let proxyReq = (isHttps ? https : http)['request'](options, (proxyRes) => {
      proxyResponse(proxyRes, response, encoding).then(resolve)
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
      proxyReq.end(params, encoding)
    }
  });
}

module.exports = {
  doProxy,
  getProxy
}
