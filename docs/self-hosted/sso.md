---
description: Single Sign-On is a mechanism which allows to use external providers to login into systems.
readTime: 4 min read
---

# Single Sign-On (SSO)

Single Sign-On is a mechanism which allows to use external providers to login into systems. For example, you can use
your Google or Facebook account to authenticate into systems without the need to create a new registration on those
systems.

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

To be able to use Google OpenID as your external provider you will need to:

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
fetch private data from Directus in your client using external providers. In this cases, it is needed a special
configuration to work across domains, but is simple as:

1. Setup an external provider. You have some examples on [Supported SSO mechanisms](#supported-sso-mechanisms)
2. Allow cookie to be accessible across domains. Put the following configuration on `.env`:

```sh
REFRESH_TOKEN_COOKIE_DOMAIN="XXXX" # Replace XXXX with the domain of your Directus instance. For example "directus.myserver.com"
REFRESH_TOKEN_COOKIE_SECURE="true"
REFRESH_TOKEN_COOKIE_SAME_SITE="None"
```

2. On your client, your login button should be something like

```html
<a href="https://directus.myserver.com/auth/login/google?redirect=https://client.myserver.com/login">Login</a>
```

- Where `https://directus.myserver.com` should be the address of your Directus instance
- While `https://client.myserver.com/login` should be the address of your client application. The `/login` is not
  necessary, but helps to separate concerns

3. On your login page, following the example should be `https://client.myserver.com/login` you need to call the refresh
   endpoint either via REST API or via SDK in order to retrieve an `access_token`

   - via REST API / fetch

     ```js
     await fetch('https://directus.myserver.com/auth/refresh', {
     	method: 'POST',
     	credentials: 'include', // this is required in order to send the refresh token cookie
     });
     ```

   - via SDK

     ```js
     import { createDirectus, authentication } from '@directus/sdk';

     const client = createDirectus('https://directus.example.com')
          .with(authentication('cookie', { credentials: 'include' }));

     await client.refresh();
     ```

### Testing Seamless SSO locally

The above `REFRESH_TOKEN_*` configuration will likely fail for local testing, as you'll likely won't be serving Directus
using a valid SSL certificate which are required for "Secure" cookies. Instead, for local testing purposes (**and local
testing purposes only**), the following configuration can be used:

```sh
REFRESH_TOKEN_COOKIE_SECURE="false"
REFRESH_TOKEN_COOKIE_SAME_SITE="lax"
```

Note that no `REFRESH_TOKEN_COOKIE_DOMAIN` value is set.

::: warning Disabling secured cookies

The configuration disable secured cookies and should only be used in local environment. Using it in production exposes
your instance to CSRF attacks.

:::
