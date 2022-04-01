import { __awaiter, __generator } from "tslib";
export var defaultUserAgent = function (_a) {
    var serviceId = _a.serviceId, clientVersion = _a.clientVersion;
    return function () { return __awaiter(void 0, void 0, void 0, function () {
        var sections;
        return __generator(this, function (_a) {
            sections = [
                ["aws-sdk-js", clientVersion],
                ["os/other"],
                ["lang/js"],
                ["md/rn"],
            ];
            if (serviceId) {
                sections.push(["api/".concat(serviceId), clientVersion]);
            }
            return [2, sections];
        });
    }); };
};
