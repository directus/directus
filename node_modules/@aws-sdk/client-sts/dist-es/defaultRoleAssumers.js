import { __assign } from "tslib";
import { getDefaultRoleAssumer as StsGetDefaultRoleAssumer, getDefaultRoleAssumerWithWebIdentity as StsGetDefaultRoleAssumerWithWebIdentity, } from "./defaultStsRoleAssumers";
import { STSClient } from "./STSClient";
export var getDefaultRoleAssumer = function (stsOptions) {
    if (stsOptions === void 0) { stsOptions = {}; }
    return StsGetDefaultRoleAssumer(stsOptions, STSClient);
};
export var getDefaultRoleAssumerWithWebIdentity = function (stsOptions) {
    if (stsOptions === void 0) { stsOptions = {}; }
    return StsGetDefaultRoleAssumerWithWebIdentity(stsOptions, STSClient);
};
export var decorateDefaultCredentialProvider = function (provider) {
    return function (input) {
        return provider(__assign({ roleAssumer: getDefaultRoleAssumer(input), roleAssumerWithWebIdentity: getDefaultRoleAssumerWithWebIdentity(input) }, input));
    };
};
