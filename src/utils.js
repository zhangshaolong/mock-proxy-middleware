const queryString = require('querystring')
const path = require('path')
const fs = require('fs')

const metaReg = /^\s*\/\*([\s\S]*?)\*\//m
const docKeyReg = /^[\s\*]*@(path|method|params|desc|type|headers)\s*([\s\S]+)$/gi
const descReg = /^\s*((["'])([^\2]+)\2|([^\s]+))\s*:\s*((['"])[^\6]+\6|[\s\S]*\/\/([^$]+))$/

const encoding = 'UTF-8'

const mergeData = (original) => {
  return new Promise((resolve) => {
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
      resolve(data)
    })
  })
}

const isApi = (pathName, opt) => {
  const rules = opt.rules
  if (!Array.isArray(rules)) {
    rules = [rules]
  }
  for (let i = 0; i < rules.length; i++) {
    if (new RegExp(rules[i]).test(pathName)) {
      return true
    }
  }
  return false
}

const getParams = (request, query, method, isFormData, isProxy) => {
  if (method === 'POST') {
    let bodyData = request.body
    if (bodyData) {
      return Promise.resolve([isFormData ? queryString : JSON][isProxy ? 'stringify' : 'parse'](bodyData))
    } else {
      return mergeData(request).then((data) => {
        if (!isProxy) {
          data = (isFormData ? queryString : JSON).parse(data.toString())
        }
        return data
      })
    }
  } else if (method === 'GET') {
    return Promise.resolve(isProxy ? JSON.stringify(query) : query)
  }
}

const parseMeta = (data) => {
  const meta = {
    method: 'get',
    type: 'json'
  }
  let dt = data
  let matched = true
  while (matched) {
    matched = false
    dt = dt.replace(metaReg, (all, contents) => {
      matched = true
      let lines = contents.split(/\n/)
      let paramsMap = {}
      let hasParamMap = false
      lines.forEach((line) => {
        line.replace(docKeyReg, (str, type, val) => {
          if (type === 'params') {
            if (/^\.([^\s]+)/.test(val)) {
              let key = RegExp.$1
              let columns = val.replace(/^\.([^\s]+)/, '').split(/\s*,\s*/)
              if (columns.length > 3) {
                columns[2] = columns.slice(2).join(',')
                columns.length = 3
              }
              paramsMap[key] = columns
              hasParamMap = true
              return
            }
          }
          meta[type] = val
        })
      })
      if (hasParamMap) {
        meta.paramsMap = paramsMap
      }
      return ''
    })
  }
  let respDescMap = {}
  dt.split(/\n/).forEach((line) => {
    if (descReg.test(line)) {
      if (RegExp.$7) {
        respDescMap[RegExp.$3 || RegExp.$4] = RegExp.$7
      }
    }
  })
  meta.respDescMap = respDescMap
  return meta
}

const findAPIs = (pathName) => {
  let arr = []
  fs.readdirSync(pathName).forEach((fileName) => {
    if (!/^\./.test(fileName)) {
      let filePath = path.join(pathName, fileName)
      if (fs.statSync(filePath).isDirectory()) {
        let apis = []
        let dir = {
          name: fileName,
          apis
        }
        arr.push(dir)
        fs.readdirSync(filePath).forEach((api) => {
          let data = fs.readFileSync(path.join(filePath, api), 'utf8')
          apis.push(parseMeta(data))
        })
      }
    }
  })
  return arr
}

const getApiDocData = (configs) => {
  let projects = []
  configs.forEach((config) => {
    let mockConfig = config.mockConfig
    if (mockConfig) {
      let mockPath = mockConfig.path
      let rules = [].concat(config.rules)
      rules.forEach((rule) => {
        rule = new RegExp(rule).source.replace(/\//g, '_').replace(/^_|_$/, '')
        let rules = findAPIs(path.resolve(mockPath, rule))
        projects.push({
          path: rule,
          rules
        })
      })
    }
  })
  return projects
}

module.exports = {
  encoding,
  mergeData,
  isApi,
  getParams,
  getApiDocData
}