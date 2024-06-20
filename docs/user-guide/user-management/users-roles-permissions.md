---
description:
  Users are the individual accounts for authenticating into the API and App. Each user belongs to a Role which defines
  its policies and access Permissions.
readTime: 7 min read
---

# Key User Management Concepts

> Users, roles, policies, and permissions work together to determine _who can access what_ inside your database.
> [Users](/user-guide/overview/glossary#users) are the individual accounts for authenticating into the project. Each
> user is assigned a [role](/user-guide/overview/glossary#roles) and [policies](/user-guide/overview/glossary#policies)
> which defines its [access permissions](/user-guide/overview/glossary#permissions).

::: tip Before You Begin

We recommend you try the [Quickstart Guide](/getting-started/quickstart) to get an overview of the platform.

:::

::: tip Learn More

To manage user roles and access policies programmatically via the API, please see our API guides on
[users](/reference/system/users), [roles](/reference/system/roles), [policies](/reference/system/policies), and
[permissions](/reference/system/permissions).

:::

In order to understand how users, roles, and permissions work in Directus, a conceptual understanding of _how they work
in general_ will be helpful. The following few paragraphs will introduce you to how users, roles, policies, and
permissions work within a relational database. If you're already familiar with these concepts, feel free to skip to
[How it Works in Directus](#how-it-works-in-directus).

### Users

Remember, [users are data](/reference/system/users). They are simply rows in a `users` data table. It may be easy to
forget this if you are new to working with data models, as the term _users_ can create a warm place in our hearts which
distinguishes or elevates it above and beyond term _"data"_. But from the perspective of the data model, that's not the
case. Users are still just data.

Projects typically have many different kinds of users. For example, you'll need developers and administrators to design
the data model as well as manage all its data. Your team may have other users, such as data analysts, content writers,
or managers who need to access to some sensitive data, but not the entire data model. Finally, you might have end-users,
such as customers, subscribers, 3rd party sellers, _and beyond_ who need access to their own personal data, but should
not be able to access any other business data. Therefore, we need to be able to create permissions to define what a user
can and can't access.

::: tip

Another key point is that a user _does not need to be a person at all_. A user could be an AI bot, chat bot, API, or any
other entity that can login and interact with the database.

:::

### Roles

Roles are an organizational unit and describe who your users are. For example, a member of the Engineering Team, or the
Marketing Team.

Regardless of your project, your SQL database will _always_ need an administrator role and a public role. In addition,
you may need any number of custom roles.

**Administrators**\
An administrator role provides complete, unrestricted control over the database, including the data model and all it data.
This cannot be limited, as by definition it would no longer be an administrator role. You need at least one user in an administrator
role. Otherwise, it would be impossible to fully manage the database.

**Public**\
A public role defines access permissions for unauthenticated requests to the database. That means that if you enable an access
permission for this role, _everybody has that permission enabled_. Remember, the database has no idea which data you'd want
the public to see. So to be safe, all permissions begin turned off by default. It is up to the administrators to re-configure
these and define exactly what the public role has access to.

**Custom Roles**\
In addition to these two extreme types of roles, you may need to create more roles each with their own unique set of policies.

### Policies

In many cases, your project will have multiple users doing the same thing _(managers, writers, subscribers, etc)_. If we
assigned permissions directly to the user, we would have to configure the same permissions over and over, which makes it
tedious to change configurations for all users doing the same job and also leads to a higher chance of misconfiguration.
This problem is an example of [data duplication](/app/data-model#avoid-data-duplication). To avoid this, we create
policies, configure the permissions once, then assign the policies to users or roles as desired.

### Permissions

Remember, for the majority of projects, it wouldn't be safe or ethical to give every user full access to the data. Users
could accidentally damage data or even take malicious actions against the project and its users. For example, a student
may need to be able to _see their grade, but not be able to change it_.

Thus, there are four types of permissions for each data table, based on the four CRUD actions you can do to data in a
database: _create, read, update, and delete_... Hence you often hear the term CRUD permissions. You can configure CRUD
permissions on each data table as desired. For example, you can grant:

- read-only permission
- read and write but not update or delete permissions
- _any other combination of the four_

## Directus Permissions

![Permissions in the Directus Data Studio](https://marketing.directus.app/assets/55212af7-8c48-44f7-81fe-6ee4f00f1de2.png)

Directus offers an extremely granular, yet easy to configure permissions system. When you create a policy, all
permissions are turned off by default, allowing you to explicitly grant permissions as desired.

There are two other key points to note about Directus. First, the term custom access permissions is used in place of
business rules, however the concept is the same. Second, instead of the standard CRUD permissions, Directus provides
CRUDS permissions: _create, read, update, delete, and share_. This _fifth_ type of permission, share, defines whether a
user has permissions to perform [data sharing](/user-guide/content-module/content/shares) on items in a collection.
