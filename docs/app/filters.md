QUESTIONS:

- Any functional difference between multiple Filters versus using `AND` Groups at base level.
- What's a **validation permission**? `settings > roles & permissions` ? or sthg totally different?

TODO:

- photos/videos
- Optimize Filter-Rules - Move table to Filter-Rules

# Filters

> Filters, a utility used extensively throughout Directus, allow you to conditionally select Items from a Collection.
> Use-cases include customizing Item search results, restricting Item access permissions to Users or Roles, building
> dashboard analytics Insights, and more.

<video autoplay muted loop controls title="What a Filters Look Like">
	<source src="" type="video/mp4" />
</video>

[[toc]]

::: tip There Are Two Filters Documents

This page is a non-technical guide to using Filters. For more technical info, see
[Filter-Rules](/configuration/filter-rules/).

:::

## How it Works

Filters are very simple. Choose a Collection to filter; set the Field, Operator and Value; then set more Filters as
necessary to get granular results. In order to use Filters effectively, you will need a solid understanding of the
[data model](/configuration/data-model/) for the Field you are trying to Filter.

<video autoplay muted loop controls title="How to Create Filters">
	<source src="" type="video/mp4" />
</video>

1. Click "Add Filter".
2. Select The Field to filter by.
3. Select the Operator as desired.
4. Define the value to filter for.
5. Repeat as needed.

## Filters Overview

![Filters Overview](image.webp)

A basic Filter requires a Field, Operator, and Value at the very minimum. From there, filtering options are infinitely
customizable. However, you will only be able to filter by the Collections, Collection relations, and Configurations
stored in your database.

Options include:

- Adding multiple Filters at once.
- Filtering by [Fields in related Collections](#filtering-by-fields-in-related-collections).
- Setting Values with [Dynamic Variables](#dynamic-variables).
- Applying [AND/OR Groups](#and-or-groups).

## Filter Options

<video autoplay muted loop controls title="Filter Options">
	<source src="" type="video/mp4" />
</video>

- **Field** - The Collection Field to filter each Item by.
- **Operator** - The logical operation to filter by. See more in the following section, [Operators](#operators).
- **Value** - The field value to filter for. Note that for some operators (for example `null` and `is not null`) you
  will not have a Value.

## Operators

<video autoplay muted loop controls title="Filter Operators">
	<source src="" type="video/mp4" />
</video>

Fields have pre-defined data types. A Field's data types will change the kinds of operators that can be used on it. Some
types of Fields cannot be filtered at all (read more in [Unfilterable Fields](#unfilterable-fields)). Once a Field is
selected, the permitted operators will automatically display. A full list of all operators and what they do can be found
in the more technical [Filter Rules](/configuration/filter-rules/#filter-operators) document.

| Filter Title in GUI            | Operator                           | Description                            |
| ------------------------------ | ---------------------------------- | -------------------------------------- |
| Equals                         | `_eq`                              | Equal to                               |
| Doesn't equal                  | `_neq`                             | Not equal to                           |
| Less than                      | `_lt`                              | Less than                              |
| Less than or equal to          | `_lte`                             | Less than or equal to                  |
| Greater than                   | `_gt`                              | Greater than                           |
| Greater than or equal to       | `_gte`                             | Greater than or equal to               |
| Is one of                      | `_in`                              | Matches any of the values              |
| Is not one of                  | `_nin`                             | Doesn't match any of the values        |
| Is null                        | `_null`                            | Is `null`                              |
| Isn't null                     | `_nnull`                           | Is not `null`                          |
| Contains                       | `_contains`                        | Contains the substring                 |
| Doesn't contain                | `_ncontains`                       | Doesn't contain the substring          |
| Starts with                    | `_starts_with`                     | Starts with                            |
| Doesn't start with             | `_nstarts_with`                    | Doesn't start with                     |
| Ends with                      | `_ends_with`                       | Ends with                              |
| Doesn't end with               | `_nends_with`                      | Doesn't end with                       |
| Is between                     | `_between`                         | Is between two values (inclusive)      |
| Isn't between                  | `_nbetween`                        | Is not between two values (inclusive)  |
| Is empty                       | `_empty`                           | Is empty (`null` or falsy)             |
| Isn't empty                    | `_nempty`                          | Is not empty (`null` or falsy)         |
| Intersects                     | `_intersects` <sup>[1]</sup>       | Value intersects a given point         |
| Doesn't intersect              | `_nintersects` <sup>[1]</sup>      | Value does not intersect a given point |
| Intersects Bounding box        | `_intersects_bbox` <sup>[1]</sup>  | Value is in a bounding box             |
| Doesn't intersect bounding box | `_nintersects_bbox` <sup>[1]</sup> | Value is not in a bounding box         |

## Dynamic Variables

Several Dynamic Variables are built into Directus to make Filtering easier. Read more about Dynamic Variables in
[Filter Rules](/configuration/filter-rules/#dynamic-variables).

## AND/OR Groups

`AND` Groups give the option to filter for Items that meet _all of several criteria_. `OR` Groups filter for Items that
meet _any one of several criteria_.

<video autoplay muted loop controls title="AND / OR Groups">
	<source src="" type="video/mp4" />
</video>

1. Click "Add Filter".
2. Click "And/OR Group" at the very top of the dropdown menu.
3. Click the text to toggle to:
   - `AND` to select Items that meet every single criteria.
   - `OR` to select Items that meet one of several criteria.
4. Click "Add Filter" again.
5. Nest this new Filter by clicking and dragging it to the right.

## Filtering by Fields in Related Collections

Sometimes, you will need to run filters for your current Collection but based on information in another related
Collection. Here might be a few examples:

- Highest paid authors that wrote 5 or more books (uses `authors` and `books` Collections).
- Products with less than 50 sales monthly (uses `products` and `orders` Collections).
- Blog Posts with the highest number of social shares (uses `blog` and `social share metadata` Collections).

You will notice a <span mi icon>chevron_right</span> icon beside foreign key Fields. When you click on any
[Alias](/getting-started/glossary/#alias) Field, the associated Collection's Fields pop down. If you select one of these
Fields, you can run Filters on the current Collection by Field values in a related Collection. Here are step-by-step
instructions on how to filter by Fields in other Collections:

<video autoplay muted loop controls title="AND / OR Groups">
	<source src="" type="video/mp4" />
</video>

1. Click "Add Filter".
2. Click the Foreign Key Field. This will pop down and display the related Collection Fields.
3. Select a Field from this related Collection.
4. Set the rest of your filtering logic as desired.

::: tip Nested Filtering

Collection relations can span across multiple tables. For example, you might want to filter and display `articles` by
`authors` that also produced `videos`. This nested Filtering can go on between any two relationally connected
Collections.

:::

::: tip What's a Foreign Key?

A _Foreign Key Field_ is a Field that references the Primary Key (often times this is the `ID`) field of another
Collection.

:::

## Unfilterable Fields

Not all Fields can be filtered. For example, as seen above in
[Filtering by Fields in Related Collections](#filtering-by-fields-in-related-collections), Alias Field types cannot be
filtered, but instead provide access to other Field types on a related Collection. Aside from this Presentation and
Group Fields cannot be filtered at all, and they will not appear in the Filters.

## Gotchas

- Filtering WYSIWYG/Markdown etc. will include the raw HTML/markdown notation.
