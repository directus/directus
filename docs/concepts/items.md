# Items

> An Item is an object within a Collection that contains the values for one or more fields. Each item represents a
> **record** in your database.

Items are the primary building blocks of your project content. Similar to a "row" within a spreadsheet, all data within
Directus is accessed via these "atomic" data units. Items in and of themselves are fairly straightforward, however their
real power comes from the complexity that begins to form when items are relationally connected to each other.

Items are referenced (both individually and relationally) by their unique "key", which is the value saved within their
primary key field. This can techncially be anything, but is typically an auto-incrementing integer or a more complex
UUID.

#### Relevant Guides

- [Creating an Item](/guides/items/#creating-an-item)
- [Archiving an Item](/guides/items/#archiving-an-item)
- [Reordering Items](/guides/items/#reordering-items)
- [Deleting an Item](/guides/items/#deleting-an-item)
