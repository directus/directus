import { Command as $Command } from "@aws-sdk/smithy-client";
import { Handler, HttpHandlerOptions as __HttpHandlerOptions, MetadataBearer as __MetadataBearer, MiddlewareStack } from "@aws-sdk/types";
import { ListAccountRolesRequest, ListAccountRolesResponse } from "../models/models_0";
import { ServiceInputTypes, ServiceOutputTypes, SSOClientResolvedConfig } from "../SSOClient";
export interface ListAccountRolesCommandInput extends ListAccountRolesRequest {
}
export interface ListAccountRolesCommandOutput extends ListAccountRolesResponse, __MetadataBearer {
}
/**
 * <p>Lists all roles that are assigned to the user for a given AWS account.</p>
 * @example
 * Use a bare-bones client and the command you need to make an API call.
 * ```javascript
 * import { SSOClient, ListAccountRolesCommand } from "@aws-sdk/client-sso"; // ES Modules import
 * // const { SSOClient, ListAccountRolesCommand } = require("@aws-sdk/client-sso"); // CommonJS import
 * const client = new SSOClient(config);
 * const command = new ListAccountRolesCommand(input);
 * const response = await client.send(command);
 * ```
 *
 * @see {@link ListAccountRolesCommandInput} for command's `input` shape.
 * @see {@link ListAccountRolesCommandOutput} for command's `response` shape.
 * @see {@link SSOClientResolvedConfig | config} for SSOClient's `config` shape.
 *
 */
export declare class ListAccountRolesCommand extends $Command<ListAccountRolesCommandInput, ListAccountRolesCommandOutput, SSOClientResolvedConfig> {
    readonly input: ListAccountRolesCommandInput;
    constructor(input: ListAccountRolesCommandInput);
    /**
     * @internal
     */
    resolveMiddleware(clientStack: MiddlewareStack<ServiceInputTypes, ServiceOutputTypes>, configuration: SSOClientResolvedConfig, options?: __HttpHandlerOptions): Handler<ListAccountRolesCommandInput, ListAccountRolesCommandOutput>;
    private serialize;
    private deserialize;
}
