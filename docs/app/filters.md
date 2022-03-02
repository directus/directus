QUESTIONS:

- Do all Fields support filters??
- Keep operator table here AND filter-rules... or just here?

TODO:

- For more technical info, see [Filter-Rules](/configuration/filter-rules/).
- photos/videos
-

# Filters

> Filters, _a utility used extensively throughout Directus_, allow you to conditionally select Items from a Collection.
> Use-cases include conditionally limiting Item search results, restricting Item access permissions to Users or Roles,
> building dashboard analytics Insights, and more.

<video autoplay muted loop controls title="What a Filters Look Like">
	<source src="" type="video/mp4" />
</video>

[[toc]]

## How it Works

<video autoplay muted loop controls title="How to Create Filters">
	<source src="" type="video/mp4" />
</video>

1. Click "Add Filter".
2. Select The Field to filter by.
3. Select the Operator as desired.
4. Define the value to filter for.
5. Repeat as needed.

## Overview

![Filter Overview](image.webp)

Filtering options are infinitely customizable. However, you will only be able to filter by the Collections, Collection
relations, and other information stored in your database. A basic Filter requires a Field, Operator, and Value at the
very minimum.

From there, Filters can get as complex as your data will allow. Options include:

- [filtering by Fields in related Collections](#filtering-by-fields-in-related-collections)
- adding multiple Filters at once
- setting values with [Dynamic Variables](#dynamic-variables) which allow you to set values such as `$CURRENT_USER` and
  write the same Filter and apply it to every User
- applying [AND/OR Groups](#and-or-groups) which allow you to group multiple filters together and display Items that
  meet all Filter conditions or any one of several.

## Filter Options

![Filter Options](image.jpg)

- **Field** - The Collection Field to filter by.
- **Operator** - The logical operation to filter by. See more in the following section, [Operators](#operators).
- **Value** - The field value to filter for. This is typed out by the User, though in some cases you will have a
  dropdown or no Value option at all.

## Operators

Fields have pre-defined data types, which impacts the kinds of operators that can be used. Each Field type has a
different. A field's permitted operators will automatically display. Numeric (Int, Float, BigInt), String/text,
Datetime,

![Numeric Operators](image.webp)

The allowed operators will automatically populate, based on the Type of Field.

- **Equals** – Exact match to the input value.
- **Doesn't equal** - Not an exact match to the input value.
- **Less than** - less than the input value.
- **Less than or equal to** - Less than or equal to the input value.
- **Greater than** - Greater than the input value.
- **Greater than or equal to** - Greater than or equal to the input value.
- **Is one of** - A number from a list of input value.
- **Is not one of** - Not a number from a list of input value.
- **Is null** - a Field Item without any value assigned.
- **Isn't null** - A Field Item with set value (can be any value whatsoever).
- **Contains** - Contains the substring.
- **Doesn't contain** - Doesn't contain the substring.
- **Starts with** - Starts with.
- **Doesn't start with** - Doesn't end with.
- **Ends with** - Ends with.
- **Doesn't end with** - Doesn't end with.
- **Is between** - Between but not including the two input value.
- **Isn't between** - Not between the two input value.
- **Is empty** -
- **Isn't empty** -

| Filter Title                   | Operator                           | Description                            |
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

Several dynamic variables are built into Directus.

### timestamp

`_gte $NOW(-7 days)`

### user_created

`_eq $CURRENT_USER`

### allowed_role

`_eq $CURRENT_ROLE`

```
$CURRENT_USER.first_name
business_entity _in $CURRENT_USER.business_entities
```

## AND/OR Groups

AND Groups give the option to filter for Items that meet _all of several criteria_ while OR Groups filter for Items that
meet _any one of several criteria_.

1. Click "Add Filter".
2. Click "And/OR Group" at the very top of the dropdown menu.
3. Click the filter text to toggle:
   - `AND` if you wish to include Items that meet every single criteria.
   - `OR` if you wish to include Items that meet one of several criteria.
4. Click "Add Filter" again.
5. Nest this new Filter by clicking and dragging it to the right.

## Filtering by Fields in Related Collections

Sometimes, you will need to run filters that require information from two or more collections. Here might be a few
examples:

- Highest paid authors that wrote 5 or more books (uses `authors` and `books` collections).
- Products with less than 50 sales monthly (uses `products` and `orders` collections).
- Blog Posts with the highest number of social shares (uses `blog` and `social share metadata` collections).

You will notice a <span mi icon>chevron_right</span> icon beside foreign key Fields. When you click on a Foreign Key,
the associated Collections's Fields pop down. If you select one of these Fields, you can run Filters in teh current
Collection for value in a related Collection. Here are step-by-step instructions on how to filter by Fields in other
Collections:

1. Click "Add Filter".
2. Click the Foreign Key Field to pop down to display the related Collection's Fields.
3. Select a field from this referenced collection.
4. Set the rest of your filtering logic as desired.

::: tip Nested Filtering

Collection relations can go one for multiple tables. For example, you might want to filter and display `articles` by
`authors` that also produced `videos`. This nested Filtering can go on between any two relationally connected
Collections.

:::

::: tip What's a Foreign Key?

A _foreign key field_ is a field that references the primary key (often times this is the `ID`) field of another
collection.

:::

## Unfilterable Fields

- Relational Fields

## Gotchas

- Filtering WYSIWYG/Markdown etc. will include the raw HTML/markdown notation.
- `is between` on text is alphabetical and case-sensitive.
