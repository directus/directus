import { __assign, __awaiter, __generator } from "tslib";
import { loadSharedConfigFiles } from "./loadSharedConfigFiles";
export var parseKnownFiles = function (init) { return __awaiter(void 0, void 0, void 0, function () {
    var parsedFiles;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4, loadSharedConfigFiles(init)];
            case 1:
                parsedFiles = _a.sent();
                return [2, __assign(__assign({}, parsedFiles.configFile), parsedFiles.credentialsFile)];
        }
    });
}); };
