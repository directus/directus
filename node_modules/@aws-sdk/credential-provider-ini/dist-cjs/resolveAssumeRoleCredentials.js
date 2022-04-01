"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveAssumeRoleCredentials = exports.isAssumeRoleProfile = void 0;
const property_provider_1 = require("@aws-sdk/property-provider");
const shared_ini_file_loader_1 = require("@aws-sdk/shared-ini-file-loader");
const resolveCredentialSource_1 = require("./resolveCredentialSource");
const resolveProfileData_1 = require("./resolveProfileData");
const isAssumeRoleProfile = (arg) => Boolean(arg) &&
    typeof arg === "object" &&
    typeof arg.role_arn === "string" &&
    ["undefined", "string"].indexOf(typeof arg.role_session_name) > -1 &&
    ["undefined", "string"].indexOf(typeof arg.external_id) > -1 &&
    ["undefined", "string"].indexOf(typeof arg.mfa_serial) > -1 &&
    (isAssumeRoleWithSourceProfile(arg) || isAssumeRoleWithProviderProfile(arg));
exports.isAssumeRoleProfile = isAssumeRoleProfile;
const isAssumeRoleWithSourceProfile = (arg) => typeof arg.source_profile === "string" && typeof arg.credential_source === "undefined";
const isAssumeRoleWithProviderProfile = (arg) => typeof arg.credential_source === "string" && typeof arg.source_profile === "undefined";
const resolveAssumeRoleCredentials = async (profileName, profiles, options, visitedProfiles = {}) => {
    const data = profiles[profileName];
    if (!options.roleAssumer) {
        throw new property_provider_1.CredentialsProviderError(`Profile ${profileName} requires a role to be assumed, but no role assumption callback was provided.`, false);
    }
    const { source_profile } = data;
    if (source_profile && source_profile in visitedProfiles) {
        throw new property_provider_1.CredentialsProviderError(`Detected a cycle attempting to resolve credentials for profile` +
            ` ${(0, shared_ini_file_loader_1.getProfileName)(options)}. Profiles visited: ` +
            Object.keys(visitedProfiles).join(", "), false);
    }
    const sourceCredsProvider = source_profile
        ? (0, resolveProfileData_1.resolveProfileData)(source_profile, profiles, options, {
            ...visitedProfiles,
            [source_profile]: true,
        })
        : (0, resolveCredentialSource_1.resolveCredentialSource)(data.credential_source, profileName)();
    const params = {
        RoleArn: data.role_arn,
        RoleSessionName: data.role_session_name || `aws-sdk-js-${Date.now()}`,
        ExternalId: data.external_id,
    };
    const { mfa_serial } = data;
    if (mfa_serial) {
        if (!options.mfaCodeProvider) {
            throw new property_provider_1.CredentialsProviderError(`Profile ${profileName} requires multi-factor authentication, but no MFA code callback was provided.`, false);
        }
        params.SerialNumber = mfa_serial;
        params.TokenCode = await options.mfaCodeProvider(mfa_serial);
    }
    const sourceCreds = await sourceCredsProvider;
    return options.roleAssumer(sourceCreds, params);
};
exports.resolveAssumeRoleCredentials = resolveAssumeRoleCredentials;
