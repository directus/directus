# Learn Directus

<!--

Documentation is often "not self-aware"
This frustrates readers, increases time to troubleshoot answers, and pushes many away


-->

Documentation is an essential learning resource for most software systems out there. Directus has a unique challenge: it
is a platform that provides data access for the whole team. That means its documentation has to account for readers with
drastically different levels of technical knowledge. This page provides a clear mental map of how the documentation is
written _and who it is written for_ so readers to know what to expect and also know how to find answers efficiently.

:::tip Before you Begin

If you are brand new to Directus, you should [watch the crashcourse](https://www.youtube.com/watch?v=AicEmIeuuLw), which
will give you a broad understanding of what the platform is and what it can do.

:::

## User Personas

Each section of the documentation was written with the following user personas in mind.

**Business Users**\
Anybody who will use the Directus no-code App, even those with the lowest technical knowledge. Your Project may include accountants,
data analysts, blog post writers, high-level managers, or even customers that have little to no understanding of web development
technology.

**Analysts and Data Scientists**\
Anybody with SQL, excel or other analytics skills, and no assumed knowledge of web development. A pretty substantial number
of tools are provided for this persona, including drag-and-drop analytics dashboards and file-based data import/export. They
know their way around the data model, but are not responsible for building and maintaining it.

**Admins and Developers**\
Web Developers who "own" a Directus Project. They configure Data Models and other Settings; configure caching, storage adapters
and other environmental variables; manage Users, Roles, and Permissions; and link any front-end(s) or external service(s)
to the Directus Project via the SDK, APIs, and webhooks.

For this persona, the Directus platform code and architecture is mostly a black-box. They are primarily concerned with
the App, APIs, SDK, and configuration options relevant to their project.

**Contributors**\
Software Engineers that can understand the platform architecture well enough to modify, expand and make open source contributions
to the source code.

## Documentation Structure

Next, let's discuss at the sections in the navbar to the left. It is written to suit the Target Personas mentioned above
and information gets progressively more technical with each section:

- [Getting Started]()\
  A broad but strong introduction to the platform, written for all users. This focuses on what Dircetus is and where to go
  to hunt down the answers you need.

- [App Guide]()\
  This section explains how to use the no-code App. It is written for Business Users, but with one catch: it explains the
  app from the perspective of an Administrator Role to ensure all features and functionality are covered in full detail.
  In practice however, want most Business Users to have limited access permissions. That means these Users may not be able
  to do everything shown in the App Guide, what a User can see and do is determined explicitly by the Administrator. To Learn
  more, see [Users, Roles and Permissions](#users-roles-and-permissions)

- [Configuration]()\
  Documentation to the Settings Module, which is only accessible by Administrators, due to the fact that it provides control
  over your database. To Learn more, see [Users, Roles and Permissions](#users-roles-and-permissions).

- [API Reference]()\
  This is for [Admins and Developers](#user-personas) as well as [Analysts and Data Scientists](#user-personas) that wish
  plan to programmatically run data queries, link Directus to frontends and services, as well as manage any data models,
  data, and digital assets programmatically via the APIs, CLI, and SDK.

- [Extensions]()\

- [Contributing]() —

- [Directus Cloud]() —

- [Self Hosted]() —

## Users, Roles, and Permissions

<!-- Video demonstrating 2 roles -->

This concept will be the biggest point to pay attention to for new Users from every user persona. Any time you want to
create, view, edit, or delete data or content from Directus, this must be done by a User. Each User must have a Role.
This Role defines the User's data access permissions. In other words, data content and functionalities may be limited,
disabled, unusable, or un-viewable for a User, based on their Role. To learn more about this, see
[Users, Roles and permissions](/configuration/users-roles-permissions).
