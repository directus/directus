import { __awaiter, __generator, __read, __spreadArray } from "tslib";
import { fromEnv } from "@aws-sdk/credential-provider-env";
import { fromIni } from "@aws-sdk/credential-provider-ini";
import { fromProcess } from "@aws-sdk/credential-provider-process";
import { fromSSO } from "@aws-sdk/credential-provider-sso";
import { fromTokenFile } from "@aws-sdk/credential-provider-web-identity";
import { chain, CredentialsProviderError, memoize } from "@aws-sdk/property-provider";
import { ENV_PROFILE } from "@aws-sdk/shared-ini-file-loader";
import { remoteProvider } from "./remoteProvider";
export var defaultProvider = function (init) {
    if (init === void 0) { init = {}; }
    return memoize(chain.apply(void 0, __spreadArray(__spreadArray([], __read((init.profile || process.env[ENV_PROFILE] ? [] : [fromEnv()])), false), [fromSSO(init),
        fromIni(init),
        fromProcess(init),
        fromTokenFile(init),
        remoteProvider(init),
        function () { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                throw new CredentialsProviderError("Could not load credentials from any providers", false);
            });
        }); }], false)), function (credentials) { return credentials.expiration !== undefined && credentials.expiration.getTime() - Date.now() < 300000; }, function (credentials) { return credentials.expiration !== undefined; });
};
