import { __awaiter, __generator } from "tslib";
import { GetRoleCredentialsCommand, SSOClient } from "@aws-sdk/client-sso";
import { CredentialsProviderError } from "@aws-sdk/property-provider";
import { getSSOTokenFromFile } from "@aws-sdk/shared-ini-file-loader";
var EXPIRE_WINDOW_MS = 15 * 60 * 1000;
var SHOULD_FAIL_CREDENTIAL_CHAIN = false;
export var resolveSSOCredentials = function (_a) {
    var ssoStartUrl = _a.ssoStartUrl, ssoAccountId = _a.ssoAccountId, ssoRegion = _a.ssoRegion, ssoRoleName = _a.ssoRoleName, ssoClient = _a.ssoClient;
    return __awaiter(void 0, void 0, void 0, function () {
        var token, refreshMessage, e_1, accessToken, sso, ssoResp, e_2, _b, _c, accessKeyId, secretAccessKey, sessionToken, expiration;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    refreshMessage = "To refresh this SSO session run aws sso login with the corresponding profile.";
                    _d.label = 1;
                case 1:
                    _d.trys.push([1, 3, , 4]);
                    return [4, getSSOTokenFromFile(ssoStartUrl)];
                case 2:
                    token = _d.sent();
                    return [3, 4];
                case 3:
                    e_1 = _d.sent();
                    throw new CredentialsProviderError("The SSO session associated with this profile is invalid. ".concat(refreshMessage), SHOULD_FAIL_CREDENTIAL_CHAIN);
                case 4:
                    if (new Date(token.expiresAt).getTime() - Date.now() <= EXPIRE_WINDOW_MS) {
                        throw new CredentialsProviderError("The SSO session associated with this profile has expired. ".concat(refreshMessage), SHOULD_FAIL_CREDENTIAL_CHAIN);
                    }
                    accessToken = token.accessToken;
                    sso = ssoClient || new SSOClient({ region: ssoRegion });
                    _d.label = 5;
                case 5:
                    _d.trys.push([5, 7, , 8]);
                    return [4, sso.send(new GetRoleCredentialsCommand({
                            accountId: ssoAccountId,
                            roleName: ssoRoleName,
                            accessToken: accessToken,
                        }))];
                case 6:
                    ssoResp = _d.sent();
                    return [3, 8];
                case 7:
                    e_2 = _d.sent();
                    throw CredentialsProviderError.from(e_2, SHOULD_FAIL_CREDENTIAL_CHAIN);
                case 8:
                    _b = ssoResp.roleCredentials, _c = _b === void 0 ? {} : _b, accessKeyId = _c.accessKeyId, secretAccessKey = _c.secretAccessKey, sessionToken = _c.sessionToken, expiration = _c.expiration;
                    if (!accessKeyId || !secretAccessKey || !sessionToken || !expiration) {
                        throw new CredentialsProviderError("SSO returns an invalid temporary credential.", SHOULD_FAIL_CREDENTIAL_CHAIN);
                    }
                    return [2, { accessKeyId: accessKeyId, secretAccessKey: secretAccessKey, sessionToken: sessionToken, expiration: new Date(expiration) }];
            }
        });
    });
};
