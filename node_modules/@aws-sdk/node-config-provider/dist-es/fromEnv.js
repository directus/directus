import { __awaiter, __generator } from "tslib";
import { CredentialsProviderError } from "@aws-sdk/property-provider";
export var fromEnv = function (envVarSelector) {
    return function () { return __awaiter(void 0, void 0, void 0, function () {
        var config;
        return __generator(this, function (_a) {
            try {
                config = envVarSelector(process.env);
                if (config === undefined) {
                    throw new Error();
                }
                return [2, config];
            }
            catch (e) {
                throw new CredentialsProviderError(e.message || "Cannot load config from environment variables with getter: ".concat(envVarSelector));
            }
            return [2];
        });
    }); };
};
