import { __assign, __awaiter, __generator } from "tslib";
import { AssumeRoleCommand } from "./commands/AssumeRoleCommand";
import { AssumeRoleWithWebIdentityCommand, } from "./commands/AssumeRoleWithWebIdentityCommand";
var ASSUME_ROLE_DEFAULT_REGION = "us-east-1";
var decorateDefaultRegion = function (region) {
    if (typeof region !== "function") {
        return region === undefined ? ASSUME_ROLE_DEFAULT_REGION : region;
    }
    return function () { return __awaiter(void 0, void 0, void 0, function () {
        var e_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4, region()];
                case 1: return [2, _a.sent()];
                case 2:
                    e_1 = _a.sent();
                    return [2, ASSUME_ROLE_DEFAULT_REGION];
                case 3: return [2];
            }
        });
    }); };
};
export var getDefaultRoleAssumer = function (stsOptions, stsClientCtor) {
    var stsClient;
    var closureSourceCreds;
    return function (sourceCreds, params) { return __awaiter(void 0, void 0, void 0, function () {
        var logger, region, requestHandler, Credentials;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    closureSourceCreds = sourceCreds;
                    if (!stsClient) {
                        logger = stsOptions.logger, region = stsOptions.region, requestHandler = stsOptions.requestHandler;
                        stsClient = new stsClientCtor(__assign({ logger: logger, credentialDefaultProvider: function () { return function () { return __awaiter(void 0, void 0, void 0, function () { return __generator(this, function (_a) {
                                return [2, closureSourceCreds];
                            }); }); }; }, region: decorateDefaultRegion(region || stsOptions.region) }, (requestHandler ? { requestHandler: requestHandler } : {})));
                    }
                    return [4, stsClient.send(new AssumeRoleCommand(params))];
                case 1:
                    Credentials = (_a.sent()).Credentials;
                    if (!Credentials || !Credentials.AccessKeyId || !Credentials.SecretAccessKey) {
                        throw new Error("Invalid response from STS.assumeRole call with role ".concat(params.RoleArn));
                    }
                    return [2, {
                            accessKeyId: Credentials.AccessKeyId,
                            secretAccessKey: Credentials.SecretAccessKey,
                            sessionToken: Credentials.SessionToken,
                            expiration: Credentials.Expiration,
                        }];
            }
        });
    }); };
};
export var getDefaultRoleAssumerWithWebIdentity = function (stsOptions, stsClientCtor) {
    var stsClient;
    return function (params) { return __awaiter(void 0, void 0, void 0, function () {
        var logger, region, requestHandler, Credentials;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!stsClient) {
                        logger = stsOptions.logger, region = stsOptions.region, requestHandler = stsOptions.requestHandler;
                        stsClient = new stsClientCtor(__assign({ logger: logger, region: decorateDefaultRegion(region || stsOptions.region) }, (requestHandler ? { requestHandler: requestHandler } : {})));
                    }
                    return [4, stsClient.send(new AssumeRoleWithWebIdentityCommand(params))];
                case 1:
                    Credentials = (_a.sent()).Credentials;
                    if (!Credentials || !Credentials.AccessKeyId || !Credentials.SecretAccessKey) {
                        throw new Error("Invalid response from STS.assumeRoleWithWebIdentity call with role ".concat(params.RoleArn));
                    }
                    return [2, {
                            accessKeyId: Credentials.AccessKeyId,
                            secretAccessKey: Credentials.SecretAccessKey,
                            sessionToken: Credentials.SessionToken,
                            expiration: Credentials.Expiration,
                        }];
            }
        });
    }); };
};
export var decorateDefaultCredentialProvider = function (provider) {
    return function (input) {
        return provider(__assign({ roleAssumer: getDefaultRoleAssumer(input, input.stsClientCtor), roleAssumerWithWebIdentity: getDefaultRoleAssumerWithWebIdentity(input, input.stsClientCtor) }, input));
    };
};
