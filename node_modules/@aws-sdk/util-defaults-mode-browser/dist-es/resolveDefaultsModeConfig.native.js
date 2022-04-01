import { __awaiter, __generator } from "tslib";
import { memoize } from "@aws-sdk/property-provider";
import { DEFAULTS_MODE_OPTIONS } from "./constants";
export var resolveDefaultsModeConfig = function (_a) {
    var _b = _a === void 0 ? {} : _a, defaultsMode = _b.defaultsMode;
    return memoize(function () { return __awaiter(void 0, void 0, void 0, function () {
        var mode, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    if (!(typeof defaultsMode === "function")) return [3, 2];
                    return [4, defaultsMode()];
                case 1:
                    _a = _b.sent();
                    return [3, 3];
                case 2:
                    _a = defaultsMode;
                    _b.label = 3;
                case 3:
                    mode = _a;
                    switch (mode === null || mode === void 0 ? void 0 : mode.toLowerCase()) {
                        case "auto":
                            return [2, Promise.resolve("mobile")];
                        case "mobile":
                        case "in-region":
                        case "cross-region":
                        case "standard":
                        case "legacy":
                            return [2, Promise.resolve(mode === null || mode === void 0 ? void 0 : mode.toLocaleLowerCase())];
                        case undefined:
                            return [2, Promise.resolve("legacy")];
                        default:
                            throw new Error("Invalid parameter for \"defaultsMode\", expect ".concat(DEFAULTS_MODE_OPTIONS.join(", "), ", got ").concat(mode));
                    }
                    return [2];
            }
        });
    }); });
};
