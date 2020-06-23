const path = require('path')

const fs = require('fs')

const utilsTool = require('./utils')

const encoding = utilsTool.encoding

const cachedApis = {}

const slashReg = /^\/|\/$/g

const semReg = /\s*;\s*$/m

const metaReg = /^\s*\/\*([\s\S]*?)\*\//m

const isMockDataReg = /^\s*(?:function|\{)/

const doMock = (pathName, response, params, options) => {
  let mockPath = (options.mockConfig && options.mockConfig.path) || 'mock'
  try {
    const rules = [].concat(options.rules)
    const len = rules.length
    for (let i = 0; i < len; i++) {
      let rule = new RegExp(rules[i])
      let isApi = false
      pathName.replace(rule, (match) => {
        pathName = pathName.replace(match, '_').replace(/^_|_$/, '')
        const parts = pathName.replace(slashReg, '').split(/\//)
        pathName = path.resolve(
          mockPath,
          match.replace(slashReg, '').replace(/\//g, '_'),
          parts.join('_')
        )
        isApi = true
      })
      if (isApi) {
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
            let matched = true
            while (matched) {
              matched = false
              content = content.replace(metaReg, (all, contents) => {
                matched = true
                return ''
              })
            }
            content = content.replace(semReg, '') // 有的编辑器会自动在最后加上分号
            if (isMockDataReg.test(content)) {
              content = 'return (' + content + ')'
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
    response.writeHead(500)
    response.end(JSON.stringify(e.message))
  }
}

module.exports = {
  doMock
}