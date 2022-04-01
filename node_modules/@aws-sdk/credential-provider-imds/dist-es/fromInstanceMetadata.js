import { __assign, __awaiter, __generator } from "tslib";
import { CredentialsProviderError } from "@aws-sdk/property-provider";
import { httpRequest } from "./remoteProvider/httpRequest";
import { fromImdsCredentials, isImdsCredentials } from "./remoteProvider/ImdsCredentials";
import { providerConfigFromInit } from "./remoteProvider/RemoteProviderInit";
import { retry } from "./remoteProvider/retry";
import { getInstanceMetadataEndpoint } from "./utils/getInstanceMetadataEndpoint";
import { staticStabilityProvider } from "./utils/staticStabilityProvider";
var IMDS_PATH = "/latest/meta-data/iam/security-credentials/";
var IMDS_TOKEN_PATH = "/latest/api/token";
export var fromInstanceMetadata = function (init) {
    if (init === void 0) { init = {}; }
    return staticStabilityProvider(getInstanceImdsProvider(init), { logger: init.logger });
};
var getInstanceImdsProvider = function (init) {
    var disableFetchToken = false;
    var _a = providerConfigFromInit(init), timeout = _a.timeout, maxRetries = _a.maxRetries;
    var getCredentials = function (maxRetries, options) { return __awaiter(void 0, void 0, void 0, function () {
        var profile;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4, retry(function () { return __awaiter(void 0, void 0, void 0, function () {
                        var profile, err_1;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 2, , 3]);
                                    return [4, getProfile(options)];
                                case 1:
                                    profile = _a.sent();
                                    return [3, 3];
                                case 2:
                                    err_1 = _a.sent();
                                    if (err_1.statusCode === 401) {
                                        disableFetchToken = false;
                                    }
                                    throw err_1;
                                case 3: return [2, profile];
                            }
                        });
                    }); }, maxRetries)];
                case 1:
                    profile = (_a.sent()).trim();
                    return [2, retry(function () { return __awaiter(void 0, void 0, void 0, function () {
                            var creds, err_2;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        _a.trys.push([0, 2, , 3]);
                                        return [4, getCredentialsFromProfile(profile, options)];
                                    case 1:
                                        creds = _a.sent();
                                        return [3, 3];
                                    case 2:
                                        err_2 = _a.sent();
                                        if (err_2.statusCode === 401) {
                                            disableFetchToken = false;
                                        }
                                        throw err_2;
                                    case 3: return [2, creds];
                                }
                            });
                        }); }, maxRetries)];
            }
        });
    }); };
    return function () { return __awaiter(void 0, void 0, void 0, function () {
        var endpoint, token, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4, getInstanceMetadataEndpoint()];
                case 1:
                    endpoint = _a.sent();
                    if (!disableFetchToken) return [3, 2];
                    return [2, getCredentials(maxRetries, __assign(__assign({}, endpoint), { timeout: timeout }))];
                case 2:
                    token = void 0;
                    _a.label = 3;
                case 3:
                    _a.trys.push([3, 5, , 6]);
                    return [4, getMetadataToken(__assign(__assign({}, endpoint), { timeout: timeout }))];
                case 4:
                    token = (_a.sent()).toString();
                    return [3, 6];
                case 5:
                    error_1 = _a.sent();
                    if ((error_1 === null || error_1 === void 0 ? void 0 : error_1.statusCode) === 400) {
                        throw Object.assign(error_1, {
                            message: "EC2 Metadata token request returned error",
                        });
                    }
                    else if (error_1.message === "TimeoutError" || [403, 404, 405].includes(error_1.statusCode)) {
                        disableFetchToken = true;
                    }
                    return [2, getCredentials(maxRetries, __assign(__assign({}, endpoint), { timeout: timeout }))];
                case 6: return [2, getCredentials(maxRetries, __assign(__assign({}, endpoint), { headers: {
                            "x-aws-ec2-metadata-token": token,
                        }, timeout: timeout }))];
            }
        });
    }); };
};
var getMetadataToken = function (options) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        return [2, httpRequest(__assign(__assign({}, options), { path: IMDS_TOKEN_PATH, method: "PUT", headers: {
                    "x-aws-ec2-metadata-token-ttl-seconds": "21600",
                } }))];
    });
}); };
var getProfile = function (options) { return __awaiter(void 0, void 0, void 0, function () { return __generator(this, function (_a) {
    switch (_a.label) {
        case 0: return [4, httpRequest(__assign(__assign({}, options), { path: IMDS_PATH }))];
        case 1: return [2, (_a.sent()).toString()];
    }
}); }); };
var getCredentialsFromProfile = function (profile, options) { return __awaiter(void 0, void 0, void 0, function () {
    var credsResponse, _a, _b;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                _b = (_a = JSON).parse;
                return [4, httpRequest(__assign(__assign({}, options), { path: IMDS_PATH + profile }))];
            case 1:
                credsResponse = _b.apply(_a, [(_c.sent()).toString()]);
                if (!isImdsCredentials(credsResponse)) {
                    throw new CredentialsProviderError("Invalid response received from instance metadata service.");
                }
                return [2, fromImdsCredentials(credsResponse)];
        }
    });
}); };
