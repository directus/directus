import { __awaiter, __generator } from "tslib";
import { promises as fsPromises } from "fs";
import { getSSOTokenFilepath } from "./getSSOTokenFilepath";
var readFile = fsPromises.readFile;
export var getSSOTokenFromFile = function (ssoStartUrl) { return __awaiter(void 0, void 0, void 0, function () {
    var ssoTokenFilepath, ssoTokenText;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                ssoTokenFilepath = getSSOTokenFilepath(ssoStartUrl);
                return [4, readFile(ssoTokenFilepath, "utf8")];
            case 1:
                ssoTokenText = _a.sent();
                return [2, JSON.parse(ssoTokenText)];
        }
    });
}); };
