import { __awaiter, __generator } from "tslib";
import { CredentialsProviderError } from "@aws-sdk/property-provider";
import { getProfileName, parseKnownFiles } from "@aws-sdk/shared-ini-file-loader";
import { isSsoProfile } from "./isSsoProfile";
import { resolveSSOCredentials } from "./resolveSSOCredentials";
import { validateSsoProfile } from "./validateSsoProfile";
export var fromSSO = function (init) {
    if (init === void 0) { init = {}; }
    return function () { return __awaiter(void 0, void 0, void 0, function () {
        var ssoStartUrl, ssoAccountId, ssoRegion, ssoRoleName, ssoClient, profiles, profileName, profile, _a, sso_start_url, sso_account_id, sso_region, sso_role_name;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    ssoStartUrl = init.ssoStartUrl, ssoAccountId = init.ssoAccountId, ssoRegion = init.ssoRegion, ssoRoleName = init.ssoRoleName, ssoClient = init.ssoClient;
                    if (!(!ssoStartUrl && !ssoAccountId && !ssoRegion && !ssoRoleName)) return [3, 2];
                    return [4, parseKnownFiles(init)];
                case 1:
                    profiles = _b.sent();
                    profileName = getProfileName(init);
                    profile = profiles[profileName];
                    if (!isSsoProfile(profile)) {
                        throw new CredentialsProviderError("Profile ".concat(profileName, " is not configured with SSO credentials."));
                    }
                    _a = validateSsoProfile(profile), sso_start_url = _a.sso_start_url, sso_account_id = _a.sso_account_id, sso_region = _a.sso_region, sso_role_name = _a.sso_role_name;
                    return [2, resolveSSOCredentials({
                            ssoStartUrl: sso_start_url,
                            ssoAccountId: sso_account_id,
                            ssoRegion: sso_region,
                            ssoRoleName: sso_role_name,
                            ssoClient: ssoClient,
                        })];
                case 2:
                    if (!ssoStartUrl || !ssoAccountId || !ssoRegion || !ssoRoleName) {
                        throw new CredentialsProviderError('Incomplete configuration. The fromSSO() argument hash must include "ssoStartUrl",' +
                            ' "ssoAccountId", "ssoRegion", "ssoRoleName"');
                    }
                    else {
                        return [2, resolveSSOCredentials({ ssoStartUrl: ssoStartUrl, ssoAccountId: ssoAccountId, ssoRegion: ssoRegion, ssoRoleName: ssoRoleName, ssoClient: ssoClient })];
                    }
                    _b.label = 3;
                case 3: return [2];
            }
        });
    }); };
};
