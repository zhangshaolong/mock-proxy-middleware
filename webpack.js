const HtmlWebpackPlugin = require('html-webpack-plugin')
const path = require('path')
const fs = require('fs')
let project

const parseMeta = (data) => {
  const meta = {
    method: 'get',
    type: 'json'
  }
  let dt = data.replace(/^\s*(?:\<meta\>([\s\S]*?)<\/meta\>\s*)?/im, function (all, content) {
    if (!content) return ''
    let lines = content.split(/\n/)
    let paramsMap = {}
    let hasParamMap = false
    lines.forEach((line) => {
      line.replace(/^\s*@(path|method|params|desc|type|headers)\s*([\s\S]+)$/gi, (str, type, val) => {
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
  let respDescMap = {}
  dt.split(/\n/).forEach((line) => {
    if (/^\s*((["'])([^\2]+)\2|([^\s]+))\s*:\s*((['"])[^\6]+\6|[\s\S]*\/\/([^$]+))$/.test(line)) {
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

let projects = []

mocks.forEach((projectCfg) => {
  let pth = projectCfg.project
  if (project) {
    if (pth !== project) {
      return
    }
  }
  let rules = findAPIs(path.resolve(__dirname, '../mock/' + pth))
  projects.push({
    path: pth,
    rules
  })
})

const config = {
  plugins: [
    new HtmlWebpackPlugin({
      inject: true,
      template: path.resolve(__dirname, '../src/index.tpl'),
      templateParameters: projects
    })
  ],
  module: {
    rules: [
      {
        test: /\.tpl$/,
        use: {
          loader: 'simplite-loader'
        }
      }
    ]
  }
}

module.exports = config