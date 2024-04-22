---
description: Cloud Projects are individual instances of Directus, managed within a Team.
readTime: 8 min read
---

# Cloud Projects

> Cloud Projects are individual instances of Directus, managed within a Team. Professional and Enterprise tier Projects
> are available, with each offering different options for infrastructure, configuration and professional services. A
> Cloud Project is a Directus Instance, the [Infrastructure](/user-guide/cloud/glossary#infrastructure) it runs on, and
> all of its [data and file assets](/user-guide/cloud/glossary#asset-storage). All Cloud Projects include all
> [Cloud Exclusives](/user-guide/cloud/glossary#cloud-exclusives). See
> [Support Options](/user-guide/cloud/glossary#support-options) to find out how to get help on your Project.

There are two different Project tiers on Directus Cloud: [Professional](#create-a-professional-project) and
[Enterprise](#create-an-enterprise-project). A side-by-side comparison of what's included in each tier can be found on
the [Pricing page](https://directus.io/pricing).

See the [Overview](/user-guide/cloud/overview) to learn how Accounts, Teams and Projects interrelate.

## View a Team's Projects

All of a Team's Projects are listed on the Projects Page. For each Project, the following information and shortcuts are
provided. On Project creation, the provisioning progress will be displayed until fully complete. The icon on the far
left indicates whether it's online or [offline](/user-guide/cloud/glossary#system-status). Next to that icon are the
Project Name and Project Slug. On the right, you'll see the Project tier, followed by shortcuts, which allow you to
<span mi icon>edit</span> update and <span mi icon>launch</span> access the Project. To view a Team's Projects:

1. Open the Team Menu in the Dashboard Header and select the desired Team.
2. Click **"Projects"**.

## Create a Professional Project

The Professional tier is perfect for most production-ready use cases. Professional tier Projects come with custom URLs,
daily [backups](/user-guide/cloud/glossary#backups) and the recommended infrastructure for most projects. as needed.

Professional Projects come with the following configuration options:

- **Project Name** — Custom. This can be changed at any time.
- **Project URL** — Custom URL: `your-custom-url.directus.app`. _This cannot be changed_.
- [Datacenter Region](/user-guide/cloud/glossary#datacenter-regions) — `United States, East`, `Europe, Frankfurt` or
  `Asia Pacific, Singapore`.

To create a Professional Project:

1. Open the Team Menu in the Dashboard Header and select the desired Team.
2. Click **"Projects"**.
3. Click the Team you wish to create a Project under.
4. Click **"Create Project"**.
5. Set the Project Name as desired.
6. Select the Professional tier.
7. Set the configuration options as desired.
8. Click **"Proceed to Checkout"**. You will be taken to a checkout page.
9. Enter payment information and hit **"Subscribe"**.

::: tip Enterprise Tier

Need even more power, scale, customization and support?\
Upgrade to an [Enterprise Project](#create-an-enterprise-project).

:::

## Create an Enterprise Project

Enterprise tier offers power and scale to meet any Project's needs and offers 19
[Datacenter regions](/user-guide/cloud/glossary#datacenter-regions), upgraded
[support options](/user-guide/cloud/glossary#support-options), and much more.

::: tip Ready to go Enterprise?

[Contact Sales](https://directus.io/contact)

:::

## Access a Project

At some point, you will want to log in and access the actual managed Project. You can go the Project's URL directly, or
you can access it from within the Cloud Dashboard two different ways. To access a Project from the Cloud Dashboard:

1. Open the Team Menu in the Dashboard Header and click the desired Team.
2. Click **"Projects"** to enter the Projects page.\
   From here, there are two ways to access a Project:

#### From the Projects Page

3. Click <span mi icon>launch</span> on the desired Project. Your Project login page will open in a new tab.

#### From Project Monitor Page

3. Click a Project to enter its Project Monitor page.
4. Click **"Open Project"**. Your Project login page will open in a new tab.

## Monitor a Project

<video alt="Project Monitor Page" loop muted controls autoplay playsinline>
  <source src="https://cdn.directus.io/docs/v9/cloud/glossary/glossary-20220322A/monitor-a-project-20220322A.mp4" type="video/mp4">
</video>

Graphs on the Project Monitor page display daily Project information over the last month.

- **Combined Node Usage**\
  Total load placed on all Nodes. If CPU or memory are overloaded, the Nodes could crash! High usage is a sign that it's
  time to scale up.

- **API Requests**\
  Number of API requests. This provides basic insight into traffic cycles, including overall volatility.

- **API Bandwidth**\
  The read/write bandwidth of all requests.

To access the Project Monitor Page:

1. Open the Team Menu in the Dashboard Header and click the desired Team.
2. Click **"Projects"** to enter the Projects page.
3. Click the Project to enter the Project Monitor page.

## Manage a Professional Project

On Professional Projects, it's possible to change the Project Name.

1. Open the Team Menu in the Dashboard Header and click the desired Team.
2. Click **"Projects"** to enter the Projects page.
3. Click the Project to enter the Project Monitor page.
4. Click **"Edit"** to enter the Project Details page.
5. Make changes as desired.
6. Click **"Update Project"**.

## Manage an Enterprise Project

Each Enterprise Project is customized, so it can't be managed from the Cloud Dashboard. The Project will be managed in
tandem with the Directus Core Team.

::: tip Ready to go Enterprise?

[Contact Sales](https://directus.io/contact)

:::

## Destroy a Project

Destroying a Directus Cloud Project completely removes all its data, assets, settings and users from the platform. It
also cancels the Directus Cloud Subscription associated with the project. To destroy a Directus Cloud Project, follow
these steps:

1. Open the Team Menu in the Dashboard Header and click the desired Team.
2. Click **"Projects"** to enter the Projects page.
3. Click the Project you wish to delete.
4. Click **"Edit"** to enter the Project Details page.
5. Scroll to the bottom of the page and toggle <span mi icon dngr>local_fire_department</span>.
6. Type in the Project Name.
7. Click **"Destroy Project"**.

::: tip

This action will break any external apps connecting to the Project's API or linking to Project files, and is permanent
and irreversible. **Directus Cloud is not responsible for data or files lost due to this action!**

:::
