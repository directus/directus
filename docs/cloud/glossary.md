# Project Options

[[toc]]

## Accounts

Accounts are the term for your SuperAdmin cloud dashboard profile, used to create and join Teams, pay bills, and manage
Projects. See the [Overview](/cloud/overview) to learn how Accounts, Teams and Projects inter-relate. Read the
[Accounts documentation](/cloud/accounts) to learn how to manage Accounts.

:::tip Accounts vs Users

To avoid confusion, "User" is the term for user profiles inside a Directus Project. The terms Account and Team Member
are used on the context of Directus Cloud login. Accounts made on the Cloud Dashboard and the Users created within a
Directus Project are two separate systems.

:::

## Asset Storage

Directus Core allows file uploads/downloads for any type of file. This applies on all Cloud Projects. However, on
Directus Cloud, certain technical limits apply to file uploads such as limits on size per asset and total asset storage
per Project. For all limitation details, see [Cloud Policies](https://directus.io/cloud-policies/#).

Asset Storage space varies by Project Tier. For details, see [Cloud Policies](https://directus.io/cloud-policies/).

## Automatic Software Updates

Software updates on any app can be a time-consuming chore, taking developer energy and focus away from core business
logic. Cloud Projects are updated every two weeks in rolling releases _(i.e. done with no downtime)_. These updates keep
your Project on the latest version and fully up-to-date with all [Cloud Exclusives](#cloud-exclusives), dependencies,
and security patches.

::: tip Version-locking

Version-locking is available on Enterprise Projects.

:::

## Backups

By default, Standard and Enterprise Project data is backed up once per day, but the frequency can be configured as
needed on Enterprise Projects. In the event of an emergency, your data will be safe.

## Billing

Community Projects are free. Each Enterprise Project is custom-tailored and so is the bill.

Standard Project billing is based on the total number of hours that all Active and Standby nodes were utilized during
the billing period. All usage is measured on a calendar monthly basis, with usage reset on the first day of each new
billing period. For example, if you signed up on the 15th, your usage period is set to be from the 15th of this month to
the 14th of the following month.

Billing works such that you can upgrade, downgrade, modify or destroy your Project anytime. Furthermore, no matter what,
_you only pay for the actual Node-hours used by your Project_.

### Node Pricing Details

:::tip Pricing

**General Purpose Nodes:** $0.03424657534 / hour

**Performance Nodes:** $0.06849315068 / hour

:::

Once the [Node Type](#nodes) is selected, the associated hourly rate will apply to both Active and Standby Nodes. Note
that while Active Nodes are priced at a monthly rate _(General Purpose being $25/month and Performance are $50/month)_,
this "flat monthly rate" is actually just the hourly rate for the Node Type multiplied by 730 hours
`$0.03424657534 x 730hrs = $25`.

**The following four examples demonstrate how billing works:**

### Hourly Pricing

A Project is configured to use General Purpose Nodes, with 1 Active Node and 0 Standby Nodes. The Project runs for 3
days 3.5 hours (75.5 hours total, rounds to 76 hours) and is then destroyed.

The bill will be `1 Node x $0.03424657534/hour x 76 hours = $2.60` plus Tax/VAT, billed at the moment of project
destruction.

### Active Nodes

A Project is configured to use Performance Tier Nodes, with 2 Active Nodes and 0 Standby Nodes. The Project runs the
full month (730 hours). Charges will run `2 Nodes x $0.06849315068/hour x 730 hours = $100`.

The monthly bill will be `$100` plus Tax/VAT.

### Overages on Standby Nodes

A Project is configured to use General Purpose Nodes, with 3 Active Nodes and 2 Standby Nodes. The Project runs the full
month (730 hours). There are 2 traffic spikes. The first spike is smaller and activates 1 Standby Node for 6.5 hours.
The second spike is larger but gradual and activates the first Node from 4pm to 12am (8 hours) then the second Node from
6pm to 11pm (5 hours) for a total of `8 + 5 = 13` hours. Between both spikes, Standby Nodes run for a total of 19.5
hours (rounds to 20 hrs). The Active Nodes will cost `3 Nodes x $0.03424657534/hour x 730 hours = $75.00` and Standby
Node overages will total `20 Node-hours x $0.03424657534/hour = $0.68`.

The monthly bill will be `$75.68` plus VAT/Tax.

### Pro-rated Changes

A Project begins the billing cycle configured to use General Purpose Nodes, 1 Active and 0 Standby.

A massive traffic spike is expected from marketing activities this month and 200 hours into the month, the Project is
reconfigured to use 2 Performance Tier Nodes and 5 Standby Nodes. In the end, Standby Nodes were not needed and never
activated. The portion of the bill before reconfiguration will be
`(1 General Purpose Node x $0.03424657534/hour x 200hrs) = $6.85` and then adding in reconfigured costs
`(2 Performance Nodes x $0.06849315068/hour x 530 hours) = 72.60`.

The monthly bill will be `$79.45` plus VAT/Tax.

### Optimize Node Configuration

As stated in the beginning of this section and as shown by the examples above, you are never locked-in to a specific
node configuration. As Project needs change, you are free to reconfigure capacity and scale up or down as needed _at the
click of a button_. However, you will need to monitor overall system traffic to make informed decisions on Node
configuration. The [Project Monitor Page](/cloud/projects/#monitor-a-project) provides performance analytics, which can
be used to help inform these decisions.

### Manage Billing Info

To manage payment methods and other billing details, see [Manage Billing](/cloud/teams/#manage-billing).

### Refunds

For information on refunds, see [Cloud Policies](https://directus.io/cloud-policies/).

## Caching

Caching is enabled on Cloud Projects. Public data is cached in the CDN for a short period of time. All Directus Cloud
Projects are running behind a [Global CDN](#global-cdn). Enterprise Projects offer other advanced caching strategies.

## Cloud Exclusives

These are [Extensions](#extensions) to Directus Core which are only available on Cloud Projects _(such as the Kanban
Layout for project management)_. Cloud Exclusive development is managed by the Core Team, so these will stay up-to-date
with the [latest version of Directus](#automatic-software-updates).

## Data Portability

Directus Core is totally detached from the database itself. Data can be cleanly imported and exported on Projects with
the API via the schema endpoints. For Enterprise clients, the Directus team will work with you to help you through this
process.

## Data Processing

In order to optimize your Project and help you meet any local data compliance laws such as GDPR, Standard and Enterprise
Projects allow you to choose the region your Project is hosted in.

## Encryption and Security

[Asset Storage](#asset-storage), data storage, and in-transit encryption are included on all Cloud Projects. All data at
rest remains encrypted. HTTPS/TLS protocols are enabled on all in-transit data. [Tenancy](#tenancy).

:::tip Directus Core Security Features

Directus core comes with some powerful security features out-of-the-box including IP address whitelabeling, 2FA
enabling, SSO options, customization for Password Rule requirements, and the freedom to use any Access Token paradigm
desired.

:::

## Extensions

Extensions refers to any feature or component that adds to the functionality of Directus Core. Directus has been
architected to be [completely modular and extensible](/extensions/introduction). This ensures you will never hit a hard
feature ceiling within the platform.

All Cloud Projects have access to the [Cloud Exclusive Extensions](#cloud-exclusives), which are developed and
maintained by the Core Team. Enterprise Projects get all Cloud Exclusives, but also have the option to implement their
own custom Extensions as needed.

## Global CDN

A Global CDN is provided on all Cloud Projects, out-of-the-box, with over 300 cache locations, which means assets and
data will be delivered with the lowest latency.

## Inactivity

If there is no app activity for 3 days on a Community Project, the [Infrastructure](#infrastructure) is paused. Projects
which remain paused for a certain duration will be automatically deleted, see details in
[Cloud Policies](https://directus.io/cloud-policies/#). To avoid deletion, you must manually
[resume the Project](/cloud/projects/#resume-paused-project) within the Cloud Dashboard. Once paued, app
activity/requests will not resume the Project.

## Infrastructure

In the context of these docs, Infrastructure refers to the hard and soft tech specs to the equipment running your
Directus Project. This includes the database (and database tenancy), chosen [Node Type](#nodes), data storage region,
rate limiting, etc.

Infrastructure configuration options differ by Project Tier. Refer to [Projects](#projects) as well as the
Infrastructure section on the [pricing page](https://directus.io/pricing/) for side-by-side comparison between Tiers.

## Nodes

Directus Cloud has options to choose the processing power of your Node as well as the number of Nodes your Project runs
on.

Nodes can be configured to meet traffic needs at any scale.

There are two approaches to scale-up Project performance, vertical-scaling and horizontal-scaling.

In Directus Cloud, vertical-scaling is handled by configuring the Node Type. Horizontal-scaling is the concept of
increasing performance by adding more nodes to handle incoming requests. In Directus Cloud, horizontal-scaling is
handled by setting the number of Active and Standby Nodes.

### Node Type

Node Types are divided by processing power. Increasing performance by increasing Node processing power is a concept
known as vertical scaling.

- **Community**\
  Community Projects come equipped with one Node, which can handle basic web traffic required for hobby-projects, learning/demoing
  Directus Cloud, and other non-production use cases. Community Nodes will pause after 3 days of [inactivity](#inactivity).

- **General Purpose**\
  General Purpose Nodes are the basic Node Type offered on Standard Projects. These Nodes are the right choice for most small-to-medium
  scale, production-ready use-cases.

- **Performance Tier**\
  Performance Tier Nodes are the upgraded Node Type offered on Standard Projects. These Nodes provide higher processing power
  and may need to be implemented on Projects under unique conditions _(for example a Project that has many requests larger
  files and data sets)_.

- **Enterprise**\
  Enterprise Node configuration options are totally flexible and customizable.

:::tip

In Standard Projects, the Node Type configured [and associated cost per hour](#billing) will apply to both Active and
Standby Nodes.

:::

### Active Nodes

Active Nodes stay on constantly. A Project must have at least 1 Active Node in order to run.

:::warning Inactivity

Community Nodes paused due to [inactivity](#inactivity) can't receive requests until unpaused.

:::

### Standby Nodes

Standby Nodes stay turned-off until traffic spikes start to use up system capacity, in which case Standby Nodes activate
one-by-one as needed to handle the traffic spike. Activation occurs within just a few moments.

Standby Nodes are not required and you do not pay when Standby Nodes are disabled. For more pricing information, see
[billing](#billing).

### Auto-scaling

Standby Nodes automatically activate and de-activate, scaling performance and power up and down based on traffic spikes
and system capacity, providing on-demand horizontal scaling. Thus, this is referred to as auto-scaling.

### Load Balancing and Horizontal Scaling

_Horizontal-scaling_ is the concept of using a greater number of Nodes to scale up. Load balancing refers to configured
minimum number of Active Nodes your Project is running, and the instantaneous distribution of load across these servers.
These are quite similar concepts, and in the context of Directus Cloud, they both simply refer to the number of Active
Nodes.

:::tip Configure Load Balancing

The [Project Monitor Page](/cloud/projects/#monitor-a-project) provides analytics on Node performance to help inform
decisions about Node configuration. As noted under [Billing](#billing), Projects can be reconfigured at anytime.

:::

## Projects

A Cloud Project is a Directus Instance along with its linked database and all other saved assets. All Cloud Projects
come [quota-free](#quotas) and include all [Cloud Exclusives](#cloud-exclusives).

Read the [Projects documentation](/cloud/projects) to learn how to manage Projects. See
[Support Options](#support-options) to find out how to get help on your Project.

There are 3 different Project Tiers on Directus Cloud. A side-by-side comparison of what is included in each Tier can be
found on the [Pricing Page](https://directus.io/pricing/). Here is a general overview:

### Community

The Community Tier is a completely free Directus Project, perfect to spin-up hobby projects, demo Directus Cloud, test a
proof of concept or get started on any other non-production activity.

- **Project URLs and/or Slug** — Random.
- **Node Type** — [Community Node](#nodes).
- **Load Balancing** — 1 [Active Node](#nodes).
- **Auto-scaling** — Not Available.
- **Datacenter Region** — Eastern USA.

### Standard

The Standard Tier is perfect for most production-ready use cases, providing Projects with custom URLs, upgraded server
power and the following configuration options:

- **Project URLs and/or Slug** — Customize URL slug _(if available of course)_.
- **Node Type** — Choose between [General Purpose and Performance Nodes](#nodes).
- **Load Balancing** — Select 1-6 [Active Nodes](#nodes) to run 24/7.
- **Auto-scaling** — Select 0-5 [Standby Nodes](#nodes) to run only during traffic spikes.
- **Datacenter Region** — Two choices: `United States, East` or `Europe, Frankfurt`.

### Enterprise

The Enterprise Tier provides power and scale to meet any Project's needs.

## Quotas

Directus does not impose _arbitrary_ software-based limits of any kind. So for things like Collections, Roles, or Users-
whether you have 1 or 10,000 you are free to do what you need. However, actual Project performance is going to depend on
Node configuration, so there are of course hard technical Limits. For more details, please refer to
[Cloud Policies](https://directus.io/cloud-policies/).

## Rate Limiting

Rate limiting refers to technical limitations within Directus Cloud as well as Cloud Projects. This includes limits on
things like API requests per second per Project. For detailed information, please see
[Cloud Policies](https://directus.io/cloud-policies/#).

## Support Options

There are two tiers of Support for Directus.

### Community Support

As an open-source Project, everyone is encouraged to reach out to the Community for help on Projects, _and of course
help others as well_. Find us on [Github](https://github.com/directus/directus/discussions) and
[Discord](https://directus.chat/) to join the thousands of other developers all discussing and guiding the future of the
Directus platform. Most common questions have already been asked and answered and can be easily searched.

:::tip No Guaranteed Response Time

While the Directus Core Team plays an active and engaged role in community discussions, aiming to answer questions
within a few days, there is no guaranteed response time for Community Support.

:::

### Premium Support

Premium Support could include retainers for development, staff training sessions, guaranteed uptime, and any other
common services. This is offered for Enterprise Projects and specific terms are set case-by-case, based on your Project
needs. Premium Support often includes a private communication channel with team Engineers and guaranteed response times.

:::tip Add-on Premium Support

Looking for Premium Support on a non-Enterprise Project? [Contact Sales](https://directus.io/contact/)

:::

## System Status

![System Status](image.webp)

Click <span mi icon>check</span> in the Dashboard Header to navigate to the System Status Page. This page displays the
current connectivity status of Directus Cloud, status on individual Projects by URL, and also provides a daily Incidents
log. This Page is where to _find out what happened_ in the super rare event that the network slows down or goes down.
For more information, see [Cloud Policies](https://directus.io/cloud-policies/#).

## Teams

In the Cloud Dashboard, a Team groups [Accounts](#accounts), giving them full access to the same [Projects](#projects).
See the [Overview](/cloud/overview) to learn how Accounts, Teams and Projects interrelate. Read the
[Teams documentation](/cloud/teams) to learn how to manage Teams.

## Tenancy

Tenancy refers to how client data is stored within a database. In the context of Directus Cloud, each Project represents
a tenant. In single-tenancy architecture, a database stores data from only one tenant. In multi-tenancy architecture, a
database stores data from multiple tenants, with mechanisms in place to protect data privacy.

Please note, this section is about how your Cloud Project is stored among other Projects and has nothing to do with how
you design your Project's data model. You can implement single or multi-tenant architecture within any Directus Cloud
Project.

### Community

Community project databases are technically single-tenant, but also file-based, and therefore limited on power.

### Standard

Standard Projects are created using multi-tenant architecture. However, each Standard Project is scoped- one container
per Project, with no bleeding into other Projects. If your neighbor's Project gets busy, it will not impact your
Project.

### Enterprise

Databases on Enterprise Projects are single-tenant, offering 100% isolation. No Neighbors.
