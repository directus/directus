import { __awaiter, __generator } from "tslib";
import { CredentialsProviderError } from "@aws-sdk/property-provider";
import { exec } from "child_process";
import { promisify } from "util";
import { getValidatedProcessCredentials } from "./getValidatedProcessCredentials";
export var resolveProcessCredentials = function (profileName, profiles) { return __awaiter(void 0, void 0, void 0, function () {
    var profile, credentialProcess, execPromise, stdout, data, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                profile = profiles[profileName];
                if (!profiles[profileName]) return [3, 7];
                credentialProcess = profile["credential_process"];
                if (!(credentialProcess !== undefined)) return [3, 5];
                execPromise = promisify(exec);
                _a.label = 1;
            case 1:
                _a.trys.push([1, 3, , 4]);
                return [4, execPromise(credentialProcess)];
            case 2:
                stdout = (_a.sent()).stdout;
                data = void 0;
                try {
                    data = JSON.parse(stdout.trim());
                }
                catch (_b) {
                    throw Error("Profile ".concat(profileName, " credential_process returned invalid JSON."));
                }
                return [2, getValidatedProcessCredentials(profileName, data)];
            case 3:
                error_1 = _a.sent();
                throw new CredentialsProviderError(error_1.message);
            case 4: return [3, 6];
            case 5: throw new CredentialsProviderError("Profile ".concat(profileName, " did not contain credential_process."));
            case 6: return [3, 8];
            case 7: throw new CredentialsProviderError("Profile ".concat(profileName, " could not be found in shared credentials file."));
            case 8: return [2];
        }
    });
}); };
