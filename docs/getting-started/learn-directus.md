# Learn Directus

> This page provides a clear mental map of the various Directus learning resources available, how they are written, _and
> who they written for_ so community members know how to find answers quickly and efficiently.

:::tip Before you Begin

If you are brand new to Directus, you should [watch the crashcourse](https://www.youtube.com/watch?v=AicEmIeuuLw), which
will give you a broad understanding of what the platform is and what it can do.

:::

First off, every resource starts with a **Before you Begin** as seen above, which will provide links to other Directus
learning resources that you may need to read in order to understand the current resource.

## User Personas

Each user persona listed below has a different assumed level of technical knowledge. Each guide, tutorial, video, or
piece of documentation was written to suit one of the following user personas.

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
to the Directus Project via the SDK, APIs, and webhooks. They also have broad knowledge of relational database design and
at least foundational understanding of cloud some solution(s) like AWS, Docker, etc.

For this persona, the Directus platform code and architecture is mostly a black-box. They are primarily concerned with
the App, APIs, SDK, and configuration options relevant to their project.

**Contributors**\
Software Engineers who have the skill and desire to understand the platform architecture well enough to modify, expand and
make open source contributions to the source code. These users are proficient in Node.js and Vue.js, as well as everything
in the **Admins and Developers** persona.

## Documentation Structure

Documentation is an essential learning resource for most software systems out there. Directus has a unique challenge: it
is a platform that provides data access for the whole team. That means its documentation has to account for readers with
drastically different levels of technical knowledge.

Next, let's discuss the documentation sections in the navbar to the left. They were written to suit the knowledge level
Target Personas as best as possible. Information gets more technical with each subsequent section:

- [Getting Started]()\
  This section is written for all users, providing a broad but strong introduction to the platform. The more technical features
  are described in the simplest, most conceptual language possible. New community members will learn what Directus is and
  where to go to hunt down the answers they need to start using the platform.

- [App Guide]()\
  This section explains how to use the Directus App. It is written to suit the knowledge level of **Business Users**, but
  with one catch: it explains the app from the perspective of an Administrator Role. This means all features and functionality
  of the Directus App are covered in full detail. In practice however, most Business Users will be assigned a Role with limited
  access permissions. That means these Users will not be able to see or do every single thing shown in the App Guide. What
  a User can see and do is determined explicitly by their Role, which is configured by the Administrator. To Learn more,
  see [Users, Roles and Permissions](#users-roles-and-permissions).

- [Configuration]()\
  This section explains how to use the Settings Module, which is only accessible by Administrators because it provides control
  over your database as well as other advanced configuration options best left in the hands of "project owners". The Settings
  Module provides no-code configuration and Administration of your Directus Project, therefore the language may seem understandable
  to Business Users. However, in reality, this section includes no-code configuration of the data model, Webhooks, Data Flows,
  and custom over-riding Project CSS. So it is really best fit for the **Admins and Developers** or **Analysts and Data Scientists**.

- [API Reference]()\
  This is for **Admins and Developers** as well as **Analysts and Data Scientists** that wish plan to programmatically run
  data queries, link Directus to frontend(s) and service(s), as well as manage any data models, data, and digital assets
  programmatically via the APIs, CLI, and SDK. This section is written to suit **Admins and Developers**.

- [Extensions]()\
  This section describes how to go about integrating your own custom code into the Directus platform. It is written to suit
  **Contributors**.

- [Contributing]()\
  This section describes technical and community requirements to fix bugs and make other PRs on the official Directus Core
  GitHub repo. It is written to suit **Contributors**.

- [Directus Cloud]()\
  This section discusses everything Directus Cloud has to offer. The language (just like the cloud itself) is easy enough
  for all **Business Users** _(like your boss or clients)_ to jump in and use.

- [Self Hosted]()\
  This section describes how to install Directus in a self-hosted environment. It is written to suit **Admins and Developers**.

## Users, Roles, and Permissions

<!-- Video demonstrating 2 Roles -->

This concept will be the biggest point to pay attention to for new Users from every user persona. Any time you want to
create, view, edit, or delete data or content from Directus, this must be done by a User. Each User must have a Role.
This Role defines the User's data access permissions. In other words, data content and functionalities may be limited,
disabled, unusable, or un-viewable for a User, based on their Role. To learn more about this, see
[Users, Roles and permissions](/configuration/users-roles-permissions).

<!--
@TODO Incorporate Guides, tutorials, videos, etc.
-->
