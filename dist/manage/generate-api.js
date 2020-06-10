const path = require('path')
const fs = require('fs')
const webpack = require('webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const HtmlWebpackInlineSourcePlugin = require('html-webpack-inline-source-plugin')

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

module.exports = (configs) => {
  let projects = []
  configs.forEach((config) => {
    let mockConfig = config.mockConfig
    if (mockConfig) {
      let mockPath = mockConfig.path
      let rules = findAPIs(path.resolve(mockPath))
      projects.push({
        path: '',
        rules
      })
    }
    
  })

  webpack({
    entry: {
      main: path.resolve(__dirname, './index.js')
    },
    output: {
      path: path.resolve(__dirname, './')
    },
    module: {
      rules: [
        {
          test: /\.tpl$/,
          exclude: /node_modules/,
          use: {
            loader: 'simplite-loader'
          }
        }
      ]
    },
    plugins: [
      new HtmlWebpackPlugin({
        inject: true,
        template: path.resolve(__dirname, './index.tpl'),
        templateParameters: projects,
        inlineSource: '.js$'
      }),
      new HtmlWebpackInlineSourcePlugin()
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
    },
  }, (err) => {
    console.log(err)
  })
}