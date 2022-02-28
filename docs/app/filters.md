# Filters

> Filters, a utility used extensively throughout Directus, allow you to conditionally select Items from a Collection.
> Use-cases include limiting Item search results, restricting Item access permissions to Users or Roles, building
> dashboard analytics in Insights, and more.

## How it Works

### Filter Options

The filtering options are infinitely customizable. However, they will be limited by the collections, relations, and
information stored in your database. Filters require you to define a Field, operator, and value. The 6 dots indicate
this item can be clicked and dragged with a mouse.

![Insights Panel Filter Options](image.jpg)

- **Field** - The collection field to compare and filter by.
- **Operator** - The logical operation to filter by.
- **Value** - The field value to filter by.

#### Numeric Operators

- **Equals**
- **Doesn't equal**
- **Less than**
- **Less than or equal to**
- **Greater than**
- **Greater than or equal to**
- **Is between**
- **Isn't between**
- **Is null**
- **Isn't null**
- **Is one of**
- **Is not one of**
- **Contains**
- **Doesn't contain**

#### Text String Operators

- **Contains**
- **Doesn't contain**
- **Starts with**
- **Doesn't start with**
- **Ends with**
- **Doesn't end with**
- **Equals**
- **Doesn't equal**
- **Is empty**
- **Isn't empty**
- **Is null**
- **Isn't null**
- **Is one of**
- **Is not one of**

#### Dynamic Variables

```
timestamp _gte $NOW(-7 days)
user_created _eq $CURRENT_USER
allowed_role _eq $CURRENT_ROLE
$CURRENT_USER.first_name
business_entity _in $CURRENT_USER.business_entities
```

#### AND/OR Groups

And/Or Groups give the option of filtering for items that meet _all of several criteria_ or meet _any one of several
criteria_.

1. Click "Add Filter"
2. Click "And/OR Group" at the very top of the dropdown menu. A new filter will appear that should say `Any` _of the
   following_.
3. Click the filter text to toggle:
   - `Any` if you wish to include items that meet one of several criteria.
   - `All` if you wish to include items that meet every single criteria.
4. Click "Add Filter" again.
5. Nest this new filter by clicking and dragging it to the right.

#### Filtering by Fields in other Tables

Sometimes, you will need to run filters that require information from two or more collections. Here might be a few
examples:

- Highest paid authors that wrote 5 or more books (uses `authors` and `books` collections).
- Products with less than 50 sales monthly (uses `products` and `orders` collections).
- Blog Posts with the highest number of social shares (uses `blog` and `social share metadata` collections).

Here is how to limit results of one collection by the values of fields from a related collection.

1. Click "Add Filter".
2. Click the arrow next to a foreign key field. The fields from the collection that the foreign key references will drop
   down.
3. Select a field from this referenced collection.
4. Set your filtering logic.

::: tip Foreign Keys

A _foreign key field_ is a field that references the primary key (often times this is the `ID`) field of another
collection.

:::

::: tip How to filter against other tables

Once a foreign key is selected on a filter, any directly nested filters will take on the other fields from that
collection.

:::
