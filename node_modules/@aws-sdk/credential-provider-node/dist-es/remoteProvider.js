import { __awaiter, __generator } from "tslib";
import { ENV_CMDS_FULL_URI, ENV_CMDS_RELATIVE_URI, fromContainerMetadata, fromInstanceMetadata, } from "@aws-sdk/credential-provider-imds";
import { CredentialsProviderError } from "@aws-sdk/property-provider";
export var ENV_IMDS_DISABLED = "AWS_EC2_METADATA_DISABLED";
export var remoteProvider = function (init) {
    if (process.env[ENV_CMDS_RELATIVE_URI] || process.env[ENV_CMDS_FULL_URI]) {
        return fromContainerMetadata(init);
    }
    if (process.env[ENV_IMDS_DISABLED]) {
        return function () { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                throw new CredentialsProviderError("EC2 Instance Metadata Service access disabled");
            });
        }); };
    }
    return fromInstanceMetadata(init);
};
