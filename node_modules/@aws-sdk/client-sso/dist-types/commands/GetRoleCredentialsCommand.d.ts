import { Command as $Command } from "@aws-sdk/smithy-client";
import { Handler, HttpHandlerOptions as __HttpHandlerOptions, MetadataBearer as __MetadataBearer, MiddlewareStack } from "@aws-sdk/types";
import { GetRoleCredentialsRequest, GetRoleCredentialsResponse } from "../models/models_0";
import { ServiceInputTypes, ServiceOutputTypes, SSOClientResolvedConfig } from "../SSOClient";
export interface GetRoleCredentialsCommandInput extends GetRoleCredentialsRequest {
}
export interface GetRoleCredentialsCommandOutput extends GetRoleCredentialsResponse, __MetadataBearer {
}
/**
 * <p>Returns the STS short-term credentials for a given role name that is assigned to the
 *       user.</p>
 * @example
 * Use a bare-bones client and the command you need to make an API call.
 * ```javascript
 * import { SSOClient, GetRoleCredentialsCommand } from "@aws-sdk/client-sso"; // ES Modules import
 * // const { SSOClient, GetRoleCredentialsCommand } = require("@aws-sdk/client-sso"); // CommonJS import
 * const client = new SSOClient(config);
 * const command = new GetRoleCredentialsCommand(input);
 * const response = await client.send(command);
 * ```
 *
 * @see {@link GetRoleCredentialsCommandInput} for command's `input` shape.
 * @see {@link GetRoleCredentialsCommandOutput} for command's `response` shape.
 * @see {@link SSOClientResolvedConfig | config} for SSOClient's `config` shape.
 *
 */
export declare class GetRoleCredentialsCommand extends $Command<GetRoleCredentialsCommandInput, GetRoleCredentialsCommandOutput, SSOClientResolvedConfig> {
    readonly input: GetRoleCredentialsCommandInput;
    constructor(input: GetRoleCredentialsCommandInput);
    /**
     * @internal
     */
    resolveMiddleware(clientStack: MiddlewareStack<ServiceInputTypes, ServiceOutputTypes>, configuration: SSOClientResolvedConfig, options?: __HttpHandlerOptions): Handler<GetRoleCredentialsCommandInput, GetRoleCredentialsCommandOutput>;
    private serialize;
    private deserialize;
}
