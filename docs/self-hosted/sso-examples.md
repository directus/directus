---
description:
  A collection of example Directus configurations for integrating with various OAuth 2.0, OpenID and SAML platforms.
readTime: 2 min read
---

# SSO Examples

Below is a collection of example Directus configurations for integrating with various OAuth 2.0 and OpenID platforms.

Due to the large number of available SSO platforms, this list will only cover the most common configurations.
Contributions to expand and maintain the list are encouraged.

## Google

```
AUTH_GOOGLE_DRIVER="openid"
AUTH_GOOGLE_CLIENT_ID="..."
AUTH_GOOGLE_CLIENT_SECRET="..."
AUTH_GOOGLE_ISSUER_URL="https://accounts.google.com/.well-known/openid-configuration"
AUTH_GOOGLE_IDENTIFIER_KEY="email"
```

## Facebook

```
AUTH_FACEBOOK_DRIVER="oauth2"
AUTH_FACEBOOK_CLIENT_ID="..."
AUTH_FACEBOOK_CLIENT_SECRET="..."
AUTH_FACEBOOK_AUTHORIZE_URL="https://www.facebook.com/dialog/oauth"
AUTH_FACEBOOK_ACCESS_URL="https://graph.facebook.com/oauth/access_token"
AUTH_FACEBOOK_PROFILE_URL="https://graph.facebook.com/me?fields=email"
```

## Twitter

```
AUTH_TWITTER_DRIVER="oauth2"
AUTH_TWITTER_CLIENT_ID="..."
AUTH_TWITTER_CLIENT_SECRET="-..."
AUTH_TWITTER_AUTHORIZE_URL="https://twitter.com/i/oauth2/authorize"
AUTH_TWITTER_ACCESS_URL="https://api.twitter.com/2/oauth2/token"
AUTH_TWITTER_PROFILE_URL="https://api.twitter.com/2/users/me"
AUTH_TWITTER_IDENTIFIER_KEY="data.username"
AUTH_TWITTER_SCOPE="tweet.read users.read"
```

::: warning Notice

Twitter does not provide "email" so we define "username" as the identifier.

:::

## Microsoft Azure

```
AUTH_MICROSOFT_DRIVER="openid"
AUTH_MICROSOFT_CLIENT_ID="..."
AUTH_MICROSOFT_CLIENT_SECRET="..."
AUTH_MICROSOFT_ISSUER_URL="https://login.microsoftonline.com/<your_tenant_id>/v2.0/.well-known/openid-configuration"
AUTH_MICROSOFT_IDENTIFIER_KEY="email"
```

## Okta

```
AUTH_OKTA_DRIVER="openid"
AUTH_OKTA_CLIENT_ID="..."
AUTH_OKTA_CLIENT_SECRET= "..."
AUTH_OKTA_ISSUER_URL="https://<your_okta_domain>/.well-known/openid-configuration"
AUTH_OKTA_IDENTIFIER_KEY="email"
```

## Auth0

```
AUTH_AUTH0_DRIVER="openid"
AUTH_AUTH0_CLIENT_ID="..."
AUTH_AUTH0_CLIENT_SECRET="..."
AUTH_AUTH0_ISSUER_URL="https://<your_auth0_domain>/.well-known/openid-configuration"
AUTH_AUTH0_IDENTIFIER_KEY="email"
```

## Keycloak

```
AUTH_KEYCLOAK_DRIVER="openid"
AUTH_KEYCLOAK_CLIENT_ID="..."
AUTH_KEYCLOAK_CLIENT_SECRET="..."
AUTH_KEYCLOAK_ISSUER_URL="http://<your_keycloak_domain>/realms/<your_keycloak_realm>/.well-known/openid-configuration"
AUTH_KEYCLOAK_IDENTIFIER_KEY="email"
```

## GitHub

```
AUTH_GITHUB_DRIVER="oauth2"
AUTH_GITHUB_CLIENT_ID="..."
AUTH_GITHUB_CLIENT_SECRET="..."
AUTH_GITHUB_AUTHORIZE_URL="https://github.com/login/oauth/authorize"
AUTH_GITHUB_ACCESS_URL="https://github.com/login/oauth/access_token"
AUTH_GITHUB_PROFILE_URL="https://api.github.com/user"
```

::: warning Notice

If the authenticating user has not marked their email as "public" in GitHub, it will not be accessible by Directus.

:::

## Discord

```
AUTH_DISCORD_DRIVER="oauth2"
AUTH_DISCORD_CLIENT_ID="..."
AUTH_DISCORD_CLIENT_SECRET="..."
AUTH_DISCORD_AUTHORIZE_URL="https://discord.com/api/oauth2/authorize"
AUTH_DISCORD_ACCESS_URL="https://discord.com/api/oauth2/token"
AUTH_DISCORD_PROFILE_URL="https://discord.com/api/users/@me"
```

## Twitch

```
AUTH_TWITCH_DRIVER="openid"
AUTH_TWITCH_CLIENT_ID="..."
AUTH_TWITCH_CLIENT_SECRET="..."
AUTH_TWITCH_ISSUER_URL="https://id.twitch.tv/oauth2/.well-known/openid-configuration"
AUTH_TWITCH_SCOPE="openid user:read:email"
AUTH_TWITCH_PARAMS__CLAIMS="string:{"id_token":{"email":null}}"
AUTH_TWITCH_IDENTIFIER_KEY="email"
```

## Apple

```
AUTH_APPLE_DRIVER="openid"
AUTH_APPLE_CLIENT_ID="..."
AUTH_APPLE_CLIENT_SECRET="..."
AUTH_APPLE_ISSUER_URL="https://appleid.apple.com/.well-known/openid-configuration"
AUTH_APPLE_SCOPE="name email"
AUTH_APPLE_IDENTIFIER_KEY="email"
AUTH_APPLE_PARAMS="{"response_mode":"form_post"}"
```

# SAML Examples

## AWS SSO

```
AUTH_SSO_DRIVER=saml
AUTH_PROVIDERS="AWSSSO"
AUTH_AWSSSO_idp_metadata='{Your IAM Identity Center SAML metadata file}'
AUTH_AWSSSO_sp_metadata=''
AUTH_AWSSSO_ALLOW_PUBLIC_REGISTRATION=true
AUTH_AWSSSO_DEFAULT_ROLE_ID='needs-to-be-a-valid-role-on-the-instance'
AUTH_AWSSSO_IDENTIFIER_KEY=email
AUTH_AWSSSO_EMAIL_KEY=email
```

::: tip AWS Help

- AWS SSO Docs are not that verbose. Users have found that the `sp_metadata` environment variable can be supplied empty.

- Users have found that replacing
  `<md:SingleSignOnService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect" Location="https://your-soo-portal-url"/>`
  in the IAM Identity Center SAML metadata file with your AWS Portal URL is a fix for getting the 'Login With SSO'
  button on Directus to work, rather the default redirect from AWS.

- Directus expects `<?xml version="1.0" encoding="UTF-8"?>` to be removed from the start of the XML.

:::

**Mapping:**

Maps the email address into Directus as external_identifier:

```
| User attribute in the application | Maps to this string value or user attribute in IAM Identity Center | type |
| --- | ----------- | --- |
| Subject | ${user:email} | emailAddress |
| email | ${user:email} | unspecified |
```

**Config:**

Relay state - `admin/login` Application ACS URL - `https://your-directus-instance/auth/login/awssso/acs`
