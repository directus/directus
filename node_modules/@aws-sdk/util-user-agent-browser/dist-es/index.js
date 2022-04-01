import { __awaiter, __generator } from "tslib";
import bowser from "bowser";
export var defaultUserAgent = function (_a) {
    var serviceId = _a.serviceId, clientVersion = _a.clientVersion;
    return function () { return __awaiter(void 0, void 0, void 0, function () {
        var parsedUA, sections;
        var _a, _b, _c, _d, _e, _f, _g;
        return __generator(this, function (_h) {
            parsedUA = typeof window !== "undefined" && ((_a = window === null || window === void 0 ? void 0 : window.navigator) === null || _a === void 0 ? void 0 : _a.userAgent)
                ? bowser.parse(window.navigator.userAgent)
                : undefined;
            sections = [
                ["aws-sdk-js", clientVersion],
                ["os/".concat(((_b = parsedUA === null || parsedUA === void 0 ? void 0 : parsedUA.os) === null || _b === void 0 ? void 0 : _b.name) || "other"), (_c = parsedUA === null || parsedUA === void 0 ? void 0 : parsedUA.os) === null || _c === void 0 ? void 0 : _c.version],
                ["lang/js"],
                ["md/browser", "".concat((_e = (_d = parsedUA === null || parsedUA === void 0 ? void 0 : parsedUA.browser) === null || _d === void 0 ? void 0 : _d.name) !== null && _e !== void 0 ? _e : "unknown", "_").concat((_g = (_f = parsedUA === null || parsedUA === void 0 ? void 0 : parsedUA.browser) === null || _f === void 0 ? void 0 : _f.version) !== null && _g !== void 0 ? _g : "unknown")],
            ];
            if (serviceId) {
                sections.push(["api/".concat(serviceId), clientVersion]);
            }
            return [2, sections];
        });
    }); };
};
