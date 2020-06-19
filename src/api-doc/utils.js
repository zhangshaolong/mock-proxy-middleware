/**
 * @file: common tool functions
 * @author: 369669902@qq.com
 */
import service from 'service-api'

/**
 * @param {object} data  json data，required
 * @param {bool} codeStyle highlight
 * @param {number} space
 * @param indents 当前行需要的缩进（内部参数，调用者不要设置）
 */
const formatJSON = (data, codeStyle = true, space, indents) => {
  if (null == data) {
    return '' + data
  }
  space = space != null ? space : '  '
  indents = indents || ''
  var constructor = data.constructor
  if (constructor === String) {
    return codeStyle ? '<span class="json-string-value">"' + data + '"</span>' : '"' + data + '"'
  } else if (constructor === Number || constructor === Boolean) {
    return codeStyle ? '<span class="json-number-value">' + data + '</span>' : data
  } else if (constructor === Array) {
    var astr = codeStyle ? '<span class="json-array-tag">[</span>\n' : '[\n'
    var len = data.length
    if (len) {
      for (var i = 0; i < len - 1; i++) {
        astr += indents + space + formatJSON(data[i], codeStyle, space, indents + space) + ',\n'
      }
      astr += indents + space + formatJSON(data[len - 1], codeStyle, space, indents + space) + '\n'
    }
    return astr + indents + (codeStyle ? '<span class="json-array-tag">]</span>' : ']')
  } else if (constructor === Object) {
    var ostr = codeStyle ? '<span class="json-object-tag">{</span>\n' : '{\n'
    var isEmpty = true
    for (var key in data) {
      isEmpty = false
      ostr += indents + space + (codeStyle ? '<span class="json-object-key">' + '"' + key + '"' + '</span>' : '"' + key + '"')
        + ': ' + formatJSON(data[key], codeStyle, space, indents + space) + ',\n'
    }
    if (!isEmpty) {
      ostr = ostr.slice(0, -2) + '\n'
    }
    return ostr + indents + (codeStyle ? '<span class="json-object-tag">}</span>' : '}')
  }
}

const showLoading = (container, tip) => {
  let loadingCount = container.dataset._loadingCount || 0
  container.dataset._loadingCount = ++loadingCount
  if (loadingCount === 1) {
    container.classList.add('loading')
    let mask = document.createElement('center')
    mask.className = 'mask'
    mask.style.cssText = 'position:absolute;top:0;right:0;bottom:0;left:0;z-index:1000;'
    container.appendChild(mask)
    const frames =`@keyframes loading-css {
      0%, 80%, 100% {
        transform: scale(0);
      }
      40% {
        transform: scale(1);
      }
    }`
    const style = document.createElement('style')
    style.type = 'text/css'
    style.innerHTML = frames
    mask.appendChild(style)

    let circle = document.createElement('div')
    circle.style.cssText = 'position:absolute;width:100%;height:40px;top:50%;margin-top:-20px;'
    for (let i = 0; i < 12; i++) {
      let head = document.createElement('div')
      let delay = ''
      let rotate = ''
      if (i) {
        delay = 'animation-delay:' + (-1.2 + i * 0.1) +'s;'
        rotate = 'transform:rotate(' + 30 * i + 'deg);'
      }
      head.style.cssText = 'width:5px;height:5px;background-color:#333;border-radius:100%;animation:loading-css 1.2s infinite ease-in-out both;' + delay
      let child = document.createElement('div')
      child.style.cssText = 'position:absolute;top:0;right:0;bottom:0;left:0;' + rotate
      circle.appendChild(child)
      child.appendChild(head)
    }
    mask.appendChild(circle)
    if (tip) {
      let tipNode = document.createElement('div')
      tipNode.innerHTML = tip
      tipNode.className = 'tip'
      tipNode.style.cssText = 'position:absolute;top:50%;margin-top:25px;left:0;right:0;text-align:center;'
      circle.appendChild(tipNode)
    }
    mask.onclick = function (e) {
      e.stopPropagation()
    }
  }
}

const hideLoading = (container) => {
  if (--container.dataset._loadingCount <= 0) {
    container.classList.remove('loading')
    let mask = null
    for (let i = 0; i < container.children.length; i++) {
      if (container.children[i].classList.contains('mask')) {
        mask = container.children[i]
        break
      }
    }
    if (mask) {
      container.removeChild(mask)
    }
  }
}

const defaultServiceConfig = {
  showLoading: showLoading,
  hideLoading: hideLoading,
  checkStatus: (resp) => {
    return true
  },
  dealError: (error) => {
    return true
  }
}

const configService = (config) => {
  service.config(Object.assign({}, defaultServiceConfig, config))
}

/**
   * get the url' args
   * @param {string} queryStr location.search | location.hash
   * @param {string} if key，return the vaule of key，other return the map of all key->value
   * @return {string|Object}
   */
const getQueryString = function (queryStr) {
  let len = arguments.length
  if (len === 1) {
    let querys = {}
    queryStr.replace(/(?:\?|&|^)([^=]+)=([^&$]*)/g, (all, key, val) => {
      querys[key] = decodeURIComponent(val)
    })
    return querys
  } else if (len === 2) {
    let rst = new RegExp('(?:\\?|&|^)' + arguments[1] + '=([^&$]*)').exec(queryStr)
    return rst && decodeURIComponent(rst[1])
  }
}

export {
  formatJSON,
  configService,
  getQueryString
}

