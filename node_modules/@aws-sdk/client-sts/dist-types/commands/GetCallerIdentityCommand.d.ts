import { Command as $Command } from "@aws-sdk/smithy-client";
import { Handler, HttpHandlerOptions as __HttpHandlerOptions, MetadataBearer as __MetadataBearer, MiddlewareStack } from "@aws-sdk/types";
import { GetCallerIdentityRequest, GetCallerIdentityResponse } from "../models/models_0";
import { ServiceInputTypes, ServiceOutputTypes, STSClientResolvedConfig } from "../STSClient";
export interface GetCallerIdentityCommandInput extends GetCallerIdentityRequest {
}
export interface GetCallerIdentityCommandOutput extends GetCallerIdentityResponse, __MetadataBearer {
}
/**
 * <p>Returns details about the IAM user or role whose credentials are used to call the
 *          operation.</p>
 *          <note>
 *             <p>No permissions are required to perform this operation. If an administrator adds a
 *             policy to your IAM user or role that explicitly denies access to the
 *                <code>sts:GetCallerIdentity</code> action, you can still perform this operation.
 *             Permissions are not required because the same information is returned when an IAM user
 *             or role is denied access. To view an example response, see <a href="https://docs.aws.amazon.com/IAM/latest/UserGuide/troubleshoot_general.html#troubleshoot_general_access-denied-delete-mfa">I Am Not Authorized to Perform: iam:DeleteVirtualMFADevice</a> in the
 *                <i>IAM User Guide</i>.</p>
 *          </note>
 * @example
 * Use a bare-bones client and the command you need to make an API call.
 * ```javascript
 * import { STSClient, GetCallerIdentityCommand } from "@aws-sdk/client-sts"; // ES Modules import
 * // const { STSClient, GetCallerIdentityCommand } = require("@aws-sdk/client-sts"); // CommonJS import
 * const client = new STSClient(config);
 * const command = new GetCallerIdentityCommand(input);
 * const response = await client.send(command);
 * ```
 *
 * @see {@link GetCallerIdentityCommandInput} for command's `input` shape.
 * @see {@link GetCallerIdentityCommandOutput} for command's `response` shape.
 * @see {@link STSClientResolvedConfig | config} for STSClient's `config` shape.
 *
 */
export declare class GetCallerIdentityCommand extends $Command<GetCallerIdentityCommandInput, GetCallerIdentityCommandOutput, STSClientResolvedConfig> {
    readonly input: GetCallerIdentityCommandInput;
    constructor(input: GetCallerIdentityCommandInput);
    /**
     * @internal
     */
    resolveMiddleware(clientStack: MiddlewareStack<ServiceInputTypes, ServiceOutputTypes>, configuration: STSClientResolvedConfig, options?: __HttpHandlerOptions): Handler<GetCallerIdentityCommandInput, GetCallerIdentityCommandOutput>;
    private serialize;
    private deserialize;
}
