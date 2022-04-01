"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMockHttp2Server = exports.createMockHttpServer = exports.createMockHttpsServer = exports.createContinueResponseFunction = exports.createResponseFunctionWithDelay = exports.createResponseFunction = void 0;
const fs_1 = require("fs");
const http_1 = require("http");
const http2_1 = require("http2");
const https_1 = require("https");
const path_1 = require("path");
const stream_1 = require("stream");
const fixturesDir = (0, path_1.join)(__dirname, "..", "fixtures");
const setResponseHeaders = (response, headers) => {
    for (const [key, value] of Object.entries(headers)) {
        response.setHeader(key, value);
    }
};
const setResponseBody = (response, body) => {
    if (body instanceof stream_1.Readable) {
        body.pipe(response);
    }
    else {
        response.end(body);
    }
};
const createResponseFunction = (httpResp) => (request, response) => {
    response.statusCode = httpResp.statusCode;
    setResponseHeaders(response, httpResp.headers);
    setResponseBody(response, httpResp.body);
};
exports.createResponseFunction = createResponseFunction;
const createResponseFunctionWithDelay = (httpResp, delay) => (request, response) => {
    response.statusCode = httpResp.statusCode;
    setResponseHeaders(response, httpResp.headers);
    setTimeout(() => setResponseBody(response, httpResp.body), delay);
};
exports.createResponseFunctionWithDelay = createResponseFunctionWithDelay;
const createContinueResponseFunction = (httpResp) => (request, response) => {
    response.writeContinue();
    setTimeout(() => {
        (0, exports.createResponseFunction)(httpResp)(request, response);
    }, 100);
};
exports.createContinueResponseFunction = createContinueResponseFunction;
const createMockHttpsServer = () => {
    const server = (0, https_1.createServer)({
        key: (0, fs_1.readFileSync)((0, path_1.join)(fixturesDir, "test-server-key.pem")),
        cert: (0, fs_1.readFileSync)((0, path_1.join)(fixturesDir, "test-server-cert.pem")),
    });
    return server;
};
exports.createMockHttpsServer = createMockHttpsServer;
const createMockHttpServer = () => {
    const server = (0, http_1.createServer)();
    return server;
};
exports.createMockHttpServer = createMockHttpServer;
const createMockHttp2Server = () => {
    const server = (0, http2_1.createServer)();
    return server;
};
exports.createMockHttp2Server = createMockHttp2Server;
