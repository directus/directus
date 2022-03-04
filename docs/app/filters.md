# Filters

> Filters allow you to conditionally select Items from a Collection. Use-cases include customizing Item search results,
> restricting Item access permissions for specific Users or Roles, building dashboard analytics with the Insights
> module, and more.

![Filters](https://cdn.directus.io/docs/v9/app-guide/filters/filters-20220303A/filters-20220303A.webp)

[[toc]]

::: warning There Are Two Filters Documents

This page is a non-technical guide to using Filters. For more technical info, see
[Filter-Rules](/configuration/filter-rules/).

:::

## How it Works

::: tip Assumed Knowledge

Filters are intuitive to use, but get quite nuanced as complexity increases. In order to use Filters effectively, you
will need to understand the Field _(aka [data model](/configuration/data-model/))_ being filtered as well as any
relevant [Users, Roles and Permissions](/configuration/users-roles-permissions.md).

:::

Set the [Field, Operator, and Value](/configuration/filter-rules/#syntax).

<video autoplay muted loop controls title="How Filters Work">
	<source src="https://cdn.directus.io/docs/v9/app-guide/filters/filters-20220303A/how-filters-work-20220303A.mp4" type="video/mp4" />
</video>

2. Click <span mi icon>filter*list</span> or **"Add Filter"** *(depending on where the Filter is located)\_.
3. Select the Field to filter by.
4. Select the Operator as desired.
5. Define the Value to filter for.
6. Optional: Repeat as needed.

From here, you can make Filters more complex as necessary. Options include using multiple Filters at once, filtering by
[Fields in related Collections](#filtering-by-related-collections), setting Values with
[Dynamic Variables](#dynamic-variables), as well as applying [AND/OR Groups](#and-or-groups).

:::tip Operators

The Field type will determine the kinds of Operators that can be used on it. In fact, some Fields cannot be filtered at
all (read more in [Unfilterable Fields](#unfilterable-fields)). Once a Field is selected, the permitted operators will
automatically display. An exhaustive list of Operators and what they do can be found in the more technical
[Filter Rules](/configuration/filter-rules/#filter-operators) document.

:::

## AND/OR Groups

`AND` Groups give the option to filter for Items that meet _all of several criteria_. `OR` Groups filter for Items that
meet _any one of several criteria_.

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

Filters actually default to `AND` Group behavior automatically. However, when two Filters are nested inside of an OR
Group, they of course switch to `OR` Group behavior. So an AND Group is necessary in cases where you want to meet
multiple conditions inside of OR Groups.

:::

## Dynamic Variables

The following video shows how to filter for Blog posts written within the past 60 days.

<video autoplay muted loop controls title="How Filters Work">
	<source src="https://cdn.directus.io/docs/v9/app-guide/filters/filters-20220303A/dynamic-variables-20220303A.mp4" type="video/mp4" />
</video>

The following Dynamic Variables are built into Directus to make Filtering easier: `$CURRENT_USER`, `$CURRENT_ROLE`,
`$NOW` and `$NOW(<adjustment>)`. For more information about Dynamic Variables, please see the related section in
[Filter Rules](/configuration/filter-rules/#dynamic-variables).

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
[Alias](/getting-started/glossary/#alias) Field, all the Fields for that associated Collection pop down. If you select
one of these Fields, you can run Filters on the current Collection by Field values in a related Collection.

Here are step-by-step instructions on how to filter by Fields in other Collections:

<video autoplay muted loop controls title="How Filters Work">
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
