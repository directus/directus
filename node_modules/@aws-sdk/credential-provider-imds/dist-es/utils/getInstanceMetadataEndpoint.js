import { __awaiter, __generator } from "tslib";
import { loadConfig } from "@aws-sdk/node-config-provider";
import { parseUrl } from "@aws-sdk/url-parser";
import { Endpoint as InstanceMetadataEndpoint } from "../config/Endpoint";
import { ENDPOINT_CONFIG_OPTIONS } from "../config/EndpointConfigOptions";
import { EndpointMode } from "../config/EndpointMode";
import { ENDPOINT_MODE_CONFIG_OPTIONS, } from "../config/EndpointModeConfigOptions";
export var getInstanceMetadataEndpoint = function () { return __awaiter(void 0, void 0, void 0, function () { var _a, _b; return __generator(this, function (_c) {
    switch (_c.label) {
        case 0:
            _a = parseUrl;
            return [4, getFromEndpointConfig()];
        case 1:
            _b = (_c.sent());
            if (_b) return [3, 3];
            return [4, getFromEndpointModeConfig()];
        case 2:
            _b = (_c.sent());
            _c.label = 3;
        case 3: return [2, _a.apply(void 0, [_b])];
    }
}); }); };
var getFromEndpointConfig = function () { return __awaiter(void 0, void 0, void 0, function () { return __generator(this, function (_a) {
    return [2, loadConfig(ENDPOINT_CONFIG_OPTIONS)()];
}); }); };
var getFromEndpointModeConfig = function () { return __awaiter(void 0, void 0, void 0, function () {
    var endpointMode;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4, loadConfig(ENDPOINT_MODE_CONFIG_OPTIONS)()];
            case 1:
                endpointMode = _a.sent();
                switch (endpointMode) {
                    case EndpointMode.IPv4:
                        return [2, InstanceMetadataEndpoint.IPv4];
                    case EndpointMode.IPv6:
                        return [2, InstanceMetadataEndpoint.IPv6];
                    default:
                        throw new Error("Unsupported endpoint mode: ".concat(endpointMode, ".") + " Select from ".concat(Object.values(EndpointMode)));
                }
                return [2];
        }
    });
}); };
