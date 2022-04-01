import { __assign, __awaiter, __generator } from "tslib";
import { CredentialsProviderError } from "@aws-sdk/property-provider";
import { parse } from "url";
import { httpRequest } from "./remoteProvider/httpRequest";
import { fromImdsCredentials, isImdsCredentials } from "./remoteProvider/ImdsCredentials";
import { providerConfigFromInit } from "./remoteProvider/RemoteProviderInit";
import { retry } from "./remoteProvider/retry";
export var ENV_CMDS_FULL_URI = "AWS_CONTAINER_CREDENTIALS_FULL_URI";
export var ENV_CMDS_RELATIVE_URI = "AWS_CONTAINER_CREDENTIALS_RELATIVE_URI";
export var ENV_CMDS_AUTH_TOKEN = "AWS_CONTAINER_AUTHORIZATION_TOKEN";
export var fromContainerMetadata = function (init) {
    if (init === void 0) { init = {}; }
    var _a = providerConfigFromInit(init), timeout = _a.timeout, maxRetries = _a.maxRetries;
    return function () {
        return retry(function () { return __awaiter(void 0, void 0, void 0, function () {
            var requestOptions, credsResponse, _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0: return [4, getCmdsUri()];
                    case 1:
                        requestOptions = _c.sent();
                        _b = (_a = JSON).parse;
                        return [4, requestFromEcsImds(timeout, requestOptions)];
                    case 2:
                        credsResponse = _b.apply(_a, [_c.sent()]);
                        if (!isImdsCredentials(credsResponse)) {
                            throw new CredentialsProviderError("Invalid response received from instance metadata service.");
                        }
                        return [2, fromImdsCredentials(credsResponse)];
                }
            });
        }); }, maxRetries);
    };
};
var requestFromEcsImds = function (timeout, options) { return __awaiter(void 0, void 0, void 0, function () {
    var buffer;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                if (process.env[ENV_CMDS_AUTH_TOKEN]) {
                    options.headers = __assign(__assign({}, options.headers), { Authorization: process.env[ENV_CMDS_AUTH_TOKEN] });
                }
                return [4, httpRequest(__assign(__assign({}, options), { timeout: timeout }))];
            case 1:
                buffer = _a.sent();
                return [2, buffer.toString()];
        }
    });
}); };
var CMDS_IP = "169.254.170.2";
var GREENGRASS_HOSTS = {
    localhost: true,
    "127.0.0.1": true,
};
var GREENGRASS_PROTOCOLS = {
    "http:": true,
    "https:": true,
};
var getCmdsUri = function () { return __awaiter(void 0, void 0, void 0, function () {
    var parsed;
    return __generator(this, function (_a) {
        if (process.env[ENV_CMDS_RELATIVE_URI]) {
            return [2, {
                    hostname: CMDS_IP,
                    path: process.env[ENV_CMDS_RELATIVE_URI],
                }];
        }
        if (process.env[ENV_CMDS_FULL_URI]) {
            parsed = parse(process.env[ENV_CMDS_FULL_URI]);
            if (!parsed.hostname || !(parsed.hostname in GREENGRASS_HOSTS)) {
                throw new CredentialsProviderError("".concat(parsed.hostname, " is not a valid container metadata service hostname"), false);
            }
            if (!parsed.protocol || !(parsed.protocol in GREENGRASS_PROTOCOLS)) {
                throw new CredentialsProviderError("".concat(parsed.protocol, " is not a valid container metadata service protocol"), false);
            }
            return [2, __assign(__assign({}, parsed), { port: parsed.port ? parseInt(parsed.port, 10) : undefined })];
        }
        throw new CredentialsProviderError("The container metadata credential provider cannot be used unless" +
            " the ".concat(ENV_CMDS_RELATIVE_URI, " or ").concat(ENV_CMDS_FULL_URI, " environment") +
            " variable is set", false);
    });
}); };
