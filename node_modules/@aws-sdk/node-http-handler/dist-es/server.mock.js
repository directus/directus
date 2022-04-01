import { __read, __values } from "tslib";
import { readFileSync } from "fs";
import { createServer as createHttpServer } from "http";
import { createServer as createHttp2Server } from "http2";
import { createServer as createHttpsServer } from "https";
import { join } from "path";
import { Readable } from "stream";
var fixturesDir = join(__dirname, "..", "fixtures");
var setResponseHeaders = function (response, headers) {
    var e_1, _a;
    try {
        for (var _b = __values(Object.entries(headers)), _c = _b.next(); !_c.done; _c = _b.next()) {
            var _d = __read(_c.value, 2), key = _d[0], value = _d[1];
            response.setHeader(key, value);
        }
    }
    catch (e_1_1) { e_1 = { error: e_1_1 }; }
    finally {
        try {
            if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
        }
        finally { if (e_1) throw e_1.error; }
    }
};
var setResponseBody = function (response, body) {
    if (body instanceof Readable) {
        body.pipe(response);
    }
    else {
        response.end(body);
    }
};
export var createResponseFunction = function (httpResp) { return function (request, response) {
    response.statusCode = httpResp.statusCode;
    setResponseHeaders(response, httpResp.headers);
    setResponseBody(response, httpResp.body);
}; };
export var createResponseFunctionWithDelay = function (httpResp, delay) { return function (request, response) {
    response.statusCode = httpResp.statusCode;
    setResponseHeaders(response, httpResp.headers);
    setTimeout(function () { return setResponseBody(response, httpResp.body); }, delay);
}; };
export var createContinueResponseFunction = function (httpResp) { return function (request, response) {
    response.writeContinue();
    setTimeout(function () {
        createResponseFunction(httpResp)(request, response);
    }, 100);
}; };
export var createMockHttpsServer = function () {
    var server = createHttpsServer({
        key: readFileSync(join(fixturesDir, "test-server-key.pem")),
        cert: readFileSync(join(fixturesDir, "test-server-cert.pem")),
    });
    return server;
};
export var createMockHttpServer = function () {
    var server = createHttpServer();
    return server;
};
export var createMockHttp2Server = function () {
    var server = createHttp2Server();
    return server;
};
