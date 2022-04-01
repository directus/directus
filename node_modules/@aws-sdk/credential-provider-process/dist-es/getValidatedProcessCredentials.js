import { __assign } from "tslib";
export var getValidatedProcessCredentials = function (profileName, data) {
    if (data.Version !== 1) {
        throw Error("Profile ".concat(profileName, " credential_process did not return Version 1."));
    }
    if (data.AccessKeyId === undefined || data.SecretAccessKey === undefined) {
        throw Error("Profile ".concat(profileName, " credential_process returned invalid credentials."));
    }
    if (data.Expiration) {
        var currentTime = new Date();
        var expireTime = new Date(data.Expiration);
        if (expireTime < currentTime) {
            throw Error("Profile ".concat(profileName, " credential_process returned expired credentials."));
        }
    }
    return __assign(__assign({ accessKeyId: data.AccessKeyId, secretAccessKey: data.SecretAccessKey }, (data.SessionToken && { sessionToken: data.SessionToken })), (data.Expiration && { expiration: new Date(data.Expiration) }));
};
