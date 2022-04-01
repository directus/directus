import { Command as $Command } from "@aws-sdk/smithy-client";
import { Handler, HttpHandlerOptions as __HttpHandlerOptions, MetadataBearer as __MetadataBearer, MiddlewareStack } from "@aws-sdk/types";
import { GetFederationTokenRequest, GetFederationTokenResponse } from "../models/models_0";
import { ServiceInputTypes, ServiceOutputTypes, STSClientResolvedConfig } from "../STSClient";
export interface GetFederationTokenCommandInput extends GetFederationTokenRequest {
}
export interface GetFederationTokenCommandOutput extends GetFederationTokenResponse, __MetadataBearer {
}
/**
 * <p>Returns a set of temporary security credentials (consisting of an access key ID, a
 *          secret access key, and a security token) for a federated user. A typical use is in a proxy
 *          application that gets temporary security credentials on behalf of distributed applications
 *          inside a corporate network. You must call the <code>GetFederationToken</code> operation
 *          using the long-term security credentials of an IAM user. As a result, this call is
 *          appropriate in contexts where those credentials can be safely stored, usually in a
 *          server-based application. For a comparison of <code>GetFederationToken</code> with the
 *          other API operations that produce temporary credentials, see <a href="https://docs.aws.amazon.com/IAM/latest/UserGuide/id_credentials_temp_request.html">Requesting Temporary Security
 *             Credentials</a> and <a href="https://docs.aws.amazon.com/IAM/latest/UserGuide/id_credentials_temp_request.html#stsapi_comparison">Comparing the
 *             Amazon Web Services STS API operations</a> in the <i>IAM User Guide</i>.</p>
 *          <note>
 *             <p>You can create a mobile-based or browser-based app that can authenticate users using
 *             a web identity provider like Login with Amazon, Facebook, Google, or an OpenID
 *             Connect-compatible identity provider. In this case, we recommend that you use <a href="http://aws.amazon.com/cognito/">Amazon Cognito</a> or
 *                <code>AssumeRoleWithWebIdentity</code>. For more information, see <a href="https://docs.aws.amazon.com/IAM/latest/UserGuide/id_credentials_temp_request.html#api_assumerolewithwebidentity">Federation Through a Web-based Identity Provider</a> in the
 *                <i>IAM User Guide</i>.</p>
 *          </note>
 *          <p>You can also call <code>GetFederationToken</code> using the security credentials of an
 *          Amazon Web Services account root user, but we do not recommend it. Instead, we recommend that you create
 *          an IAM user for the purpose of the proxy application. Then attach a policy to the IAM
 *          user that limits federated users to only the actions and resources that they need to
 *          access. For more information, see <a href="https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html">IAM Best Practices</a> in the
 *             <i>IAM User Guide</i>. </p>
 *          <p>
 *             <b>Session duration</b>
 *          </p>
 *          <p>The temporary credentials are valid for the specified duration, from 900 seconds (15
 *          minutes) up to a maximum of 129,600 seconds (36 hours). The default session duration is
 *          43,200 seconds (12 hours). Temporary credentials obtained by using the Amazon Web Services account root
 *          user credentials have a maximum duration of 3,600 seconds (1 hour).</p>
 *          <p>
 *             <b>Permissions</b>
 *          </p>
 *          <p>You can use the temporary credentials created by <code>GetFederationToken</code> in any
 *          Amazon Web Services service except the following:</p>
 *          <ul>
 *             <li>
 *                <p>You cannot call any IAM operations using the CLI or the Amazon Web Services API. </p>
 *             </li>
 *             <li>
 *                <p>You cannot call any STS operations except <code>GetCallerIdentity</code>.</p>
 *             </li>
 *          </ul>
 *          <p>You must pass an inline or managed <a href="https://docs.aws.amazon.com/IAM/latest/UserGuide/access_policies.html#policies_session">session policy</a> to
 *          this operation. You can pass a single JSON policy document to use as an inline session
 *          policy. You can also specify up to 10 managed policies to use as managed session policies.
 *          The plaintext that you use for both inline and managed session policies can't exceed 2,048
 *          characters.</p>
 *          <p>Though the session policy parameters are optional, if you do not pass a policy, then the
 *          resulting federated user session has no permissions. When you pass session policies, the
 *          session permissions are the intersection of the IAM user policies and the session
 *          policies that you pass. This gives you a way to further restrict the permissions for a
 *          federated user. You cannot use session policies to grant more permissions than those that
 *          are defined in the permissions policy of the IAM user. For more information, see <a href="https://docs.aws.amazon.com/IAM/latest/UserGuide/access_policies.html#policies_session">Session
 *             Policies</a> in the <i>IAM User Guide</i>. For information about
 *          using <code>GetFederationToken</code> to create temporary security credentials, see <a href="https://docs.aws.amazon.com/IAM/latest/UserGuide/id_credentials_temp_request.html#api_getfederationtoken">GetFederationToken—Federation Through a Custom Identity Broker</a>. </p>
 *          <p>You can use the credentials to access a resource that has a resource-based policy. If
 *          that policy specifically references the federated user session in the
 *             <code>Principal</code> element of the policy, the session has the permissions allowed by
 *          the policy. These permissions are granted in addition to the permissions granted by the
 *          session policies.</p>
 *          <p>
 *             <b>Tags</b>
 *          </p>
 *          <p>(Optional) You can pass tag key-value pairs to your session. These are called session
 *          tags. For more information about session tags, see <a href="https://docs.aws.amazon.com/IAM/latest/UserGuide/id_session-tags.html">Passing Session Tags in STS</a> in the
 *             <i>IAM User Guide</i>.</p>
 *          <note>
 *             <p>You can create a mobile-based or browser-based app that can authenticate users using
 *             a web identity provider like Login with Amazon, Facebook, Google, or an OpenID
 *             Connect-compatible identity provider. In this case, we recommend that you use <a href="http://aws.amazon.com/cognito/">Amazon Cognito</a> or
 *                <code>AssumeRoleWithWebIdentity</code>. For more information, see <a href="https://docs.aws.amazon.com/IAM/latest/UserGuide/id_credentials_temp_request.html#api_assumerolewithwebidentity">Federation Through a Web-based Identity Provider</a> in the
 *                <i>IAM User Guide</i>.</p>
 *          </note>
 *          <p>An administrator must grant you the permissions necessary to pass session tags. The
 *          administrator can also create granular permissions to allow you to pass only specific
 *          session tags. For more information, see <a href="https://docs.aws.amazon.com/IAM/latest/UserGuide/tutorial_attribute-based-access-control.html">Tutorial: Using Tags
 *             for Attribute-Based Access Control</a> in the
 *          <i>IAM User Guide</i>.</p>
 *          <p>Tag key–value pairs are not case sensitive, but case is preserved. This means that you
 *          cannot have separate <code>Department</code> and <code>department</code> tag keys. Assume
 *          that the user that you are federating has the
 *             <code>Department</code>=<code>Marketing</code> tag and you pass the
 *             <code>department</code>=<code>engineering</code> session tag. <code>Department</code>
 *          and <code>department</code> are not saved as separate tags, and the session tag passed in
 *          the request takes precedence over the user tag.</p>
 * @example
 * Use a bare-bones client and the command you need to make an API call.
 * ```javascript
 * import { STSClient, GetFederationTokenCommand } from "@aws-sdk/client-sts"; // ES Modules import
 * // const { STSClient, GetFederationTokenCommand } = require("@aws-sdk/client-sts"); // CommonJS import
 * const client = new STSClient(config);
 * const command = new GetFederationTokenCommand(input);
 * const response = await client.send(command);
 * ```
 *
 * @see {@link GetFederationTokenCommandInput} for command's `input` shape.
 * @see {@link GetFederationTokenCommandOutput} for command's `response` shape.
 * @see {@link STSClientResolvedConfig | config} for STSClient's `config` shape.
 *
 */
export declare class GetFederationTokenCommand extends $Command<GetFederationTokenCommandInput, GetFederationTokenCommandOutput, STSClientResolvedConfig> {
    readonly input: GetFederationTokenCommandInput;
    constructor(input: GetFederationTokenCommandInput);
    /**
     * @internal
     */
    resolveMiddleware(clientStack: MiddlewareStack<ServiceInputTypes, ServiceOutputTypes>, configuration: STSClientResolvedConfig, options?: __HttpHandlerOptions): Handler<GetFederationTokenCommandInput, GetFederationTokenCommandOutput>;
    private serialize;
    private deserialize;
}
