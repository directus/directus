"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.staticStabilityProvider = void 0;
const getExtendedInstanceMetadataCredentials_1 = require("./getExtendedInstanceMetadataCredentials");
const staticStabilityProvider = (provider, options = {}) => {
    const logger = (options === null || options === void 0 ? void 0 : options.logger) || console;
    let pastCredentials;
    return async () => {
        let credentials;
        try {
            credentials = await provider();
            if (credentials.expiration && credentials.expiration.getTime() < Date.now()) {
                credentials = (0, getExtendedInstanceMetadataCredentials_1.getExtendedInstanceMetadataCredentials)(credentials, logger);
            }
        }
        catch (e) {
            if (pastCredentials) {
                logger.warn("Credential renew failed: ", e);
                credentials = (0, getExtendedInstanceMetadataCredentials_1.getExtendedInstanceMetadataCredentials)(pastCredentials, logger);
            }
            else {
                throw e;
            }
        }
        pastCredentials = credentials;
        return credentials;
    };
};
exports.staticStabilityProvider = staticStabilityProvider;
