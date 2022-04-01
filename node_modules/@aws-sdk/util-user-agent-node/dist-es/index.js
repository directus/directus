import { __awaiter, __generator, __read, __spreadArray } from "tslib";
import { loadConfig } from "@aws-sdk/node-config-provider";
import { platform, release } from "os";
import { env, versions } from "process";
import { isCrtAvailable } from "./is-crt-available";
export var UA_APP_ID_ENV_NAME = "AWS_SDK_UA_APP_ID";
export var UA_APP_ID_INI_NAME = "sdk-ua-app-id";
export var defaultUserAgent = function (_a) {
    var serviceId = _a.serviceId, clientVersion = _a.clientVersion;
    var sections = [
        ["aws-sdk-js", clientVersion],
        ["os/".concat(platform()), release()],
        ["lang/js"],
        ["md/nodejs", "".concat(versions.node)],
    ];
    var crtAvailable = isCrtAvailable();
    if (crtAvailable) {
        sections.push(crtAvailable);
    }
    if (serviceId) {
        sections.push(["api/".concat(serviceId), clientVersion]);
    }
    if (env.AWS_EXECUTION_ENV) {
        sections.push(["exec-env/".concat(env.AWS_EXECUTION_ENV)]);
    }
    var appIdPromise = loadConfig({
        environmentVariableSelector: function (env) { return env[UA_APP_ID_ENV_NAME]; },
        configFileSelector: function (profile) { return profile[UA_APP_ID_INI_NAME]; },
        default: undefined,
    })();
    var resolvedUserAgent = undefined;
    return function () { return __awaiter(void 0, void 0, void 0, function () {
        var appId;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!!resolvedUserAgent) return [3, 2];
                    return [4, appIdPromise];
                case 1:
                    appId = _a.sent();
                    resolvedUserAgent = appId ? __spreadArray(__spreadArray([], __read(sections), false), [["app/".concat(appId)]], false) : __spreadArray([], __read(sections), false);
                    _a.label = 2;
                case 2: return [2, resolvedUserAgent];
            }
        });
    }); };
};
