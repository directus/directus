"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveSsoCredentials = exports.isSsoProfile = void 0;
const credential_provider_sso_1 = require("@aws-sdk/credential-provider-sso");
var credential_provider_sso_2 = require("@aws-sdk/credential-provider-sso");
Object.defineProperty(exports, "isSsoProfile", { enumerable: true, get: function () { return credential_provider_sso_2.isSsoProfile; } });
const resolveSsoCredentials = (data) => {
    const { sso_start_url, sso_account_id, sso_region, sso_role_name } = (0, credential_provider_sso_1.validateSsoProfile)(data);
    return (0, credential_provider_sso_1.fromSSO)({
        ssoStartUrl: sso_start_url,
        ssoAccountId: sso_account_id,
        ssoRegion: sso_region,
        ssoRoleName: sso_role_name,
    })();
};
exports.resolveSsoCredentials = resolveSsoCredentials;
