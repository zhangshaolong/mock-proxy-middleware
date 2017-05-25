/**
 * @file 本地mock支持及远程代理 local mock and remote proxy
 * @author zhangshaolong
 */

'use strict';

var queryString = require('querystring');

var URL = require('url');

var http = require('http');

var formDataReg = /multipart\/form-data/;

var path = require('path');

var fs = require('fs');

var proxyInfo;

var encoding = 'UTF-8';

 /*
    opts.apiConfig = {
        type: 'prefix', // prefix or suffix
        value: ['/api/', '/common-api/'] // or array like ['/api/', '/api-prefix/']
    }
    opts.ignoreProxyPaths = {
        '/api/a/b/c': 1,
        '/api/get_index_data': 1,
        '/api/user_info': 1
    },
    opts.mockPath = 'xxx'; // 默认为项目下的mock目录

**/
module.exports = function (opts) {
    var apiConfig = opts.apiConfig;
    var ignoreProxyPaths = opts.ignoreProxyPaths || {};
    var mockPath = opts.mockPath || 'mock';

    return function (req, res, next) {
        var reqUrl = req.url;
        var withoutArgUrl = reqUrl.split(/\?/)[0];
        var apiType = apiConfig.type;
        var apiValue = apiConfig.value;
        if (typeof apiValue === 'string') {
            apiValue = [apiValue];
        }
        var len = apiValue.length;
        if (apiType === 'prefix') {
            for (var i = 0; i < len; i++) {
                apiValue[i] = apiValue[i];
            }
        }
        var isApi = false;
        if (apiType === 'prefix') {
            for (var i = 0; i < len; i++) {
                if (!isApi) {
                    isApi = reqUrl.indexOf(apiValue[i]) === 0;
                }
            }
        } else if (apiType === 'suffix') {
            for (var i = 0; i < len; i++) {
                if (!isApi) {
                    isApi = isApi = withoutArgUrl.endsWith(apiValue[i]);
                }
            }
        }
        if (isApi) {
            var contentType = req.headers['content-type'] || 'text/plain;charset=' + encoding;
            res.writeHead(200, {'Content-Type': contentType});
            var headers = {};
            for (var key in req.headers) {
                headers[key] = req.headers[key];
            };

            var getProxyInfo = function () {
                var pageUrl = req.headers.referer;

                var query = URL.parse(pageUrl, true).query;

                if (query && query.proxy) {
                    var pair = query.proxy.replace(/^https?\:\/\//, '').split(':');
                    return {
                        host: pair[0],
                        port: pair[1] || 80
                    }
                }
            };

            var doProxy = function (proxyInfo) {
                headers.host = proxyInfo.host + ':' + proxyInfo.port;
                delete headers['accept-encoding']; // 去掉压缩数据
                var options = {
                    host: proxyInfo.host,
                    port: proxyInfo.port,
                    path: reqUrl,
                    method: req.method,
                    headers: headers
                    // headers: {
                    //   // 如果代理服务器需要认证
                    //   'Proxy-Authentication': 'Base ' + new Buffer('user:password').toString('base64')    // 替换为代理服务器用户名和密码
                    // }
                };

                var proxyReq = http.request(options, function (proxyRes) {
                    proxyRes.pipe(res);
                });

                req.on('data', function (data) {
                    proxyReq.write(data);
                });

                req.on('end', function () {
                    proxyReq.end();
                });
            };

            if (!proxyInfo) {
                proxyInfo = getProxyInfo();
            }

            if (proxyInfo && !ignoreProxyPaths[withoutArgUrl]) {
                doProxy(proxyInfo);
                return ;
            }

            var doMock = function (params, pathName) {
                try {
                    if (params.__url__) {
                        pathName = params.__url__;
                        delete params.__url__;
                    }
                    if (apiType === 'prefix') {
                        var parts = pathName.replace(/^\//, '').split(/\//);
                        var prefix = parts.shift();
                        pathName = path.resolve(mockPath, prefix, parts.join('_'));
                    } else {
                        for (var i = 0; i < len; i++) {
                            pathName = pathName.replace(apiValue[i], '');
                        }
                        pathName = path.resolve(process.cwd(), mockPath, pathName.replace(/^\//, '').replace(/\//g, '_'));
                    }
                    pathName += '.js';
                    fs.exists(pathName, function (exist) {
                        if (exist) {
                            try {
                                var content = new String(fs.readFileSync(pathName), encoding);
                                try {
                                    var result = new Function('return ' + content)();
                                    if (typeof result === 'function') {
                                        result = result(params);
                                    }
                                    if (!isNaN(result.sleep) && result.sleep > 0) {
                                        setTimeout(function () {
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
            var method = req.method.toUpperCase();
            var urlInfo = URL.parse(reqUrl, true);
            if (formDataReg.test(contentType)) {
                req.once('data', function(data) {
                    doMock(queryString.parse(String(data, encoding)), urlInfo.pathname);
                });
                return;
            }
            var params = '';
            if (method === 'POST') {
                req.on('data', function (data) {
                    params += data;
                });
                req.on('end', function () {
                    if (contentType.indexOf('application/x-www-form-urlencoded') > -1) {
                        params = queryString.parse(params);
                    } else if (contentType.indexOf('application/json') > -1) {
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