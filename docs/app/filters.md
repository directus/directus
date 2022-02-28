# Filters

> Filters, a utility used extensively throughout Directus, allow you to conditionally select Items from a Collection.
> Use-cases include conditionally limiting Item search results, restricting Item access permissions to Users or Roles,
> building dashboard analytics in Insights, and more.

![Filters](image.webp)

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

Filtering options are infinitely customizable. However, they will be limited by the Collections, relations, and
information stored in your database. A basic Filter requires a Field, Operator, and Value at the very minimum. From
there, Filters can get as complex as needed for your data.

To add multiple Filters, simply click **"Add Filter"**

- [Dynamic Variables]()
- [AND/OR Groups](#and-or-groups)

## Filter Options

![Filter Options](image.jpg)

- **Field** - The collection field to compare and filter by.
- **Operator** - The logical operation to filter by.
- **Value** - The field value to filter by.

### Numeric Operators

- **Equals** –
- **Doesn't equal** -
- **Less than** -
- **Less than or equal to** -
- **Greater than** -
- **Greater than or equal to** -
- **Is between** -
- **Isn't between** -
- **Is null** -
- **Isn't null** -
- **Is one of** -
- **Is not one of** -
- **Contains** -
- **Doesn't contain** -

### Text String Operators

- **Contains** -
- **Doesn't contain** -
- **Starts with** -
- **Doesn't start with** -
- **Ends with** -
- **Doesn't end with** -
- **Equals** -
- **Doesn't equal** -
- **Is empty** -
- **Isn't empty** -
- **Is null** -
- **Isn't null** -
- **Is one of** -
- **Is not one of** -

### Dynamic Variables

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

### AND/OR Groups

AND Groups give the option to filter for Items that meet _all of several criteria_ while OR Groups filter for Items that
meet _any one of several criteria_.

1. Click "Add Filter".
2. Click "And/OR Group" at the very top of the dropdown menu.
3. Click the filter text to toggle:
   - `AND` if you wish to include Items that meet every single criteria.
   - `OR` if you wish to include Items that meet one of several criteria.
4. Click "Add Filter" again.
5. Nest this new Filter by clicking and dragging it to the right.

### Filtering by Fields in other Collections

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
