import { __awaiter, __generator } from "tslib";
import { getExtendedInstanceMetadataCredentials } from "./getExtendedInstanceMetadataCredentials";
export var staticStabilityProvider = function (provider, options) {
    if (options === void 0) { options = {}; }
    var logger = (options === null || options === void 0 ? void 0 : options.logger) || console;
    var pastCredentials;
    return function () { return __awaiter(void 0, void 0, void 0, function () {
        var credentials, e_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4, provider()];
                case 1:
                    credentials = _a.sent();
                    if (credentials.expiration && credentials.expiration.getTime() < Date.now()) {
                        credentials = getExtendedInstanceMetadataCredentials(credentials, logger);
                    }
                    return [3, 3];
                case 2:
                    e_1 = _a.sent();
                    if (pastCredentials) {
                        logger.warn("Credential renew failed: ", e_1);
                        credentials = getExtendedInstanceMetadataCredentials(pastCredentials, logger);
                    }
                    else {
                        throw e_1;
                    }
                    return [3, 3];
                case 3:
                    pastCredentials = credentials;
                    return [2, credentials];
            }
        });
    }); };
};
