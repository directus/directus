"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveSSOCredentials = void 0;
const client_sso_1 = require("@aws-sdk/client-sso");
const property_provider_1 = require("@aws-sdk/property-provider");
const shared_ini_file_loader_1 = require("@aws-sdk/shared-ini-file-loader");
const EXPIRE_WINDOW_MS = 15 * 60 * 1000;
const SHOULD_FAIL_CREDENTIAL_CHAIN = false;
const resolveSSOCredentials = async ({ ssoStartUrl, ssoAccountId, ssoRegion, ssoRoleName, ssoClient, }) => {
    let token;
    const refreshMessage = `To refresh this SSO session run aws sso login with the corresponding profile.`;
    try {
        token = await (0, shared_ini_file_loader_1.getSSOTokenFromFile)(ssoStartUrl);
    }
    catch (e) {
        throw new property_provider_1.CredentialsProviderError(`The SSO session associated with this profile is invalid. ${refreshMessage}`, SHOULD_FAIL_CREDENTIAL_CHAIN);
    }
    if (new Date(token.expiresAt).getTime() - Date.now() <= EXPIRE_WINDOW_MS) {
        throw new property_provider_1.CredentialsProviderError(`The SSO session associated with this profile has expired. ${refreshMessage}`, SHOULD_FAIL_CREDENTIAL_CHAIN);
    }
    const { accessToken } = token;
    const sso = ssoClient || new client_sso_1.SSOClient({ region: ssoRegion });
    let ssoResp;
    try {
        ssoResp = await sso.send(new client_sso_1.GetRoleCredentialsCommand({
            accountId: ssoAccountId,
            roleName: ssoRoleName,
            accessToken,
        }));
    }
    catch (e) {
        throw property_provider_1.CredentialsProviderError.from(e, SHOULD_FAIL_CREDENTIAL_CHAIN);
    }
    const { roleCredentials: { accessKeyId, secretAccessKey, sessionToken, expiration } = {} } = ssoResp;
    if (!accessKeyId || !secretAccessKey || !sessionToken || !expiration) {
        throw new property_provider_1.CredentialsProviderError("SSO returns an invalid temporary credential.", SHOULD_FAIL_CREDENTIAL_CHAIN);
    }
    return { accessKeyId, secretAccessKey, sessionToken, expiration: new Date(expiration) };
};
exports.resolveSSOCredentials = resolveSSOCredentials;
