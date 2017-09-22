/**
 * @file 本地mock支持及远程代理 local mock and remote proxy
 * @author zhangshaolong
 */

'use strict';

const queryString = require('querystring');

const URL = require('url');

const http = require('http');

const formDataReg = /multipart\/form-data/;

const path = require('path');

const fs = require('fs');

const encoding = 'UTF-8';

let proxyInfo;

 /*
    opts.apiConfig = {
        type: 'prefix', // prefix or suffix
        value: ['/api/', '/common-api/'] // or array like ['/api/', '/api-prefix/']
    }
    opts.ignoreProxyPaths = {
        '/api/a/b/c': 1,
        '/api/get_index_data': 1,
        '/api/user_info': 1
    }
    opts.proxyInfo = {
        host: '1.1.1.1',
        port: 8080
    }
    opts.mockPath = 'xxx'; // 默认为项目下的mock目录

**/
module.exports = (opts) => {
    return (req, res, next) => {
        const apiConfig = opts.apiConfig;
        const ignoreProxyPaths = opts.ignoreProxyPaths || {};
        const mockPath = opts.mockPath || 'mock';
        proxyInfo = opts.proxyInfo || proxyInfo;
        const reqUrl = req.url;
        const withoutArgUrl = reqUrl.split(/\?/)[0];
        const apiType = apiConfig.type;
        const apiValue = apiConfig.value;
        if (typeof apiValue === 'string') {
            apiValue = [apiValue];
        }
        const len = apiValue.length;
        if (apiType === 'prefix') {
            for (let i = 0; i < len; i++) {
                apiValue[i] = apiValue[i];
            }
        }
        let isApi = false;
        if (apiType === 'prefix') {
            for (let i = 0; i < len; i++) {
                if (!isApi) {
                    isApi = reqUrl.indexOf(apiValue[i]) === 0;
                }
            }
        } else if (apiType === 'suffix') {
            for (let i = 0; i < len; i++) {
                if (!isApi) {
                    isApi = isApi = withoutArgUrl.endsWith(apiValue[i]);
                }
            }
        }
        if (isApi) {
            const contentType = req.headers['content-type'];// || 'text/plain;charset=' + encoding;
            const headers = {};
            for (let key in req.headers) {
                headers[key] = req.headers[key];
            };
            const method = req.method.toUpperCase();
            const urlInfo = URL.parse(reqUrl, true);

            const getProxyInfo = () => {
                const pageUrl = req.headers.referer;
                if (pageUrl) {
                    const query = URL.parse(pageUrl, true).query;
                    if (query && query.proxy) {
                        const pair = query.proxy.replace(/^https?\:\/\//, '').split(':');
                        return {
                            host: pair[0],
                            port: pair[1] || 80
                        }
                    }
                }
            };

            const doProxy = (proxyInfo) => {
                headers.host = proxyInfo.host + ':' + proxyInfo.port;
                if (contentType) {
                    headers['Content-Type'] = contentType;
                }
                // delete headers['accept-encoding']; // 去掉压缩数据
                const options = {
                    host: proxyInfo.host,
                    port: proxyInfo.port,
                    path: reqUrl,
                    method: req.method,
                    timeout: 30000,
                    headers: headers
                    // headers: {
                    //   // 如果代理服务器需要认证
                    //   'Proxy-Authentication': 'Base ' + new Buffer('user:password').toString('base64')    // 替换为代理服务器用户名和密码
                    // }
                };
                let postData = '';
                if (method === 'POST') {
                    req.on('error', (e) => {
                        console.log('req error: ' + e.message);
                    })
                    if (req.body) {
                        if (contentType && contentType.indexOf('application/x-www-form-urlencoded') > -1) {
                            postData = queryString.stringify(req.body);
                        } else {
                            postData = JSON.stringify(req.body);
                        }
                        console.log(`proxy request: \n\tMethod:${method}\n\tPath:${reqUrl}\n\tParams:${postData}`)
                        headers.contentLength = postData.length;
                        let proxyReq = http.request(options, (proxyRes) => {
                            let headers = proxyRes.headers;
                            let statusCode = proxyRes.statusCode;
                            try {
                                res.writeHeader(statusCode, headers);
                            } catch (e) {
                                console.log('setHeader error', e.message);
                            }
                            proxyRes.pipe(res);
                        });
                        proxyReq.on('error', (e) => {
                            console.log('proxyReq error: ' + e.message);
                        })
                        proxyReq.end(postData, encoding);
                    } else {
                        req.on('data', (data) => {
                            postData += data;
                        })
                        req.on('end', () => {
                            headers.contentLength = postData.length;
                            let proxyReq = http.request(options, (proxyRes) => {
                                let headers = proxyRes.headers;
                                let statusCode = proxyRes.statusCode;
                                try {
                                    res.writeHeader(statusCode, headers);
                                } catch (e) {
                                    console.log('setHeader error', e.message);
                                }
                                proxyRes.pipe(res);
                            });
                            console.log(`proxy request: \n\tMethod:${method}\n\tPath:${reqUrl}\n\tParams:${postData}`)
                            proxyReq.end(postData, encoding);
                        })
                    }
                } else if (method === 'GET') {
                    postData = JSON.stringify(urlInfo.query);
                    headers.contentLength = Buffer.byteLength(postData);
                    console.log(`proxy request: \n\tMethod:${method}\n\tPath:${reqUrl}\n\tParams:${postData}`)
                    let proxyReq = http.request(options, (proxyRes) => {
                        let headers = proxyRes.headers;
                        let statusCode = proxyRes.statusCode;
                        try {
                            res.writeHeader(statusCode, headers);
                        } catch (e) {
                            console.log('setHeader error', e.message);
                        }
                        proxyRes.pipe(res);
                    });
                    proxyReq.end(postData, encoding);
                }
            };
            if (!proxyInfo) {
                proxyInfo = getProxyInfo();
            }

            if (proxyInfo && !ignoreProxyPaths[withoutArgUrl]) {
                doProxy(proxyInfo);
                return ;
            }

            const doMock = (params, pathName) => {
                try {
                    if (params.__url__) {
                        pathName = params.__url__;
                        delete params.__url__;
                    }
                    if (apiType === 'prefix') {
                        const parts = pathName.replace(/^\//, '').split(/\//);
                        const prefix = parts.shift();
                        pathName = path.resolve(mockPath, prefix, parts.join('_'));
                    } else {
                        for (let i = 0; i < len; i++) {
                            pathName = pathName.replace(apiValue[i], '');
                        }
                        pathName = path.resolve(process.cwd(), mockPath, pathName.replace(/^\//, '').replace(/\//g, '_'));
                    }
                    pathName += '.js';
                    fs.exists(pathName, (exist) => {
                        if (exist) {
                            try {
                                const content = new String(fs.readFileSync(pathName), encoding);
                                try {
                                    let result = new Function('return ' + content)();
                                    if (typeof result === 'function') {
                                        result = result(params);
                                    }
                                    if (!isNaN(result.sleep) && result.sleep > 0) {
                                        setTimeout(() => {
                                            delete result.sleep;
                                            res.end(JSON.stringify(result));
                                        }, result.sleep);
                                    } else {
                                        if (typeof result !== 'string') {
                                            result = JSON.stringify(result);
                                        }
                                        res.end(result);
                                    }
                                } catch (e) {
                                    res.end(JSON.stringify({
                                        status: 500,
                                        e: e
                                    }));
                                }
                            } catch (e) {
                                res.end(JSON.stringify({
                                    status: 500,
                                    e: pathName + '文件不存在~'
                                }));
                            }
                        } else {
                            res.end(JSON.stringify({
                                status: 500,
                                e: pathName + '文件不存在~'
                            }));
                        }
                    });
                } catch (e) {
                    try {
                        result = json.parse(result);
                        res.end(result);
                    } catch (e) {
                        res.end(JSON.stringify({
                            status: 500
                        }));
                    }
                }
            };
            if (formDataReg.test(contentType)) {
                req.once('data', (data) => {
                    doMock(queryString.parse(String(data, encoding)), urlInfo.pathname);
                });
                return;
            }
            let params = '';
            if (method === 'POST') {
                req.on('data', (data) => {
                    params += data;
                });
                req.on('end', () => {
                    if (contentType && contentType.indexOf('application/x-www-form-urlencoded') > -1) {
                        params = queryString.parse(params);
                    } else {
                        params = JSON.parse(params);
                    }
                    doMock(params, urlInfo.pathname);
                });
            } else if (method === 'GET') {
                params = urlInfo.query;
                doMock(params, urlInfo.pathname);
            }
        } else {
            return next();
        }
    }
}