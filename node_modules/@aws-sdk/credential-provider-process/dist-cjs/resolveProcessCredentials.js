"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveProcessCredentials = void 0;
const property_provider_1 = require("@aws-sdk/property-provider");
const child_process_1 = require("child_process");
const util_1 = require("util");
const getValidatedProcessCredentials_1 = require("./getValidatedProcessCredentials");
const resolveProcessCredentials = async (profileName, profiles) => {
    const profile = profiles[profileName];
    if (profiles[profileName]) {
        const credentialProcess = profile["credential_process"];
        if (credentialProcess !== undefined) {
            const execPromise = (0, util_1.promisify)(child_process_1.exec);
            try {
                const { stdout } = await execPromise(credentialProcess);
                let data;
                try {
                    data = JSON.parse(stdout.trim());
                }
                catch (_a) {
                    throw Error(`Profile ${profileName} credential_process returned invalid JSON.`);
                }
                return (0, getValidatedProcessCredentials_1.getValidatedProcessCredentials)(profileName, data);
            }
            catch (error) {
                throw new property_provider_1.CredentialsProviderError(error.message);
            }
        }
        else {
            throw new property_provider_1.CredentialsProviderError(`Profile ${profileName} did not contain credential_process.`);
        }
    }
    else {
        throw new property_provider_1.CredentialsProviderError(`Profile ${profileName} could not be found in shared credentials file.`);
    }
};
exports.resolveProcessCredentials = resolveProcessCredentials;
