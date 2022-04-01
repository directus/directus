import { __assign } from "tslib";
import { ProviderError } from "@aws-sdk/property-provider";
import { Buffer } from "buffer";
import { request } from "http";
export function httpRequest(options) {
    return new Promise(function (resolve, reject) {
        var _a;
        var req = request(__assign(__assign({ method: "GET" }, options), { hostname: (_a = options.hostname) === null || _a === void 0 ? void 0 : _a.replace(/^\[(.+)\]$/, "$1") }));
        req.on("error", function (err) {
            reject(Object.assign(new ProviderError("Unable to connect to instance metadata service"), err));
            req.destroy();
        });
        req.on("timeout", function () {
            reject(new ProviderError("TimeoutError from instance metadata service"));
            req.destroy();
        });
        req.on("response", function (res) {
            var _a = res.statusCode, statusCode = _a === void 0 ? 400 : _a;
            if (statusCode < 200 || 300 <= statusCode) {
                reject(Object.assign(new ProviderError("Error response received from instance metadata service"), { statusCode: statusCode }));
                req.destroy();
            }
            var chunks = [];
            res.on("data", function (chunk) {
                chunks.push(chunk);
            });
            res.on("end", function () {
                resolve(Buffer.concat(chunks));
                req.destroy();
            });
        });
        req.end();
    });
}
