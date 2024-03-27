# Frequently Asked Questions

>

## Is it possible to update the admin user password via CLI?

You can do this with the following command:

```sh
npx directus users passwd --email admin@example.com --password newpasswordhere
```

## Why isn't Directus properly saving Chinese characters or emoji?

Please ensure that the encoding for your database, tables, and fields are set to `utf8mb4`.
