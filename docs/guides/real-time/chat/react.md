# Build a Multi-User Chat With React.js

In this guide, you will build a multi-user chat application with Directus’ WebSockets interface that authenticates users
with an existing account, shows historical messages stored in Directus, allows users to send new messages, and
immediately updates all connected chats.

## Before You Start

### Set Up Your Directus Project

You will need a Directus project. If you don’t already have one, the easiest way to get started is with our
[managed Directus Cloud service](https://directus.cloud).

Create a new collection called `Messages`, with `date_created` and `user_created` fields enabled in the _Optional System
Fields_ pane on collection creation. Create a text field called `text`.

Create a new Role called `Users`. Give Create and Read access to the `Messages` collection, and Read access to the
`Directus Users` system collection. Now, create a new user with this role and take note of the password you set.
