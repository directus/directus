import { __assign, __awaiter, __generator, __rest } from "tslib";
import { CredentialsProviderError } from "@aws-sdk/property-provider";
import { getProfileName, loadSharedConfigFiles } from "@aws-sdk/shared-ini-file-loader";
export var fromSharedConfigFiles = function (configSelector, _a) {
    if (_a === void 0) { _a = {}; }
    var _b = _a.preferredFile, preferredFile = _b === void 0 ? "config" : _b, init = __rest(_a, ["preferredFile"]);
    return function () { return __awaiter(void 0, void 0, void 0, function () {
        var profile, _a, configFile, credentialsFile, profileFromCredentials, profileFromConfig, mergedProfile, configValue;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    profile = getProfileName(init);
                    return [4, loadSharedConfigFiles(init)];
                case 1:
                    _a = _b.sent(), configFile = _a.configFile, credentialsFile = _a.credentialsFile;
                    profileFromCredentials = credentialsFile[profile] || {};
                    profileFromConfig = configFile[profile] || {};
                    mergedProfile = preferredFile === "config"
                        ? __assign(__assign({}, profileFromCredentials), profileFromConfig) : __assign(__assign({}, profileFromConfig), profileFromCredentials);
                    try {
                        configValue = configSelector(mergedProfile);
                        if (configValue === undefined) {
                            throw new Error();
                        }
                        return [2, configValue];
                    }
                    catch (e) {
                        throw new CredentialsProviderError(e.message ||
                            "Cannot load config for profile ".concat(profile, " in SDK configuration files with getter: ").concat(configSelector));
                    }
                    return [2];
            }
        });
    }); };
};
