"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRuntimeConfig = void 0;
const url_parser_1 = require("@aws-sdk/url-parser");
const endpoints_1 = require("./endpoints");
const getRuntimeConfig = (config) => {
    var _a, _b, _c, _d, _e;
    return ({
        apiVersion: "2019-06-10",
        disableHostPrefix: (_a = config === null || config === void 0 ? void 0 : config.disableHostPrefix) !== null && _a !== void 0 ? _a : false,
        logger: (_b = config === null || config === void 0 ? void 0 : config.logger) !== null && _b !== void 0 ? _b : {},
        regionInfoProvider: (_c = config === null || config === void 0 ? void 0 : config.regionInfoProvider) !== null && _c !== void 0 ? _c : endpoints_1.defaultRegionInfoProvider,
        serviceId: (_d = config === null || config === void 0 ? void 0 : config.serviceId) !== null && _d !== void 0 ? _d : "SSO",
        urlParser: (_e = config === null || config === void 0 ? void 0 : config.urlParser) !== null && _e !== void 0 ? _e : url_parser_1.parseUrl,
    });
};
exports.getRuntimeConfig = getRuntimeConfig;
