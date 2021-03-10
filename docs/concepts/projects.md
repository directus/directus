# Projects

> A Project is a complete instance of Directus. Each project represents a **Database**, but also encapsulates a config
> file, asset storage, and any custom extensions.

Projects are the highest level of structure in Directus. While there are many customizable facets to a Project, you can
essentially think of them as individual [Databases](concepts/databases/).

#### Relevant Guides

- [Creating a Project](/guides/projects/#creating-a-project)
- [Configuring a Project](/guides/projects/#configuring-a-project)
- [Adjusting Project Settings](/guides/projects/#adjusting-project-settings)
- [Upgrading a Project](/guides/projects/#upgrading-a-project)
- [Backing-up a Project](/guides/projects/#backing-up-a-project)
- [Migrating a Project](/guides/projects/#migrating-a-project)
- [Deleting a Project](/guides/projects/#configuring-a-project)

## Environments

This compartmentalized approach means you can also create different Environments (eg: Dev, Staging, Prod) simply by
creating additional Project instances. In short, there is no difference between a Project and an Environment.

#### Relevant Guides

- [Migrating a Project](/guides/projects/#migrating-a-project)

## Multitenancy

Previous versions of Directus allowed managing multiple databases within a single installation. However this because
overly complex in the scoping of routes, API endpoints, and custom code. In Directus 9+, to create multitenancy you have
several options:

- **Project Scoping** — Creating a super-admin layer that provisions new tenant projects has been made easier by the
  Cloud-native model of Directus 9+. This method involves developing custom code that can dynamically spin up/down
  projects, but is also the most flexible, supporting scoped extensions and differentiated project settings.
- **Role Scoping** — In this method, you create one Role per tenant, and configure their permissions to properly scope
  them within a single project. This direction allows for tenants to share a single schema using _item_ scoped
  permissions, or different schemas by using _collection_ scoped permissions.
