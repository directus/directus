# DigitalOcean App Platform

## 1. Setup a repo on GitHub

See the doc on [installing Directus manually](/guides/installation/manual) to learn how to configure this repo

## 2. Create a Managed Database instance

We recommend using Postgres 12. The exact size and need for a replica depends on your usage and project requirements.

## 3. Create a new App using your previously created repo

Make sure to select the database you created in step 2 during the configuration wizard.

## 4. Configure the environment variables

See [Environment Variables](/reference/environment-variables) for all available environment variables.

DigitalOcean requires you to use SSL connections to managed databases. DigitalOcean provides a bunch of aliases to often
used database properties that can be injected when the database is a component of your app. To enable SSL connections,
set the following environment variables:

```
DB_SSL__REJECT_UNAUTHORIZED=true
DB_SSL__CA=${my-database-component-name.CA_CERT}
```

<!-- prettier-ignore-start -->
::: warning
Make sure to replace `my-database-component-name` with your actual database component name in the above env vars
:::
<!-- prettier-ignore-end -->

<!-- prettier-ignore-start -->
::: tip
For ease of configuration, you can rely on any of the other DigitalOcean provided aliases. See [How to Use Environment Variables in App Platform](https://www.digitalocean.com/docs/app-platform/how-to/use-environment-variables/) for more information.
:::
<!-- prettier-ignore-end -->
