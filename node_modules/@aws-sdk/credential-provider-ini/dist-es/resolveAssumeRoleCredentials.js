import { __assign, __awaiter, __generator } from "tslib";
import { CredentialsProviderError } from "@aws-sdk/property-provider";
import { getProfileName } from "@aws-sdk/shared-ini-file-loader";
import { resolveCredentialSource } from "./resolveCredentialSource";
import { resolveProfileData } from "./resolveProfileData";
export var isAssumeRoleProfile = function (arg) {
    return Boolean(arg) &&
        typeof arg === "object" &&
        typeof arg.role_arn === "string" &&
        ["undefined", "string"].indexOf(typeof arg.role_session_name) > -1 &&
        ["undefined", "string"].indexOf(typeof arg.external_id) > -1 &&
        ["undefined", "string"].indexOf(typeof arg.mfa_serial) > -1 &&
        (isAssumeRoleWithSourceProfile(arg) || isAssumeRoleWithProviderProfile(arg));
};
var isAssumeRoleWithSourceProfile = function (arg) {
    return typeof arg.source_profile === "string" && typeof arg.credential_source === "undefined";
};
var isAssumeRoleWithProviderProfile = function (arg) {
    return typeof arg.credential_source === "string" && typeof arg.source_profile === "undefined";
};
export var resolveAssumeRoleCredentials = function (profileName, profiles, options, visitedProfiles) {
    if (visitedProfiles === void 0) { visitedProfiles = {}; }
    return __awaiter(void 0, void 0, void 0, function () {
        var data, source_profile, sourceCredsProvider, params, mfa_serial, _a, sourceCreds;
        var _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    data = profiles[profileName];
                    if (!options.roleAssumer) {
                        throw new CredentialsProviderError("Profile ".concat(profileName, " requires a role to be assumed, but no role assumption callback was provided."), false);
                    }
                    source_profile = data.source_profile;
                    if (source_profile && source_profile in visitedProfiles) {
                        throw new CredentialsProviderError("Detected a cycle attempting to resolve credentials for profile" +
                            " ".concat(getProfileName(options), ". Profiles visited: ") +
                            Object.keys(visitedProfiles).join(", "), false);
                    }
                    sourceCredsProvider = source_profile
                        ? resolveProfileData(source_profile, profiles, options, __assign(__assign({}, visitedProfiles), (_b = {}, _b[source_profile] = true, _b)))
                        : resolveCredentialSource(data.credential_source, profileName)();
                    params = {
                        RoleArn: data.role_arn,
                        RoleSessionName: data.role_session_name || "aws-sdk-js-".concat(Date.now()),
                        ExternalId: data.external_id,
                    };
                    mfa_serial = data.mfa_serial;
                    if (!mfa_serial) return [3, 2];
                    if (!options.mfaCodeProvider) {
                        throw new CredentialsProviderError("Profile ".concat(profileName, " requires multi-factor authentication, but no MFA code callback was provided."), false);
                    }
                    params.SerialNumber = mfa_serial;
                    _a = params;
                    return [4, options.mfaCodeProvider(mfa_serial)];
                case 1:
                    _a.TokenCode = _c.sent();
                    _c.label = 2;
                case 2: return [4, sourceCredsProvider];
                case 3:
                    sourceCreds = _c.sent();
                    return [2, options.roleAssumer(sourceCreds, params)];
            }
        });
    });
};
