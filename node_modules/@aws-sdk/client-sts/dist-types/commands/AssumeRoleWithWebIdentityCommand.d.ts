import { Command as $Command } from "@aws-sdk/smithy-client";
import { Handler, HttpHandlerOptions as __HttpHandlerOptions, MetadataBearer as __MetadataBearer, MiddlewareStack } from "@aws-sdk/types";
import { AssumeRoleWithWebIdentityRequest, AssumeRoleWithWebIdentityResponse } from "../models/models_0";
import { ServiceInputTypes, ServiceOutputTypes, STSClientResolvedConfig } from "../STSClient";
export interface AssumeRoleWithWebIdentityCommandInput extends AssumeRoleWithWebIdentityRequest {
}
export interface AssumeRoleWithWebIdentityCommandOutput extends AssumeRoleWithWebIdentityResponse, __MetadataBearer {
}
/**
 * <p>Returns a set of temporary security credentials for users who have been authenticated in
 *          a mobile or web application with a web identity provider. Example providers include the
 *          OAuth 2.0 providers Login with Amazon and Facebook, or any OpenID Connect-compatible
 *          identity provider such as Google or <a href="https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-identity.html">Amazon Cognito federated identities</a>.</p>
 *          <note>
 *             <p>For mobile applications, we recommend that you use Amazon Cognito. You can use Amazon Cognito with the
 *                <a href="http://aws.amazon.com/sdkforios/">Amazon Web Services SDK for iOS Developer Guide</a> and the <a href="http://aws.amazon.com/sdkforandroid/">Amazon Web Services SDK for Android Developer Guide</a> to uniquely
 *             identify a user. You can also supply the user with a consistent identity throughout the
 *             lifetime of an application.</p>
 *             <p>To learn more about Amazon Cognito, see <a href="https://docs.aws.amazon.com/mobile/sdkforandroid/developerguide/cognito-auth.html#d0e840">Amazon Cognito Overview</a> in
 *                <i>Amazon Web Services SDK for Android Developer Guide</i> and <a href="https://docs.aws.amazon.com/mobile/sdkforios/developerguide/cognito-auth.html#d0e664">Amazon Cognito Overview</a> in the
 *                <i>Amazon Web Services SDK for iOS Developer Guide</i>.</p>
 *          </note>
 *          <p>Calling <code>AssumeRoleWithWebIdentity</code> does not require the use of Amazon Web Services
 *          security credentials. Therefore, you can distribute an application (for example, on mobile
 *          devices) that requests temporary security credentials without including long-term Amazon Web Services
 *          credentials in the application. You also don't need to deploy server-based proxy services
 *          that use long-term Amazon Web Services credentials. Instead, the identity of the caller is validated by
 *          using a token from the web identity provider. For a comparison of
 *             <code>AssumeRoleWithWebIdentity</code> with the other API operations that produce
 *          temporary credentials, see <a href="https://docs.aws.amazon.com/IAM/latest/UserGuide/id_credentials_temp_request.html">Requesting Temporary Security
 *             Credentials</a> and <a href="https://docs.aws.amazon.com/IAM/latest/UserGuide/id_credentials_temp_request.html#stsapi_comparison">Comparing the
 *             Amazon Web Services STS API operations</a> in the <i>IAM User Guide</i>.</p>
 *          <p>The temporary security credentials returned by this API consist of an access key ID, a
 *          secret access key, and a security token. Applications can use these temporary security
 *          credentials to sign calls to Amazon Web Services service API operations.</p>
 *          <p>
 *             <b>Session Duration</b>
 *          </p>
 *          <p>By default, the temporary security credentials created by
 *             <code>AssumeRoleWithWebIdentity</code> last for one hour. However, you can use the
 *          optional <code>DurationSeconds</code> parameter to specify the duration of your session.
 *          You can provide a value from 900 seconds (15 minutes) up to the maximum session duration
 *          setting for the role. This setting can have a value from 1 hour to 12 hours. To learn how
 *          to view the maximum value for your role, see <a href="https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles_use.html#id_roles_use_view-role-max-session">View the
 *             Maximum Session Duration Setting for a Role</a> in the
 *             <i>IAM User Guide</i>. The maximum session duration limit applies when
 *          you use the <code>AssumeRole*</code> API operations or the <code>assume-role*</code> CLI
 *          commands. However the limit does not apply when you use those operations to create a
 *          console URL. For more information, see <a href="https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles_use.html">Using IAM Roles</a> in the
 *             <i>IAM User Guide</i>. </p>
 *          <p>
 *             <b>Permissions</b>
 *          </p>
 *          <p>The temporary security credentials created by <code>AssumeRoleWithWebIdentity</code> can
 *          be used to make API calls to any Amazon Web Services service with the following exception: you cannot
 *          call the STS <code>GetFederationToken</code> or <code>GetSessionToken</code> API
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
 *          <p>
 *             <b>Tags</b>
 *          </p>
 *          <p>(Optional) You can configure your IdP to pass attributes into your web identity token as
 *          session tags. Each session tag consists of a key name and an associated value. For more
 *          information about session tags, see <a href="https://docs.aws.amazon.com/IAM/latest/UserGuide/id_session-tags.html">Passing Session Tags in STS</a> in the
 *             <i>IAM User Guide</i>.</p>
 *          <p>You can pass up to 50 session tags. The plaintext session tag keys can’t exceed 128
 *          characters and the values can’t exceed 256 characters. For these and additional limits, see
 *             <a href="https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_iam-limits.html#reference_iam-limits-entity-length">IAM
 *             and STS Character Limits</a> in the <i>IAM User Guide</i>.</p>
 *
 *          <note>
 *             <p>An Amazon Web Services conversion compresses the passed session policies and session tags into a
 *             packed binary format that has a separate limit. Your request can fail for this limit
 *             even if your plaintext meets the other requirements. The <code>PackedPolicySize</code>
 *             response element indicates by percentage how close the policies and tags for your
 *             request are to the upper size limit.
 *             </p>
 *          </note>
 *
 *          <p>You can pass a session tag with the same key as a tag that is attached to the role. When
 *          you do, the session tag overrides the role tag with the same key.</p>
 *          <p>An administrator must grant you the permissions necessary to pass session tags. The
 *          administrator can also create granular permissions to allow you to pass only specific
 *          session tags. For more information, see <a href="https://docs.aws.amazon.com/IAM/latest/UserGuide/tutorial_attribute-based-access-control.html">Tutorial: Using Tags
 *             for Attribute-Based Access Control</a> in the
 *          <i>IAM User Guide</i>.</p>
 *          <p>You can set the session tags as transitive. Transitive tags persist during role
 *          chaining. For more information, see <a href="https://docs.aws.amazon.com/IAM/latest/UserGuide/id_session-tags.html#id_session-tags_role-chaining">Chaining Roles
 *             with Session Tags</a> in the <i>IAM User Guide</i>.</p>
 *          <p>
 *             <b>Identities</b>
 *          </p>
 *          <p>Before your application can call <code>AssumeRoleWithWebIdentity</code>, you must have
 *          an identity token from a supported identity provider and create a role that the application
 *          can assume. The role that your application assumes must trust the identity provider that is
 *          associated with the identity token. In other words, the identity provider must be specified
 *          in the role's trust policy. </p>
 *          <important>
 *             <p>Calling <code>AssumeRoleWithWebIdentity</code> can result in an entry in your
 *             CloudTrail logs. The entry includes the <a href="http://openid.net/specs/openid-connect-core-1_0.html#Claims">Subject</a> of
 *             the provided web identity token. We recommend that you avoid using any personally
 *             identifiable information (PII) in this field. For example, you could instead use a GUID
 *             or a pairwise identifier, as <a href="http://openid.net/specs/openid-connect-core-1_0.html#SubjectIDTypes">suggested
 *                in the OIDC specification</a>.</p>
 *          </important>
 *          <p>For more information about how to use web identity federation and the
 *             <code>AssumeRoleWithWebIdentity</code> API, see the following resources: </p>
 *          <ul>
 *             <li>
 *                <p>
 *                   <a href="https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles_providers_oidc_manual.html">Using Web Identity Federation API Operations for Mobile Apps</a> and <a href="https://docs.aws.amazon.com/IAM/latest/UserGuide/id_credentials_temp_request.html#api_assumerolewithwebidentity">Federation Through a Web-based Identity Provider</a>. </p>
 *             </li>
 *             <li>
 *                <p>
 *                   <a href="https://aws.amazon.com/blogs/aws/the-aws-web-identity-federation-playground/"> Web Identity Federation Playground</a>. Walk through the process of
 *                authenticating through Login with Amazon, Facebook, or Google, getting temporary
 *                security credentials, and then using those credentials to make a request to Amazon Web Services.
 *             </p>
 *             </li>
 *             <li>
 *                <p>
 *                   <a href="http://aws.amazon.com/sdkforios/">Amazon Web Services SDK for iOS Developer Guide</a> and <a href="http://aws.amazon.com/sdkforandroid/">Amazon Web Services SDK for Android Developer Guide</a>. These toolkits
 *                contain sample apps that show how to invoke the identity providers. The toolkits then
 *                show how to use the information from these providers to get and use temporary
 *                security credentials. </p>
 *             </li>
 *             <li>
 *                <p>
 *                   <a href="http://aws.amazon.com/articles/web-identity-federation-with-mobile-applications">Web Identity
 *                   Federation with Mobile Applications</a>. This article discusses web identity
 *                federation and shows an example of how to use web identity federation to get access
 *                to content in Amazon S3. </p>
 *             </li>
 *          </ul>
 * @example
 * Use a bare-bones client and the command you need to make an API call.
 * ```javascript
 * import { STSClient, AssumeRoleWithWebIdentityCommand } from "@aws-sdk/client-sts"; // ES Modules import
 * // const { STSClient, AssumeRoleWithWebIdentityCommand } = require("@aws-sdk/client-sts"); // CommonJS import
 * const client = new STSClient(config);
 * const command = new AssumeRoleWithWebIdentityCommand(input);
 * const response = await client.send(command);
 * ```
 *
 * @see {@link AssumeRoleWithWebIdentityCommandInput} for command's `input` shape.
 * @see {@link AssumeRoleWithWebIdentityCommandOutput} for command's `response` shape.
 * @see {@link STSClientResolvedConfig | config} for STSClient's `config` shape.
 *
 */
export declare class AssumeRoleWithWebIdentityCommand extends $Command<AssumeRoleWithWebIdentityCommandInput, AssumeRoleWithWebIdentityCommandOutput, STSClientResolvedConfig> {
    readonly input: AssumeRoleWithWebIdentityCommandInput;
    constructor(input: AssumeRoleWithWebIdentityCommandInput);
    /**
     * @internal
     */
    resolveMiddleware(clientStack: MiddlewareStack<ServiceInputTypes, ServiceOutputTypes>, configuration: STSClientResolvedConfig, options?: __HttpHandlerOptions): Handler<AssumeRoleWithWebIdentityCommandInput, AssumeRoleWithWebIdentityCommandOutput>;
    private serialize;
    private deserialize;
}
