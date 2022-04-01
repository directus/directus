"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fromInstanceMetadata = void 0;
const property_provider_1 = require("@aws-sdk/property-provider");
const httpRequest_1 = require("./remoteProvider/httpRequest");
const ImdsCredentials_1 = require("./remoteProvider/ImdsCredentials");
const RemoteProviderInit_1 = require("./remoteProvider/RemoteProviderInit");
const retry_1 = require("./remoteProvider/retry");
const getInstanceMetadataEndpoint_1 = require("./utils/getInstanceMetadataEndpoint");
const staticStabilityProvider_1 = require("./utils/staticStabilityProvider");
const IMDS_PATH = "/latest/meta-data/iam/security-credentials/";
const IMDS_TOKEN_PATH = "/latest/api/token";
const fromInstanceMetadata = (init = {}) => (0, staticStabilityProvider_1.staticStabilityProvider)(getInstanceImdsProvider(init), { logger: init.logger });
exports.fromInstanceMetadata = fromInstanceMetadata;
const getInstanceImdsProvider = (init) => {
    let disableFetchToken = false;
    const { timeout, maxRetries } = (0, RemoteProviderInit_1.providerConfigFromInit)(init);
    const getCredentials = async (maxRetries, options) => {
        const profile = (await (0, retry_1.retry)(async () => {
            let profile;
            try {
                profile = await getProfile(options);
            }
            catch (err) {
                if (err.statusCode === 401) {
                    disableFetchToken = false;
                }
                throw err;
            }
            return profile;
        }, maxRetries)).trim();
        return (0, retry_1.retry)(async () => {
            let creds;
            try {
                creds = await getCredentialsFromProfile(profile, options);
            }
            catch (err) {
                if (err.statusCode === 401) {
                    disableFetchToken = false;
                }
                throw err;
            }
            return creds;
        }, maxRetries);
    };
    return async () => {
        const endpoint = await (0, getInstanceMetadataEndpoint_1.getInstanceMetadataEndpoint)();
        if (disableFetchToken) {
            return getCredentials(maxRetries, { ...endpoint, timeout });
        }
        else {
            let token;
            try {
                token = (await getMetadataToken({ ...endpoint, timeout })).toString();
            }
            catch (error) {
                if ((error === null || error === void 0 ? void 0 : error.statusCode) === 400) {
                    throw Object.assign(error, {
                        message: "EC2 Metadata token request returned error",
                    });
                }
                else if (error.message === "TimeoutError" || [403, 404, 405].includes(error.statusCode)) {
                    disableFetchToken = true;
                }
                return getCredentials(maxRetries, { ...endpoint, timeout });
            }
            return getCredentials(maxRetries, {
                ...endpoint,
                headers: {
                    "x-aws-ec2-metadata-token": token,
                },
                timeout,
            });
        }
    };
};
const getMetadataToken = async (options) => (0, httpRequest_1.httpRequest)({
    ...options,
    path: IMDS_TOKEN_PATH,
    method: "PUT",
    headers: {
        "x-aws-ec2-metadata-token-ttl-seconds": "21600",
    },
});
const getProfile = async (options) => (await (0, httpRequest_1.httpRequest)({ ...options, path: IMDS_PATH })).toString();
const getCredentialsFromProfile = async (profile, options) => {
    const credsResponse = JSON.parse((await (0, httpRequest_1.httpRequest)({
        ...options,
        path: IMDS_PATH + profile,
    })).toString());
    if (!(0, ImdsCredentials_1.isImdsCredentials)(credsResponse)) {
        throw new property_provider_1.CredentialsProviderError("Invalid response received from instance metadata service.");
    }
    return (0, ImdsCredentials_1.fromImdsCredentials)(credsResponse);
};
