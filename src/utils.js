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

const isApi = (request, opt) => {
  const path = request.path
  const type = opt.type
  const rules = opt.rules
  if (typeof rules === 'string') {
    rules = [rules]
  }
  const len = rules.length
  let isApi = false
  if (type === 'prefix') {
    for (let i = 0; i < len; i++) {
      if (path.startsWith(rules[i])) {
        isApi = true
        break
      }
    }
  } else if (type === 'suffix') {
    for (let i = 0; i < len; i++) {
      if (path.endsWith(rules[i])) {
        isApi = true
        break
      }
    }
  }
  return isApi
}

const getParams = (request, method, isFormData) => {
  if (method === 'POST') {
    let bodyData = request.body
    if (bodyData) {
      return Promise.resolve((isFormData ? queryString.stringify : JSON.stringify)(bodyData))
    } else {
      return mergeData(request)
    }
  } else if (method === 'GET') {
    return Promise.resolve(request.query)
  }
}

module.exports = {
  encoding,
  mergeData,
  isApi,
  getParams,
}
