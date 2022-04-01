import { __assign, __awaiter, __generator } from "tslib";
import { CredentialsProviderError } from "@aws-sdk/property-provider";
export var ENV_KEY = "AWS_ACCESS_KEY_ID";
export var ENV_SECRET = "AWS_SECRET_ACCESS_KEY";
export var ENV_SESSION = "AWS_SESSION_TOKEN";
export var ENV_EXPIRATION = "AWS_CREDENTIAL_EXPIRATION";
export var fromEnv = function () { return function () { return __awaiter(void 0, void 0, void 0, function () {
    var accessKeyId, secretAccessKey, sessionToken, expiry;
    return __generator(this, function (_a) {
        accessKeyId = process.env[ENV_KEY];
        secretAccessKey = process.env[ENV_SECRET];
        sessionToken = process.env[ENV_SESSION];
        expiry = process.env[ENV_EXPIRATION];
        if (accessKeyId && secretAccessKey) {
            return [2, __assign(__assign({ accessKeyId: accessKeyId, secretAccessKey: secretAccessKey }, (sessionToken && { sessionToken: sessionToken })), (expiry && { expiration: new Date(expiry) }))];
        }
        throw new CredentialsProviderError("Unable to find environment variable credentials.");
    });
}); }; };
