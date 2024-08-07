---
description:
  Filters allow you to conditionally select Items from a Collection. Use-cases include customizing Item search results
  restricting Item access permissions for specific Users or Roles, building dashboard analytics with the Insights
  module, and more.
readTime: 5 min read
---

# Filters

> Filters allow you to conditionally select Items from a Collection. Use-cases include customizing Item search results,
> restricting Item access permissions for specific Users or Roles, building dashboard analytics with the Insights
> module, and more.

![Filters](https://cdn.directus.io/docs/v9/app-guide/filters/filters-20220303A/filters-20220303A.webp)

::: warning There Are Two Filters Documents

This page is a non-technical guide to using Filters. For more technical info, see
[Filter-Rules](/reference/filter-rules).

:::

## How it Works

::: tip Assumed Knowledge

Filters are intuitive to use, but get quite nuanced as complexity increases. In order to use Filters effectively, you
will need to understand the Field _(aka [data model](/app/data-model))_ being filtered as well as any relevant
[Users, Roles and Permissions](/user-guide/user-management/users-roles-permissions).

:::

A basic filter is composed of 3 parts: A **Field** from the Collection being Filtered, a logical
[Operator](/reference/filter-rules#filter-operators), and some specified **Value** to filter for within each Item's
Field.

<video autoplay playsinline muted loop controls title="How Filters Work">
	<source src="https://cdn.directus.io/docs/v9/app-guide/filters/filters-20220303A/how-filters-work-20220303A.mp4" type="video/mp4" />
</video>

2. Click <span mi icon>filter_list</span> or **"Add Filter"**.
3. Select the Field to filter by.
4. Select the Operator as desired.
5. Define the Value to filter for.

From here, you can set multiple Filters at once, filter by
[Fields in related Collections](#filtering-by-related-collections), set Values with
[Dynamic Variables](#dynamic-variables), as well as apply [AND/OR Groups](#and-or-groups).

::: tip Operators

The Field type will determine the kinds of Operators that can be used on it. In fact, some Fields cannot be filtered at
all (read more in [Unfilterable Fields](#unfilterable-fields)). Once a Field is selected, the permitted operators will
automatically display. An exhaustive list of Operators and what they do can be found in the more technical
[Filter Rules](/reference/filter-rules#filter-operators) document.

:::

## AND/OR Groups

`AND` Groups give the option to filter for Items that meet _all of several criteria_. On the other hand, `OR` Groups
filter for Items that meet _any one of several criteria_.

![AND/OR Groups](https://cdn.directus.io/docs/v9/app-guide/filters/filters-20220303A/and-or-groups-20220303A.webp)

1. Click "Add Filter".
2. Click "And/OR Group" at the very top of the dropdown menu.
3. Click the AND/OR text to toggle:
   - `AND` – Selects Items that meet every single criteria.
   - `OR` – Selects Items that meet one of several criteria.
4. Click "Add Filter" again.
5. Configure the Field, Operator, and Value as desired.
6. Click and hold <span mi icon>drag_indicator</span> to drag a Filter and nest it under an AND/OR Group.

::: tip Why do we need AND Groups?

Filters actually default to `AND` Group behavior automatically. However, when Filters are nested inside of an OR Group,
they of course switch to `OR` Group behavior. So an AND Group is necessary in cases where you want to meet multiple
conditions inside of OR Groups.

:::

## Dynamic Variables

The following video shows how to filter for Blog posts written within the past 60 days.

<video autoplay playsinline muted loop controls title="How Filters Work">
	<source src="https://cdn.directus.io/docs/v9/app-guide/filters/filters-20220303A/dynamic-variables-20220307A.mp4" type="video/mp4" />
</video>

The following Dynamic Variables are built into Directus to make Filtering easier: `$CURRENT_USER`, `$CURRENT_ROLE`,
`$CURRENT_ROLES`, `$CURRENT_POLICIES`, `$NOW` and `$NOW(<adjustment>)`. For more information, please see the Dynamic
Variables section in [Filter Rules](/reference/filter-rules).

## Filtering by Related Collections

You may need to run filters on one Collection _based on information in another related Collection_. Here are a few
examples of when that might happen:

- Book authors that also wrote screenplays (filters `authors`, uses `screenplays`).
- Products with a 5 star customer review (filters `products`, uses `reviews`).
- Accounts with active user login within the last 12 months (filters `accounts`, uses `logins`).

This can span across any number of relationally linked Collections. For example, you could filter for customers that
bought rock songs, where the `customers` and `genres` Collections are linked by `customers` -> `invoices` ->
`invoice-items` -> `tracks` -> `genres`.

You will notice a <span mi icon>chevron_right</span> icon beside relational Fields. When you click on any
[Alias](/user-guide/overview/glossary#alias) Field, all the Fields for that associated Collection pop down. If you
select one of these Fields, you can run Filters on the current Collection by Field values in a related Collection.

Here are step-by-step instructions on how to filter by Fields in other Collections:

<video autoplay playsinline muted loop controls title="How Filters Work">
	<source src="https://cdn.directus.io/docs/v9/app-guide/filters/filters-20220303A/filtering-by-related-collections-20220303A.mp4" type="video/mp4" />
</video>

1. Click "Add Filter".
2. Click the desired relational Field. This will pop down and display the related Collection Fields.
3. Select a Field from this related Collection.
4. Set the Operator and Value as desired.

## Unfilterable Fields

![Unfilterable Fields](https://cdn.directus.io/docs/v9/app-guide/filters/filters-20220303A/unfilterable-fields-20220303A.webp)

Not all Fields can be filtered. As seen above in [Filtering by Related Collections](#filtering-by-related-collections),
Alias Fields cannot be filtered; they instead provide a dropdown menu to access Fields from a related Collection.
Additionally, the "Presentation" and "Group" Fields cannot be filtered at all and will not appear as an option in
Filters.

## Extensibility Options

Directus Core is completely open-source, modular and extensible. Extensions allow you to expand or modify any part of
Directus to fit your needs. Here are some great resources to get started down that track.

- [Extensions > Introduction](/extensions/introduction)
- [Extensions > Creating Extensions](/extensions/creating-extensions)
- [Contributing > Introduction](/contributing/introduction)
- [Contributing > Codebase Overview](/contributing/codebase-overview)

::: tip Accelerated Development

Working on an enterprise project and looking to outsource or financially sponsor the development of a Shares extension?
Contact [our team](https://directus.io/contact)

:::

## More Help

Looking for technical support for your non-enterprise project? Chat with thousands of engineers within our growing
[Community on Discord](https://discord.com/invite/directus)
