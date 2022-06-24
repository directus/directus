# DigitalOcean App Platform

## 1. Setup a repo on GitHub

See the doc on [installing Directus manually](/self-hosted/installation/manual/) to learn how to configure this repo.

## 2. Sign up for a DigitalOcean account

Create your DigitalOcean account — [get $100 of free credit](https://m.do.co/c/4c0b6062c16e) by using our referral link.

## 3. Create a Managed Database instance

The exact size and need for a replica depends on your usage and project requirements. We recommend using the latest
version of Postgres. DigitalOcean's MySQL offering isn't supported at this time. Please see
https://github.com/knex/knex/issues/4141 for more information.

## 4. Create a new App using your previously created repo

Make sure to select the database you created in step 2 during the configuration wizard.

## 5. Setup the build-step

While Directus itself doesn't have to be built from source in order to use it on App Platform, we do recommend adding
`npx directus bootstrap` as the "build" step for DigitalOcean. This will automatically provision the database if it's
empty, and migrate it to the latest version in case of upgrades. See
[Command Line Interface](/self-hosted/installation/cli/) for more information.

## 6. Configure the environment variables

See [Environment Variables](/self-hosted/config-options/#general) for all available environment variables.

DigitalOcean requires you to use SSL connections to managed databases. DigitalOcean provides a bunch of aliases to often
used database properties that can be injected when the database is a component of your app. To enable SSL connections,
set the following environment variables:

```
DB_SSL__REJECT_UNAUTHORIZED=true
DB_SSL__CA=${my-database-component-name.CA_CERT}
```

::: warning

Make sure to replace `my-database-component-name` with your actual database component name in the above env vars

:::
