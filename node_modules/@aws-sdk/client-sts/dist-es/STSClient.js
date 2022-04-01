import { __extends } from "tslib";
import { resolveEndpointsConfig, resolveRegionConfig, } from "@aws-sdk/config-resolver";
import { getContentLengthPlugin } from "@aws-sdk/middleware-content-length";
import { getHostHeaderPlugin, resolveHostHeaderConfig, } from "@aws-sdk/middleware-host-header";
import { getLoggerPlugin } from "@aws-sdk/middleware-logger";
import { getRetryPlugin, resolveRetryConfig } from "@aws-sdk/middleware-retry";
import { resolveStsAuthConfig } from "@aws-sdk/middleware-sdk-sts";
import { getUserAgentPlugin, resolveUserAgentConfig, } from "@aws-sdk/middleware-user-agent";
import { Client as __Client, } from "@aws-sdk/smithy-client";
import { getRuntimeConfig as __getRuntimeConfig } from "./runtimeConfig";
var STSClient = (function (_super) {
    __extends(STSClient, _super);
    function STSClient(configuration) {
        var _this = this;
        var _config_0 = __getRuntimeConfig(configuration);
        var _config_1 = resolveRegionConfig(_config_0);
        var _config_2 = resolveEndpointsConfig(_config_1);
        var _config_3 = resolveRetryConfig(_config_2);
        var _config_4 = resolveHostHeaderConfig(_config_3);
        var _config_5 = resolveStsAuthConfig(_config_4, { stsClientCtor: STSClient });
        var _config_6 = resolveUserAgentConfig(_config_5);
        _this = _super.call(this, _config_6) || this;
        _this.config = _config_6;
        _this.middlewareStack.use(getRetryPlugin(_this.config));
        _this.middlewareStack.use(getContentLengthPlugin(_this.config));
        _this.middlewareStack.use(getHostHeaderPlugin(_this.config));
        _this.middlewareStack.use(getLoggerPlugin(_this.config));
        _this.middlewareStack.use(getUserAgentPlugin(_this.config));
        return _this;
    }
    STSClient.prototype.destroy = function () {
        _super.prototype.destroy.call(this);
    };
    return STSClient;
}(__Client));
export { STSClient };
