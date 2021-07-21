# Databases

> The Directus platform is primarily comprised of an API and App, working in concert to “mirror” the schema and content
> of your SQL database.

## Database Mirroring

**Instead of using a predefined “one-size-fits-all” data model to store your content, Directus “mirrors” your actual SQL
database in real-time.** The principle is akin to a database client (like _phpMyAdmin_), but includes far more advanced
tools, and is safe and intuitive enough for non-technical users. This approach has many unique advantages:

- A custom (pure) SQL database schema, tailored to your exact requirements
- Significant performance improvements through optimizations and indexing
- Complete transparency, portability, and security for your data
- Direct database access and the full power of raw/complex SQL queries
- Allows importing existing databases, unaltered and without any migrations

## Dynamic API

The Directus API uses _Database Mirroring_ to dynamically generate REST endpoints and a GraphQL schema based on the
connected database's architecture. It is written in [Node.js](https://nodejs.dev) and uses database abstraction to
support most [SQL database vendors](/guides/installation/cli/#_1-confirm-minimum-requirements).

#### Relevant Docs

- [API Reference](/reference/api/introduction/)
- [API Extensions](/concepts/extensions/#api-extensions)

## Database Abstraction

Directus supports mirroring all the most SQL databases. There are many different SQL database vendors, including popular
choices such as MySQL, PostgreSQL, and SQLite. Each vendor has subtle (and sometimes not so subtle) differences in how
they function, so Directus includes an abstraction layer that helps it avoid writing different code for each different
type.

This means there is the possiblility of supporting other datastores in the future, such as NoSQL options like MongoDB,
or even third-party data services like Firebase or Heroku. However these options are _fundamentally_ different from the
relational SQL databases we currently support, and so more research is needed.
