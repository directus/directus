import { Command as $Command } from "@aws-sdk/smithy-client";
import { Handler, HttpHandlerOptions as __HttpHandlerOptions, MetadataBearer as __MetadataBearer, MiddlewareStack } from "@aws-sdk/types";
import { DecodeAuthorizationMessageRequest, DecodeAuthorizationMessageResponse } from "../models/models_0";
import { ServiceInputTypes, ServiceOutputTypes, STSClientResolvedConfig } from "../STSClient";
export interface DecodeAuthorizationMessageCommandInput extends DecodeAuthorizationMessageRequest {
}
export interface DecodeAuthorizationMessageCommandOutput extends DecodeAuthorizationMessageResponse, __MetadataBearer {
}
/**
 * <p>Decodes additional information about the authorization status of a request from an
 *          encoded message returned in response to an Amazon Web Services request.</p>
 *          <p>For example, if a user is not authorized to perform an operation that he or she has
 *          requested, the request returns a <code>Client.UnauthorizedOperation</code> response (an
 *          HTTP 403 response). Some Amazon Web Services operations additionally return an encoded message that can
 *          provide details about this authorization failure. </p>
 *          <note>
 *             <p>Only certain Amazon Web Services operations return an encoded authorization message. The
 *             documentation for an individual operation indicates whether that operation returns an
 *             encoded message in addition to returning an HTTP code.</p>
 *          </note>
 *          <p>The message is encoded because the details of the authorization status can contain
 *          privileged information that the user who requested the operation should not see. To decode
 *          an authorization status message, a user must be granted permissions through an IAM <a href="https://docs.aws.amazon.com/IAM/latest/UserGuide/access_policies.html">policy</a> to
 *          request the <code>DecodeAuthorizationMessage</code>
 *             (<code>sts:DecodeAuthorizationMessage</code>) action. </p>
 *          <p>The decoded message includes the following type of information:</p>
 *          <ul>
 *             <li>
 *                <p>Whether the request was denied due to an explicit deny or due to the absence of an
 *                explicit allow. For more information, see <a href="https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_evaluation-logic.html#policy-eval-denyallow">Determining Whether a Request is Allowed or Denied</a> in the
 *                   <i>IAM User Guide</i>. </p>
 *             </li>
 *             <li>
 *                <p>The principal who made the request.</p>
 *             </li>
 *             <li>
 *                <p>The requested action.</p>
 *             </li>
 *             <li>
 *                <p>The requested resource.</p>
 *             </li>
 *             <li>
 *                <p>The values of condition keys in the context of the user's request.</p>
 *             </li>
 *          </ul>
 * @example
 * Use a bare-bones client and the command you need to make an API call.
 * ```javascript
 * import { STSClient, DecodeAuthorizationMessageCommand } from "@aws-sdk/client-sts"; // ES Modules import
 * // const { STSClient, DecodeAuthorizationMessageCommand } = require("@aws-sdk/client-sts"); // CommonJS import
 * const client = new STSClient(config);
 * const command = new DecodeAuthorizationMessageCommand(input);
 * const response = await client.send(command);
 * ```
 *
 * @see {@link DecodeAuthorizationMessageCommandInput} for command's `input` shape.
 * @see {@link DecodeAuthorizationMessageCommandOutput} for command's `response` shape.
 * @see {@link STSClientResolvedConfig | config} for STSClient's `config` shape.
 *
 */
export declare class DecodeAuthorizationMessageCommand extends $Command<DecodeAuthorizationMessageCommandInput, DecodeAuthorizationMessageCommandOutput, STSClientResolvedConfig> {
    readonly input: DecodeAuthorizationMessageCommandInput;
    constructor(input: DecodeAuthorizationMessageCommandInput);
    /**
     * @internal
     */
    resolveMiddleware(clientStack: MiddlewareStack<ServiceInputTypes, ServiceOutputTypes>, configuration: STSClientResolvedConfig, options?: __HttpHandlerOptions): Handler<DecodeAuthorizationMessageCommandInput, DecodeAuthorizationMessageCommandOutput>;
    private serialize;
    private deserialize;
}
