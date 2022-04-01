import { CredentialsProviderError } from "@aws-sdk/property-provider";
export var validateSsoProfile = function (profile) {
    var sso_start_url = profile.sso_start_url, sso_account_id = profile.sso_account_id, sso_region = profile.sso_region, sso_role_name = profile.sso_role_name;
    if (!sso_start_url || !sso_account_id || !sso_region || !sso_role_name) {
        throw new CredentialsProviderError("Profile is configured with invalid SSO credentials. Required parameters \"sso_account_id\", \"sso_region\", " +
            "\"sso_role_name\", \"sso_start_url\". Got ".concat(Object.keys(profile).join(", "), "\nReference: https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-sso.html"), false);
    }
    return profile;
};
