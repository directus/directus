# Translations

> Directus is maintained by a global community of contributors who speak many different languages. Not only does
> Directus allow you to manage multilingual content, the App itself also supports multiple languages.

## App Translations

Directus supports internationalization across its entire Admin App. Many languages are currently supported, with more
being added all the time. You can add or refine any languages through our [CrowdIn](https://locales.directus.io/)
integration.

## Schema Translations

Directus uses [database mirroring](/concepts/databases/#database-mirroring) to dynamically pull in the technical names
of your schema's tables ([Collections](/concepts/collections/)) and columns ([Fields](/concepts/fields/)), prettifying
and formatting them for display throughout the App. You can then add additional schema translations to further support
different languages.

::: tip Renaming Collections and Fields

If your project uses more _technical_ table or column names (eg: `cust` or `f_name`), you can also use schema
translations to _rename_ Collections and Fields to something more intuitive (eg: `Customers` or `First Name`).

:::

## Content Translations

One of the most important features in Directus is the ability to manage multilingual content. While there are many
different ways to accomplish this, such as creating _standard_ fields in the parent collection for each language, it is
more extensible to use our _relational_ translation fields. These allow you to dynamically manage content in as many
languages as is required, using a more intuitive interface.

Mixing standard and translated fields also allows language-agnostic data (such as dates or toggles) to remain within the
parent collection.

### Integrating with Translation Services

There are two common ways to integrate with a third-party translation service.

For human-powered translation services, you can create a dedicated Role with limited permissions to properly scope their
access to only the content they will be translating. You can also create
[Workflows](/guides/permissions/#configuring-workflows) that require a certain internal Role to then approve the
changes.

For machine-powered translation services, you could use the Directus API and Event Hooks to integrate the two platforms
together. In this way, when your users create or update new content, an event hook can fire that fetches translations
from the third-party service, saving that data into the translations.

Yet another option would be to create a [Custom Interface](/guides/interfaces/) that integrates with the third-party
service to fetch translation in real-time.
