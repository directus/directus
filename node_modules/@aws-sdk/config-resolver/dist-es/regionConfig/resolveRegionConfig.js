import { __assign, __awaiter, __generator } from "tslib";
import { getRealRegion } from "./getRealRegion";
import { isFipsRegion } from "./isFipsRegion";
export var resolveRegionConfig = function (input) {
    var region = input.region, useFipsEndpoint = input.useFipsEndpoint;
    if (!region) {
        throw new Error("Region is missing");
    }
    return __assign(__assign({}, input), { region: function () { return __awaiter(void 0, void 0, void 0, function () {
            var providedRegion;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (typeof region === "string") {
                            return [2, getRealRegion(region)];
                        }
                        return [4, region()];
                    case 1:
                        providedRegion = _a.sent();
                        return [2, getRealRegion(providedRegion)];
                }
            });
        }); }, useFipsEndpoint: function () { return __awaiter(void 0, void 0, void 0, function () {
            var providedRegion, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!(typeof region === "string")) return [3, 1];
                        _a = region;
                        return [3, 3];
                    case 1: return [4, region()];
                    case 2:
                        _a = _b.sent();
                        _b.label = 3;
                    case 3:
                        providedRegion = _a;
                        if (isFipsRegion(providedRegion)) {
                            return [2, true];
                        }
                        return [2, typeof useFipsEndpoint === "boolean" ? Promise.resolve(useFipsEndpoint) : useFipsEndpoint()];
                }
            });
        }); } });
};
