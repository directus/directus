import { __awaiter, __generator } from "tslib";
import { getProfileName, parseKnownFiles } from "@aws-sdk/shared-ini-file-loader";
import { resolveProfileData } from "./resolveProfileData";
export var fromIni = function (init) {
    if (init === void 0) { init = {}; }
    return function () { return __awaiter(void 0, void 0, void 0, function () {
        var profiles;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4, parseKnownFiles(init)];
                case 1:
                    profiles = _a.sent();
                    return [2, resolveProfileData(getProfileName(init), profiles, init)];
            }
        });
    }); };
};
