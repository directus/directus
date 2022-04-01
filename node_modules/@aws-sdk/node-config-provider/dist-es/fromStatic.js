import { __awaiter, __generator } from "tslib";
import { fromStatic as convertToProvider } from "@aws-sdk/property-provider";
var isFunction = function (func) { return typeof func === "function"; };
export var fromStatic = function (defaultValue) {
    return isFunction(defaultValue) ? function () { return __awaiter(void 0, void 0, void 0, function () { return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4, defaultValue()];
            case 1: return [2, _a.sent()];
        }
    }); }); } : convertToProvider(defaultValue);
};
