---
description: Single Sign-On is a mechanism which allows to use external providers to login into systems.
readTime: 4 min read
---

<script setup lang="ts">
import { data as packages } from '@/data/packages.data.js';
</script>

# Single Sign-On (SSO)

Single Sign-On is a mechanism which allows to use external providers to login into systems. For example, you can use
your Google or Facebook account to authenticate into systems without the need to create a new registration on those
systems.

::: tip Session Based Authentication

In [Directus version 10.10.0](/releases/breaking-changes.html#session-cookie-based-authentication) the `cookie` mode has
been replaced by the new `session` mode. The API still supports `cookie` mode logins for compatibility, however the Data
Studio no longer supports `cookie` mode for logging in.

:::

## Supported SSO mechanisms

Directus supports four standard types of SSO mechanisms:

- [OpenID](https://openid.net/specs/openid-connect-core-1_0.html)
- [OAuth 2.0](https://www.ietf.org/rfc/rfc6750.txt)
- [LDAP](https://datatracker.ietf.org/doc/html/rfc4511)
- [SAML](https://datatracker.ietf.org/doc/html/rfc7522)

Here are the configuration allowed for each one: [SSO configuration](/self-hosted/config-options#sso-oauth2-and-openid)

In order to use these mechanisms you need to:

1. Create an application/configuration on your preferred external provider
2. Set the environment variables to configure the external provider
3. [*Optional*] Set the environment variables to configure cookies

### OpenID

In this section, we provide some guides to help you set up SSO with OpenID.

#### Google

To be able to use Google OpenID as your external provider you'll need to:

1. Go into [Google Cloud Console](https://console.cloud.google.com)
2. Select or Create a new project
3. Go to [APIs & Services -> OAuth consent screen](https://console.cloud.google.com/apis/credentials/consent) on side
   bar
   1. Select the access you desire
      - Select **Internal** if you only want people within your organization to be able to access
      - Select **External** to allow everyone with a Google account
   2. Fill the fields according to your preferences
      - The **Authorized domains** add an extra layer of security, but it is not required. In case you fill it, should
        be the domain where your Directus instance is
   3. On Scopes, you need to choose `.../auth/userinfo.email`, `.../auth/userinfo.profile` and `openid`
4. On side bar, go to [Credentials](https://console.cloud.google.com/apis/credentials)
5. Click on [Create Credentials -> OAuth Client ID](https://console.cloud.google.com/apis/credentials/oauthclient)
   1. Choose `Web Application` on **Application Type**
   2. The **Authorized JavaScript origins** adds an extra layer of security, but it is not required. In case you fill
      it, should be the address of your Directus instance. For example, `https://directus.myserver.com`
   3. On **Authorized redirect URIs** put your Directus instance address plus `/auth/login/google/callback`. For
      example, you should put `https://directus.myserver.com/auth/login/google/callback` where
      `https://directus.myserver.com` should be the address of your Directus instance. If you are testing locally you
      should add `http://localhost:8055/auth/login/google/callback` too
6. On click **Create**, a modal will appear with **Client ID** and **Client Secret**. Save both somewhere to use later.

7. Now on Directus side, you need to add the following configuration to your `.env` file located on root folder of your
   project:

```sh
AUTH_PROVIDERS="google"

AUTH_GOOGLE_DRIVER="openid"
AUTH_GOOGLE_CLIENT_ID="XXXX" # Replace XXXX with the Client ID from Step 6
AUTH_GOOGLE_CLIENT_SECRET="XXXX" # Replace XXXX with the Client Secret from Step 6
AUTH_GOOGLE_ISSUER_URL="https://accounts.google.com"
AUTH_GOOGLE_IDENTIFIER_KEY="email"
AUTH_GOOGLE_ICON="google"
AUTH_GOOGLE_LABEL="Google"
AUTH_GOOGLE_ALLOW_PUBLIC_REGISTRATION="true" # This allows users to be automatically created on logins. Use "false" if you want to create users manually
AUTH_GOOGLE_DEFAULT_ROLE_ID="XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX" # Replace this with the Directus Role ID you would want for new users. If this is not properly configured, new users will not have access to Directus
```

8. Now you can see a nice functional `Login with Google` button on Directus login page.

## Seamless SSO

While sometimes you want your users to directly have access to the Directus Application, in other cases you may need to
fetch private data from Directus in your client using external providers. For such cases, a special configuration is
required to work across domains:

1. Setup an external provider. You'll find some examples under [Supported SSO mechanisms](#supported-sso-mechanisms).
2. Allow the cookie to be accessible across domains. For that, use the following configuration:

   **Authentication Mode: session**

   ```sh
   AUTH_<PROVIDER>_MODE="session"
   SESSION_COOKIE_DOMAIN="XXXX" # Replace XXXX with the domain of your Directus instance. For example "directus.myserver.com"
   SESSION_COOKIE_SECURE="true"
   SESSION_COOKIE_SAME_SITE="None"
   ```

   **Authentication Mode: cookie (legacy)**

   ```sh
   AUTH_<PROVIDER>_MODE="cookie"
   REFRESH_TOKEN_COOKIE_DOMAIN="XXXX" # Replace XXXX with the domain of your Directus instance. For example "directus.myserver.com"
   REFRESH_TOKEN_COOKIE_SECURE="true"
   REFRESH_TOKEN_COOKIE_SAME_SITE="None"
   ```

3. On your client, the login button should conform to the following format:

   ```html
   <a href="https://directus.myserver.com/auth/login/google?redirect=https://client.myserver.com/login">Login</a>
   ```

   - Where `https://directus.myserver.com` should be the address of your Directus instance
   - While `https://client.myserver.com/login` should be the address of your client application. The `/login` path is
     not necessary, but helps to separate concerns.

4. On your login page, following the example of `https://client.myserver.com/login`, you need to call the refresh
   endpoint either via REST API or via SDK in order to have a session cookie or an `access_token`. Here are some
   examples:

   - via REST API / fetch

     ```js
     await fetch('https://directus.myserver.com/auth/refresh', {
     	method: 'POST',
     	credentials: 'include', // this is required in order to send the refresh/session token cookie
     	headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
     	body: JSON.stringify({ mode: 'session' }) // using 'session' mode, but can also be 'cookie' or 'json'
     });
     ```

   - via SDK in `session` authentication mode

     ```js
     import { createDirectus, authentication } from '@directus/sdk';

     const client = createDirectus('https://directus.myserver.com')
          .with(authentication('session', { credentials: 'include' }));

     await client.refresh();
     ```

   - via SDK in legacy `cookie` authentication mode

     ```js
     import { createDirectus, authentication } from '@directus/sdk';

     const client = createDirectus('https://directus.myserver.com')
          .with(authentication('cookie', { credentials: 'include' }));

     await client.refresh();
     ```

::: tip Redirect Allow List

To allow Directus to redirect to external domains like `https://client.myserver.com/` used above, you'll need to include
it in the `AUTH_<PROVIDER>_REDIRECT_ALLOW_LIST` security setting.

:::

### Testing Seamless SSO locally

The above `REFRESH_TOKEN_*` configuration will likely fail for local testing, as usually Directus won't be served under
a valid SSL certificate, which is a requirement for "Secure" cookies. Instead, for local testing purposes (**and local
testing purposes only**), the following configuration can be used:

**Authentication Mode: session**

```sh
SESSION_COOKIE_SECURE="false"
SESSION_COOKIE_SAME_SITE="lax"
```

**Authentication Mode: cookie**

```sh
REFRESH_TOKEN_COOKIE_SECURE="false"
REFRESH_TOKEN_COOKIE_SAME_SITE="lax"
```

Note that no `REFRESH_TOKEN_COOKIE_DOMAIN` or `SESSION_COOKIE_DOMAIN` value is set.

::: warning Disabling secured cookies

The configuration disables secured cookies and should only be used in local environment. Using it in production exposes
your instance to CSRF attacks.

:::

## SSO with Directus behind Proxy

If Directus is running behind an HTTP(S) proxy, the instance might not be able to reach the configured SSO provider. In
such a case, you may want to use the [`global-agent`](https://www.npmjs.com/package/global-agent) package, allowing you
to configure the corresponding proxy settings.

In this quick guide, we'll show how to set up the `global-agent` package by extending the Directus Docker Image.

::: warning Security Concerns

Due to the fact that the `global-agent` package needs to intercept all external requests, it can be regarded as a
potential attack surface. Especially in critical environments, it's therefore recommended to thoroughly evaluate the
impact of such a setup beforehand.

:::

First, create a patch file to adjust the `pm2` configuration file so that `global-agent` is registered at startup:

::: code-group

```diff [ecosystem-global-agent.patch]
diff --git a/ecosystem.config.cjs b/ecosystem.config.cjs
index 5218fda853..4c53cabc80 100644
--- a/ecosystem.config.cjs
+++ b/ecosystem.config.cjs
@@ -10,6 +10,7 @@ module.exports = [
 		name: 'directus',
 		script: 'cli.js',
 		args: ['start'],
+		node_args: ['-r', 'global-agent/bootstrap'],

 		// General
 		instances: process.env.PM2_INSTANCES ?? 1,
```

Afterwards, in the same directory, create a `Dockerfile`. In there, we extend from the Directus Image, install the
`global-agent` package and apply the previously created patch file:

:::

::: code-group

```Dockerfile-vue [Dockerfile]
FROM directus/directus:{{ packages.directus.version.major }}.x.y

USER root
RUN corepack enable
USER node

RUN pnpm install global-agent@3

COPY ecosystem-global-agent.patch .

USER root
RUN <<EOF
	apk add --no-cache patch
	patch -p1 < ecosystem-global-agent.patch || exit 1
	rm ecosystem-global-agent.patch
	apk del patch
EOF
USER node
```

:::

A new Docker Image can now be built from this customized `Dockerfile`, and can then be used with the following
environment variables to control the proxy configuration:

- `GLOBAL_AGENT_HTTP_PROXY`
- `GLOBAL_AGENT_HTTPS_PROXY`
