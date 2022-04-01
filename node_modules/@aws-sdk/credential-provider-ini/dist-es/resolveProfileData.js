import { __awaiter, __generator } from "tslib";
import { CredentialsProviderError } from "@aws-sdk/property-provider";
import { isAssumeRoleProfile, resolveAssumeRoleCredentials } from "./resolveAssumeRoleCredentials";
import { isSsoProfile, resolveSsoCredentials } from "./resolveSsoCredentials";
import { isStaticCredsProfile, resolveStaticCredentials } from "./resolveStaticCredentials";
import { isWebIdentityProfile, resolveWebIdentityCredentials } from "./resolveWebIdentityCredentials";
export var resolveProfileData = function (profileName, profiles, options, visitedProfiles) {
    if (visitedProfiles === void 0) { visitedProfiles = {}; }
    return __awaiter(void 0, void 0, void 0, function () {
        var data;
        return __generator(this, function (_a) {
            data = profiles[profileName];
            if (Object.keys(visitedProfiles).length > 0 && isStaticCredsProfile(data)) {
                return [2, resolveStaticCredentials(data)];
            }
            if (isAssumeRoleProfile(data)) {
                return [2, resolveAssumeRoleCredentials(profileName, profiles, options, visitedProfiles)];
            }
            if (isStaticCredsProfile(data)) {
                return [2, resolveStaticCredentials(data)];
            }
            if (isWebIdentityProfile(data)) {
                return [2, resolveWebIdentityCredentials(data, options)];
            }
            if (isSsoProfile(data)) {
                return [2, resolveSsoCredentials(data)];
            }
            throw new CredentialsProviderError("Profile ".concat(profileName, " could not be found or parsed in shared credentials file."));
        });
    });
};
