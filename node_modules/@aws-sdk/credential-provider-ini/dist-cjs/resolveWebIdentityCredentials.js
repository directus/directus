"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveWebIdentityCredentials = exports.isWebIdentityProfile = void 0;
const credential_provider_web_identity_1 = require("@aws-sdk/credential-provider-web-identity");
const isWebIdentityProfile = (arg) => Boolean(arg) &&
    typeof arg === "object" &&
    typeof arg.web_identity_token_file === "string" &&
    typeof arg.role_arn === "string" &&
    ["undefined", "string"].indexOf(typeof arg.role_session_name) > -1;
exports.isWebIdentityProfile = isWebIdentityProfile;
const resolveWebIdentityCredentials = async (profile, options) => (0, credential_provider_web_identity_1.fromTokenFile)({
    webIdentityTokenFile: profile.web_identity_token_file,
    roleArn: profile.role_arn,
    roleSessionName: profile.role_session_name,
    roleAssumerWithWebIdentity: options.roleAssumerWithWebIdentity,
})();
exports.resolveWebIdentityCredentials = resolveWebIdentityCredentials;
