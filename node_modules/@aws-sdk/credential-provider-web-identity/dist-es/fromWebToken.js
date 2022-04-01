import { CredentialsProviderError } from "@aws-sdk/property-provider";
export var fromWebToken = function (init) {
    return function () {
        var roleArn = init.roleArn, roleSessionName = init.roleSessionName, webIdentityToken = init.webIdentityToken, providerId = init.providerId, policyArns = init.policyArns, policy = init.policy, durationSeconds = init.durationSeconds, roleAssumerWithWebIdentity = init.roleAssumerWithWebIdentity;
        if (!roleAssumerWithWebIdentity) {
            throw new CredentialsProviderError("Role Arn '".concat(roleArn, "' needs to be assumed with web identity,") +
                " but no role assumption callback was provided.", false);
        }
        return roleAssumerWithWebIdentity({
            RoleArn: roleArn,
            RoleSessionName: roleSessionName !== null && roleSessionName !== void 0 ? roleSessionName : "aws-sdk-js-session-".concat(Date.now()),
            WebIdentityToken: webIdentityToken,
            ProviderId: providerId,
            PolicyArns: policyArns,
            Policy: policy,
            DurationSeconds: durationSeconds,
        });
    };
};
