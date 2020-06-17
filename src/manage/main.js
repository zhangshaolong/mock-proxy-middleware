const webpack = require('webpack')
const path = require('path')
const Simplite = require('simplite')
const fs = require('fs')

webpack({
    mode: 'production',
    entry: {
      main: path.resolve(__dirname, './index.js')
    },
    output: {
      path: path.resolve(__dirname, '../../dist/')
    }
  }, (err, stats) => {
    if (!err) {
      const template = fs.readFileSync(path.resolve(__dirname, './index.tpl'), 'utf8')
      const code = Simplite.toCodeBlock(template)
      const render = `
        module.exports = (data) => {
          return Function('_this',${JSON.stringify(code)}).call({defaultAttr:v=>v},data);
        }
      `
      fs.writeFileSync(path.resolve(__dirname, '../../dist/render.js'), render)
    } else {
      console.log(err)
    }
  })