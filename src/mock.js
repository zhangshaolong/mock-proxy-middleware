const path = require('path')

const fs = require('fs')

const utilsTool = require('./utils')

const encoding = utilsTool.encoding

const cachedApis = {}

const slashReg = /^\/|\/$/g

const doMock = (pathName, response, params, options) => {
  let mockPath = (options.mockConfig && options.mockConfig.path) || 'mock'
  try {
    if (params.__url__) { // 这个是为了支持restful接口定义的格式，需要与api工具配合，后续可以改造到自定义headers
      pathName = params.__url__
      delete params.__url__
    }
    let rules = options.rules
    let len = rules.length
    let action = options.type === 'prefix' ? 'startsWith' : 'endsWith'
    for (let i = 0; i < len; i++) {
      let rule = rules[i]
      if (pathName[action](rule)) {
        pathName = pathName.replace(rule, '')
        const parts = pathName.replace(slashReg, '').split(/\//)
        pathName = path.resolve(
          mockPath,
          rule.replace(slashReg, '').replace(/\//g, '_'),
          parts.join('_')
        )
        break
      }
    }
    pathName += (options.mockConfig && options.mockConfig.ext) || '.js'
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
        response.writeHead(200, { 'Content-Type': 'text/plain;charset=' + encoding })
        if (!isNaN(result.sleep)) {
          setTimeout(() => {
            try {
              let copy = JSON.parse(JSON.stringify(result))
              delete copy.sleep
              response.end(JSON.stringify(copy), encoding)
            } catch (e) {
              response.end(
                JSON.stringify({
                  code: 500,
                  url: reqUrl,
                  e: e
                }),
                encoding
              )
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