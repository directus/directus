# Configuring the API

## Single Sign-On

`OAUTH_<PROVIDER>_ACCESS_URL`** and **`OAUTH_<PROVIDER>_AUTHORIZE_URL`\*\* will be only necessary to access data from a
particular tenant (e.g. a particular instance/domain of G-Suite or MS Office 365).

#### oAuth And Reverse Proxy

In case you are running Directus behind a reverse proxy (e.g. for implementing SSL/TLS) you also need to pay attention
to the configation of the **`PUBLIC_URL`**, or the oAuth provider will be try to reach Directus on the its private URL.

More specifically, the **`PUBLIC_URL`** variable is used to construct the oAuth request's _redirection endpoint_.

#### oAuth Example

Assuming that your providers are Google and Microsoft, that Directus is running behind a proxy, and that Microsoft's
login is not multi-tenant, then you would need to set the following environment variables:

```
OAUTH_PROVIDERS ="google microsoft"

OAUTH_GOOGLE_KEY = "<google_application_id>"
OAUTH_GOOGLE_SECRET=  "<google_application_secret_key>"
OAUTH_GOOGLE_SCOPE="openid email"

OAUTH_MICROSOFT_KEY = "<microsoft_application_id>"
OAUTH_MICROSOFT_SECRET = "<microsoft_application_secret_key>"
OAUTH_MICROSOFT_SCOPE = "openid email"
OAUTH_MICROSOFT_AUTHORIZE_URL = "https://login.microsoftonline.com/<microsoft_application_id>/oauth2/v2.0/authorize"
OAUTH_MICROSOFT_ACCESS_URL = "https://login.microsoftonline.com/<microsoft_application_id>/oauth2/v2.0/token"

PUBLIC_URL = "<public_url_of_directus_instance>"
```

## File Storage

## STMP for external emails

## Rate limiting

## Cache
