import service from 'service-api'
import { formatJSON, configService, getQueryString } from './utils'

const typeMap = {
  form: 'application/x-www-form-urlencoded;charset=utf-8',
  formdata: 'multipart/form-data',
  json: 'application/json;charset=utf-8'
}

configService()

const isParentNode = (parentNode, ele) => {
  if (ele) {
    if (ele.parentNode === parentNode || ele === parentNode) {
      return true
    }
    return isParentNode(parentNode, ele.parentNode)
  }
}

let respDescMap = {}

window.onload = () => {
  let mockData = APIDATA
  let metaMap = {}
  let resultNode = document.getElementById('result')
  mockData.forEach((mockConfig) => {
    let project = mockConfig.path
    let rules = mockConfig.rules
    rules.forEach((ruleConfig) => {
      let prefix = ruleConfig.name
      let apis = ruleConfig.apis
      apis.forEach((apiConfig) => {
        let path = apiConfig.path
        metaMap[project + prefix + path] = apiConfig
      })
    })
  })
  document.querySelectorAll('.folder').forEach((ele) => {
    ele.onclick = (e) => {
      if (e.target === ele.firstChild) {
        ele.classList.toggle('closed')
      }
    }
  })

  document.querySelectorAll('.view').forEach((ele) => {
    ele.onclick = (e) => {
      e.stopPropagation()
      e.preventDefault()
      if (e.target === ele) {
        let data = ele.dataset
        let uuid = data.id
        let meta = metaMap[uuid]
        respDescMap = meta.respDescMap
        let method = document.querySelector('[name="' + uuid + '"]:checked').value
        let paramsTextarea = document.getElementById(uuid + '-textarea')
        let params
        if (paramsTextarea) {
          params = paramsTextarea.value.trim()
          if (params) {
            if (/^\s*\{/.test(params)) {
              try {
                params = Function('return ' + params)()
              } catch (e) {}
            } else {
              params = getQueryString(params)
            }
          }
        }
        let context = {
          context: document.body
        }
        let headersTextarea = document.getElementById(uuid + '-headers')
        let headers = {}
        if (headersTextarea) {
          headers = headersTextarea.value.trim()
          if (headers) {
            if (/^\s*\{/.test(headers)) {
              try {
                headers = Function('return ' + headers)()
              } catch (e) {}
            } else {
              headers = getQueryString(headers)
            }
          }
        }
        if (meta.type) {
          headers['Content-Type'] = typeMap[meta.type]
        }
        context.headers = headers
        service[method](meta.path, params, context).then((resp) => {
          resultNode.innerHTML = formatJSON(resp)
          resultNode.classList.remove('hide')
          resultNode.style.marginLeft = -resultNode.clientWidth / 2 + 'px'
          resultNode.style.marginTop = -resultNode.clientHeight / 2 + 'px'
          resultNode.querySelectorAll('.json-object-key').forEach((keyNode) => {
            let desc = respDescMap[keyNode.innerHTML.replace(/^"|"$/g, '')]
            if (desc) {
              let qtNode = keyNode.nextElementSibling.nextSibling
              if (qtNode) {
                if (qtNode.nodeType === 3) {
                  qtNode.nodeValue = qtNode.nodeValue.replace(/^(,)?([^$]+)$/, (all, k, space) => {
                    return (k || '') + ' //' + desc + space
                  })
                }
              }
            }
          })
        })
      }
    }
  })

  document.onclick = (e) => {
    if (isParentNode(result, e.target)) {
      return
    }
    result.classList.add('hide')
  }
}