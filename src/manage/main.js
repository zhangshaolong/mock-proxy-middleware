const webpack = require('webpack')
const path = require('path')
const Simplite = require('simplite')
const fs = require('fs')

webpack({
    mode: 'production',
    entry: {
      main: path.resolve(__dirname, './index.js')
    }
  }, (err, stats) => {
    if (!err) {
      const template = fs.readFileSync(path.resolve(__dirname, './index.tpl'), 'utf8')
      const code = Simplite.toCodeBlock(template)
      let jsContent = stats.compilation.assets['main.js']._value
      const render = `
        module.exports = (data) => {
          data.__main__ = ${JSON.stringify(jsContent)}
          return Function('_this',${JSON.stringify(code)}).call({defaultAttr:v=>v},data);
        }
      `
      fs.writeFileSync(path.resolve(__dirname, '../../dist/render.js'), render)
    } else {
      console.log(err)
    }
  })