# Internationalization

> Directus is maintained by people all over the world. Not only does Directus allow you to author and manage multilingual content, the App itself also supports multiple languages and locales.

## App Translations

Directus supports internationalization across its entire Admin App. Many languages are currently supported, with more are being added all the time. Help the communtiy by adding or refining your language through our [CrowdIn](https://locales.directus.io/) integration.

## Schema Translations

Directus uses [database mirroring](#) to dynamically pull in your schema's tables and columns, however this only covers one language. Therefore our platform supports schema translations for these names, allowing you to properly support different locales for your Collection and Field names.

::: tip Overriding Technical Names
If your project requires more _technical_ table/column names (eg: `cust` or `f_name`), you can also use schema translations to override those defaults (eg: `Customers` or `First Name`) in the primary language.
:::

## Content Translations

One of the most important features in Directus is the ability to author and manage multilingual content. While you can accomplish this by creating _standard_ fields in the parent collection for each language, it is more extensible to use our relational translation fields to dynamically manage content in as many languages as is required. Mixing standard and translated fields also allows language-agnostic data (such as dates or toggles) to remain within the parent collection.

::: tip Custom Interfaces
For more advanced use-cases, such as connecting to a third-party translation service, you can read our extension guide on [creating a custom interface](#).
:::
