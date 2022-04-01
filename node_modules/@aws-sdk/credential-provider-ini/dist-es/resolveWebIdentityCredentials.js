import { __awaiter, __generator } from "tslib";
import { fromTokenFile } from "@aws-sdk/credential-provider-web-identity";
export var isWebIdentityProfile = function (arg) {
    return Boolean(arg) &&
        typeof arg === "object" &&
        typeof arg.web_identity_token_file === "string" &&
        typeof arg.role_arn === "string" &&
        ["undefined", "string"].indexOf(typeof arg.role_session_name) > -1;
};
export var resolveWebIdentityCredentials = function (profile, options) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        return [2, fromTokenFile({
                webIdentityTokenFile: profile.web_identity_token_file,
                roleArn: profile.role_arn,
                roleSessionName: profile.role_session_name,
                roleAssumerWithWebIdentity: options.roleAssumerWithWebIdentity,
            })()];
    });
}); };
