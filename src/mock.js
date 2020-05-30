const path = require('path')

const fs = require('fs')

const utilsTool = require('./utils')

const encoding = utilsTool.encoding

const cachedApis = {}

const slashReg = /^\/|\/$/g

const doMock = (request, response, params, options) => {
  let mockPath = options.mockConfig && options.mockConfig.path || 'mock'
  let pathName = request.path
  try {
    if (params.__url__) {
      pathName = params.__url__
      delete params.__url__
    }
    let rules = options.rules
    let len = rules.length
    for (let i = 0; i < len; i++) {
      if (pathName[options.type === 'prefix' ? 'startsWith' : 'endsWith'](rules[i])) {
        pathName = pathName.replace(rules[i], '')
        const parts = pathName.replace(slashReg, '').split(/\//)
        pathName = path.resolve(mockPath, rules[i].replace(slashReg, '').replace(/\//g, '_'), parts.join('_'))
        break
      }
    }
    pathName += options.mockConfig && options.mockConfig.ext || '.js'
    fs.exists(pathName, (exist) => {
      if (exist) {
        let mtime = fs.statSync(pathName).mtime.getTime()
        let cachedApi = cachedApis[pathName]
        if (!cachedApi || cachedApi.mtime !== mtime) {
          try {
            let content = new String(fs.readFileSync(pathName, encoding), encoding).trim()
            // 支持在mock配置一些描述信息，实现对API生成接口文档
            content = content.replace(/^\s*(?:\<meta\>[\s\S]*?<\/meta\>\s*)?/im, '')
            if (/^\s*(?:function|\{)/.test(content)) {
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
              response.writeHead(200)
              response.write(content, 'binary')
              response.end()
            } catch (e) {
              response.writeHead(500)
              response.end(JSON.stringify(e.message))
            }
            return
          }
        }
        let result = cachedApi.result
        if (typeof result === 'function') {
          result = result(params)
        }
        response.writeHead(200, {'Content-Type': 'text/plain;charset=' + encoding})
        if (!isNaN(result.sleep)) {
          setTimeout(() => {
            try {
              let copy = JSON.parse(JSON.stringify(result))
              delete copy.sleep
              response.end(JSON.stringify(copy), encoding)
            } catch (e) {
              response.end(JSON.stringify({
                code: 500,
                url: reqUrl,
                e: e
              }), encoding)
            }
          }, result.sleep)
        } else {
          if (typeof result !== 'string') {
            result = JSON.stringify(result)
          }
          response.end(result, encoding)
        }
      } else {
        response.writeHead(500)
        response.end(pathName + ' file is not existed~')
      }
    })
  } catch (e) {
    try {
      result = JSON.parse(result)
      response.end(result)
    } catch (e) {
      response.writeHead(500)
      response.end(JSON.stringify(e.message))
    }
  }
}

module.exports = {
  doMock
}