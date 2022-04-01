import { fromSSO, validateSsoProfile } from "@aws-sdk/credential-provider-sso";
export { isSsoProfile } from "@aws-sdk/credential-provider-sso";
export var resolveSsoCredentials = function (data) {
    var _a = validateSsoProfile(data), sso_start_url = _a.sso_start_url, sso_account_id = _a.sso_account_id, sso_region = _a.sso_region, sso_role_name = _a.sso_role_name;
    return fromSSO({
        ssoStartUrl: sso_start_url,
        ssoAccountId: sso_account_id,
        ssoRegion: sso_region,
        ssoRoleName: sso_role_name,
    })();
};
