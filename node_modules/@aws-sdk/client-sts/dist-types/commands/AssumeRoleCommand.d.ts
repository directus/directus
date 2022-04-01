import { Command as $Command } from "@aws-sdk/smithy-client";
import { Handler, HttpHandlerOptions as __HttpHandlerOptions, MetadataBearer as __MetadataBearer, MiddlewareStack } from "@aws-sdk/types";
import { AssumeRoleRequest, AssumeRoleResponse } from "../models/models_0";
import { ServiceInputTypes, ServiceOutputTypes, STSClientResolvedConfig } from "../STSClient";
export interface AssumeRoleCommandInput extends AssumeRoleRequest {
}
export interface AssumeRoleCommandOutput extends AssumeRoleResponse, __MetadataBearer {
}
/**
 * <p>Returns a set of temporary security credentials that you can use to access Amazon Web Services
 *          resources that you might not normally have access to. These temporary credentials consist
 *          of an access key ID, a secret access key, and a security token. Typically, you use
 *             <code>AssumeRole</code> within your account or for cross-account access. For a
 *          comparison of <code>AssumeRole</code> with other API operations that produce temporary
 *          credentials, see <a href="https://docs.aws.amazon.com/IAM/latest/UserGuide/id_credentials_temp_request.html">Requesting Temporary Security
 *             Credentials</a> and <a href="https://docs.aws.amazon.com/IAM/latest/UserGuide/id_credentials_temp_request.html#stsapi_comparison">Comparing the
 *             Amazon Web Services STS API operations</a> in the <i>IAM User Guide</i>.</p>
 *          <p>
 *             <b>Permissions</b>
 *          </p>
 *          <p>The temporary security credentials created by <code>AssumeRole</code> can be used to
 *          make API calls to any Amazon Web Services service with the following exception: You cannot call the
 *          Amazon Web Services STS <code>GetFederationToken</code> or <code>GetSessionToken</code> API
 *          operations.</p>
 *          <p>(Optional) You can pass inline or managed <a href="https://docs.aws.amazon.com/IAM/latest/UserGuide/access_policies.html#policies_session">session policies</a> to
 *          this operation. You can pass a single JSON policy document to use as an inline session
 *          policy. You can also specify up to 10 managed policies to use as managed session policies.
 *          The plaintext that you use for both inline and managed session policies can't exceed 2,048
 *          characters. Passing policies to this operation returns new
 *          temporary credentials. The resulting session's permissions are the intersection of the
 *          role's identity-based policy and the session policies. You can use the role's temporary
 *          credentials in subsequent Amazon Web Services API calls to access resources in the account that owns
 *          the role. You cannot use session policies to grant more permissions than those allowed
 *          by the identity-based policy of the role that is being assumed. For more information, see
 *             <a href="https://docs.aws.amazon.com/IAM/latest/UserGuide/access_policies.html#policies_session">Session
 *             Policies</a> in the <i>IAM User Guide</i>.</p>
 *          <p>When you create a role, you create two policies: A role trust policy that specifies
 *             <i>who</i> can assume the role and a permissions policy that specifies
 *             <i>what</i> can be done with the role. You specify the trusted principal
 *          who is allowed to assume the role in the role trust policy.</p>
 *          <p>To assume a role from a different account, your Amazon Web Services account must be trusted by the
 *          role. The trust relationship is defined in the role's trust policy when the role is
 *          created. That trust policy states which accounts are allowed to delegate that access to
 *          users in the account. </p>
 *          <p>A user who wants to access a role in a different account must also have permissions that
 *          are delegated from the user account administrator. The administrator must attach a policy
 *          that allows the user to call <code>AssumeRole</code> for the ARN of the role in the other
 *          account.</p>
 *          <p>To allow a user to assume a role in the same account, you can do either of the
 *          following:</p>
 *          <ul>
 *             <li>
 *                <p>Attach a policy to the user that allows the user to call <code>AssumeRole</code>
 *                (as long as the role's trust policy trusts the account).</p>
 *             </li>
 *             <li>
 *                <p>Add the user as a principal directly in the role's trust policy.</p>
 *             </li>
 *          </ul>
 *          <p>You can do either because the role’s trust policy acts as an IAM resource-based
 *          policy. When a resource-based policy grants access to a principal in the same account, no
 *          additional identity-based policy is required. For more information about trust policies and
 *          resource-based policies, see <a href="https://docs.aws.amazon.com/IAM/latest/UserGuide/access_policies.html">IAM Policies</a> in the
 *             <i>IAM User Guide</i>.</p>
 *
 *          <p>
 *             <b>Tags</b>
 *          </p>
 *          <p>(Optional) You can pass tag key-value pairs to your session. These tags are called
 *          session tags. For more information about session tags, see <a href="https://docs.aws.amazon.com/IAM/latest/UserGuide/id_session-tags.html">Passing Session Tags in STS</a> in the
 *             <i>IAM User Guide</i>.</p>
 *          <p>An administrator must grant you the permissions necessary to pass session tags. The
 *          administrator can also create granular permissions to allow you to pass only specific
 *          session tags. For more information, see <a href="https://docs.aws.amazon.com/IAM/latest/UserGuide/tutorial_attribute-based-access-control.html">Tutorial: Using Tags
 *             for Attribute-Based Access Control</a> in the
 *          <i>IAM User Guide</i>.</p>
 *          <p>You can set the session tags as transitive. Transitive tags persist during role
 *          chaining. For more information, see <a href="https://docs.aws.amazon.com/IAM/latest/UserGuide/id_session-tags.html#id_session-tags_role-chaining">Chaining Roles
 *             with Session Tags</a> in the <i>IAM User Guide</i>.</p>
 *          <p>
 *             <b>Using MFA with AssumeRole</b>
 *          </p>
 *          <p>(Optional) You can include multi-factor authentication (MFA) information when you call
 *             <code>AssumeRole</code>. This is useful for cross-account scenarios to ensure that the
 *          user that assumes the role has been authenticated with an Amazon Web Services MFA device. In that
 *          scenario, the trust policy of the role being assumed includes a condition that tests for
 *          MFA authentication. If the caller does not include valid MFA information, the request to
 *          assume the role is denied. The condition in a trust policy that tests for MFA
 *          authentication might look like the following example.</p>
 *          <p>
 *             <code>"Condition": {"Bool": {"aws:MultiFactorAuthPresent": true}}</code>
 *          </p>
 *          <p>For more information, see <a href="https://docs.aws.amazon.com/IAM/latest/UserGuide/MFAProtectedAPI.html">Configuring MFA-Protected API Access</a>
 *          in the <i>IAM User Guide</i> guide.</p>
 *          <p>To use MFA with <code>AssumeRole</code>, you pass values for the
 *             <code>SerialNumber</code> and <code>TokenCode</code> parameters. The
 *             <code>SerialNumber</code> value identifies the user's hardware or virtual MFA device.
 *          The <code>TokenCode</code> is the time-based one-time password (TOTP) that the MFA device
 *          produces. </p>
 * @example
 * Use a bare-bones client and the command you need to make an API call.
 * ```javascript
 * import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts"; // ES Modules import
 * // const { STSClient, AssumeRoleCommand } = require("@aws-sdk/client-sts"); // CommonJS import
 * const client = new STSClient(config);
 * const command = new AssumeRoleCommand(input);
 * const response = await client.send(command);
 * ```
 *
 * @see {@link AssumeRoleCommandInput} for command's `input` shape.
 * @see {@link AssumeRoleCommandOutput} for command's `response` shape.
 * @see {@link STSClientResolvedConfig | config} for STSClient's `config` shape.
 *
 */
export declare class AssumeRoleCommand extends $Command<AssumeRoleCommandInput, AssumeRoleCommandOutput, STSClientResolvedConfig> {
    readonly input: AssumeRoleCommandInput;
    constructor(input: AssumeRoleCommandInput);
    /**
     * @internal
     */
    resolveMiddleware(clientStack: MiddlewareStack<ServiceInputTypes, ServiceOutputTypes>, configuration: STSClientResolvedConfig, options?: __HttpHandlerOptions): Handler<AssumeRoleCommandInput, AssumeRoleCommandOutput>;
    private serialize;
    private deserialize;
}
