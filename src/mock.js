const path = require('path')

const fs = require('fs')

const utilsTool = require('./utils')

const encoding = utilsTool.encoding

const cachedApis = {}

const slashReg = /^\/|\/$/g

const semReg = /\s*;\s*$/

const metaReg = /^\s*\/\*([\s\S]*?)\*\//m

const isMockDataReg = /^\s*(?:function|\{)/

const getMockDataFromFilePath = (pathName, params, request, response) => {
  const exist = fs.existsSync(pathName)
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
          return {
            writeHead: [200],
            output: [content, 'binary']
          }
        } catch (e) {
          return {
            writeHead: [500],
            output: [e.message, encoding],
            parser: JSON.stringify.bind(JSON)
          }
        }
      }
    }
    let result = cachedApi.result
    if (typeof result === 'function') {
      result = result(params, {
        require,
        request,
        response,
        __dirname: path.resolve(pathName, '..'),
        tools: {} // 后续可以进行mock的功能扩展，比如提供生成range数据等等
      })
    }
    const sleep = result.sleep
    if (!isNaN(sleep)) {
      try {
        let copy = JSON.parse(JSON.stringify(result))
        delete copy.sleep
        return {
          writeHead: [200, { 'Content-Type': 'text/plain;charset=' + encoding }],
          output: [copy, encoding],
          parser: JSON.stringify.bind(JSON),
          sleep: sleep
        }
      } catch (e) {
        return {
          writeHead: [200, { 'Content-Type': 'text/plain;charset=' + encoding }],
          output: [{
            code: 500,
            url: reqUrl,
            e: e
          },
          encoding],
          parser: JSON.stringify.bind(JSON)
        }
      }
    } else {
      return {
        writeHead: [200, { 'Content-Type': 'text/plain;charset=' + encoding }],
        output: [result, encoding],
        parser: JSON.stringify.bind(JSON)
      }
    }
  } else {
    return {
      writeHead: [500],
      output: [pathName + ' file is not existed~', encoding]
    }
  }
}

const doMock = (pathName, request, response, params, options) => {
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
    const result = getMockDataFromFilePath(pathName, params, request, response)
    if (!isNaN(result.sleep)) {
      setTimeout(() => {
        response.writeHead.apply(response, result.writeHead)
        response.end.apply(response, result.output.map((item, idx) => {
          if (idx === 0) {
            if (result.parser) {
              return result.parser(item)
            }
          }
          return item
        }))
      }, result.sleep)
    } else {
      response.writeHead.apply(response, result.writeHead)
      response.end.apply(response, result.output.map((item, idx) => {
        if (idx === 0) {
          if (result.parser) {
            return result.parser(item)
          }
        }
        return item
      }))
    }
  } catch (e) {
    response.writeHead(500)
    response.end(JSON.stringify(e.message))
  }
}

module.exports = {
  doMock,
  getMockDataFromFilePath
}
