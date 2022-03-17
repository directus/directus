# Project Options

[[toc]]

## Accounts

Accounts are the term for your super-administrator Cloud Dashboard Profile, used to create and join Teams, pay bills,
and manage Projects. See the [Overview](#cloud/overview) to learn how Accounts, Teams and Projects inter-relate. Read
the [Accounts documentation](/cloud/accounts) to learn how to manage Accounts.

:::tip Accounts vs Users

To avoid confusion, "User" is the term for user profiles inside a Directus Project. The terms Account and Team Member
are used on the context of Directus Cloud login. Accounts made on the Cloud Dashboard and the Users created within a
Directus Project are two separate systems.

:::

## Asset Storage

Directus Core allows file uploads/downloads for any type of file. This applies on all Cloud Projects. However, on
Directus Cloud, certain technical limits apply to file uploads such as limits on size per asset and total asset storage
per Project. For all limitation details, see [Cloud Policies](https://directus.io/cloud-policies/#).

Asset Storage space varies by Project Tier. For details, see [Cloud Policies](https://directus.io/cloud-policies/#).

## Automatic Software Updates

Software updates can be a time-consuming chore, taking developer energy and focus away from core business logic. Cloud
Projects are updated every two weeks in rolling releases _(i.e. done with no downtime)_. These updates keep your Project
on the latest version and fully up-to-date with all Cloud Exclusives, dependencies, and security patches.

::: tip Version-locking

Version-locking is available on Enterprise Projects.

:::

## Auto-Scaling

Auto-scaling refers to the practice of activating Standby Nodes during times of spiked web traffic. For more
information, see [Nodes](#nodes).

- move explanation from nodes into auto-scaling.

## Backups

By default, Standard and Enterprise Project data is backed up once per day, but the frequency can be configured as
needed on Enterprise Projects. In the event of an emergency, your data will be safe.

## Billing

Community Projects are free. Each Enterprise Project is custom-tailored and so is the bill.

Standard Project billing is based on the total number of hours that all Active and Standby nodes were utilized during
the billing period. All usage is measured on a calendar monthly basis, with usage reset on the first day of each new
billing period. For example, if you signed up on the 15th, your usage period is set to be from 15th of this month to the
14th of the following month.

Billing works such that you can upgrade, downgrade, modify or cancel your Project anytime. At the end of the day, no
matter what, you only pay for what was used.

### Node Pricing Details

:::tip Pricing

**General Purpose Nodes:** $0.03424657534 / hour

**Performance Nodes:** $0.06849315068 / hour

:::

Once the [Node Type](#nodes) is selected, the associated hourly rate will apply to both Active and Standby Nodes. Note
that Active Nodes are shown as a monthly rate _(General Purpose being $25/month and Performance are $50/month)_.
However, this "flat monthly rate" is actually just the hourly rate for the Node Type multiplied by 730 hours
`$0.03424657534 x 730hrs = $24.99999`

The following four examples demonstrate how billing works:

### Hourly Pricing

A Project is configured to use General Purpose Nodes, with 1 Active Node and 0 Standby Nodes. The Project runs for 3
days 3.5 hours (75.5 hours total, rounds to 76 hours) and is then destroyed.

The bill will be `$0.03424657534 x 76 hours = $2.60` plus Tax/VAT.

### Active Nodes

A Project is configured to use Performance Tier Nodes, with 2 Active Nodes and 0 Standby Nodes. The Project runs the
full month (730 hours) and the fee for 2 Nodes at $50/month will be
`2 Nodes x $0.06849315068 per hour x 730 hours = $99.99999` which of course rounds up to $100.

The monthly bill will be `$100` plus Tax/VAT.

### Overages on Standby Nodes

A Project is configured to use General Purpose Nodes, with 3 Active Nodes and 2 Standby Nodes. The Project runs the full
month (730 hours). There are two traffic spikes. The first spike is smaller and activates 1 Standby Node for 6.5 hours.
The second spike is larger but gradual and activates the first Node from 4pm to 12am (8 hours) then the second Node from
6pm to 11pm (5 hours) for a total of `8 + 5 = 13` hours. Between both spikes, Standby Nodes run for a total of 19.5
hours (rounds to 20 hrs). The Active Nodes will cost `3 Nodes x $0.03424657534 per hour x 730 hours = $75` and Standby
Nodes will cost `20hrs x $0.03424657534 = $0.68`.

The monthly bill will be `$75.68` plus VAT/Tax.

### Pro-rated Changes

A Project begins the billing cycle configured to use General Purpose Nodes, 1 Active and 0 Standby.

A massive traffic spike is expected from marketing activities this month and 200 hours into the month, the Project is
reconfigured to use 2 Performance Tier Nodes and 5 Standby Nodes. In the end, Standby Nodes were not needed and never
activated. The portion of the bill before reconfiguration will be
`(1 general purpose node x $0.03424657534 x 200hrs) = $6.849` and then adding in reconfigured costs
`(2 Performance Nodes x $0.06849315068 per hour x 530 hours) = 72.60`.

The monthly bill will be `$79.45` plus VAT/Tax.

### How to Determine Required Nodes

As stated in the beginning of this section and as shown by the examples above, you are never locked-in to a specific
node configuration. So, to help inform decisions on ideal Node configurations for your Project, the
[Project Monitor Page](/cloud/projects/#monitor-a-project) provides performance analytics.

### Manage Billing Info

To manage payment methods and other billing details, see [Manage Billing](/cloud/teams/#manage-billing).

### Refunds

For information on refunds, see [Cloud Policies](https://directus.io/cloud-policies/).

## Caching

Caching is enabled on Cloud Projects. Public data is cached in the CDN for short period of time. The of whole Directus
is running behind the [Global CDN](#global-cdn). Enterprise Projects offer other advanced caching strategies.

## Cloud Exclusives

These are [Extensions](#extensions) to Directus Core which provide extra functionality _(such as the Kanban Layout for
project management)_. Directus is completely open-source and free to use, so anyone can create their own custom
Extensions on self-managed Projects, however custom Extensions are not supported by the Core Team and may not work as
newer Versions are released. Cloud Exclusive development is managed by the Core Team.

## Community Support

As an open-source Project, you are encouraged to reach out to the Community for help on Projects, _and of course help
others as well_. To join the thousands of other developers all discussing and guiding the future of the Directus
platform, the two primary channels to engage with the community would be
[Github](https://github.com/directus/directus/discussions) and [Discord](https://directus.chat/).

Most common questions have already been asked and answered and can easily be found in Github Discussions and Issues.
Note that while the Directus Core Team plays an active and engaged role in community discussions, there is no guaranteed
turnaround time on official answers.

## Data Portability

Directus Core is totally detached from the database itself. Data can be cleanly imported and exported on Projects with
the API via the schema endpoints. For Enterprise clients, the Directus team will work with you to help you with this
process.

## Data Processing

In order to optimize your project and you help meet any local data compliance laws such as GDPR, Standard and Enterprise
Projects allows you to choose the region your Project is hosted in.

## Encryption and Security

[Asset Storage](#asset-storage), data storage and in-transit encryption is included on all Cloud Projects. All data at
rest remains encrypted. HTTPS/TLS protocols are enabled on all in-transit data.

:::tip Directus Core Security Features

-> whitelabeling IP, 2FA, Password Rules - prjct settings, Access Tokens

:::

## Extensions

Directus has been architected to be [completely modular and extensible](/extensions/introduction). This ensures you will
never hit a hard feature ceiling within the platform.

However, in order to maintain automatic software updates as new versions of Directus are released, it is not possible to
make sure all future versions of Directus are compatible with all Extensions. For this reason, Community and Standard
Projects only have access to the officially supported and maintained [Cloud Exclusive Extensions](#cloud-exclusives)
managed by the Core Team. Enterprise Projects get all Cloud Exclusives and also have the option to implement any other
Extensions as needed.

## Global CDN

A Global CDN is provided on all Cloud Projects, out-of-the-box, with over 300 cache locations, which means assets and
data will be delivered with the lowest latency.

## Inactivity

If there is no user app activity for 3 days on a Community Project, the [Infrastructure](#infrastructure) is paused.
Projects which remain paused for a certain duration will be automatically deleted, see details in
[Cloud Policies](https://directus.io/cloud-policies/#). To avoid deletion, you must manually
[resume the Project](/cloud/projects/#resume-paused-project) within the Cloud Dashboard. App activity/requests will not
resume the Project.

## Infrastructure

In the context of these docs, Infrastructure refers to the hard and soft tech specs to the equipment running your
Directus Project. This includes the database (and database tenancy), chosen [Node Type](#nodes), data storage region,
rate limiting, etc.

Infrastructure configuration options differ by Project Tier. Refer to [Projects](#project) as well as the Infrastructure
section on the [pricing page](https://directus.io/pricing/) for side-by-side comparison between Tiers.

## Load Balancing

Load balancing allows you to configure the minimum number of [Active Nodes](#nodes) your Project is running, so as to
instantaneously distribute load across multiple servers. This is essentially the same concept as Horizontal Scaling.
Note that the total number of Active Nodes can be changed at any time _(see
[Manage a Project](/cloud/projects/#manage-a-project))._

:::tip Configure Load Balancing

The [Project Monitor Page](/cloud/projects/#monitor-a-project) provides analytics on Node performance to help inform
configuration decisions. As noted under [Billing](#billing), Projects can be reconfigured at anytime.

:::

## Nodes

Nodes can be configured to meet traffic needs at any scale. There are two approaches to scale-up Project performance,
vertical-scaling and horizontal-scaling. Vertical-scaling is the concept of increasing Node processing power to improve
performance. In Directus Cloud, vertical-scaling is handled by configuring the Node Type. Horizontal-scaling is the
concept of increasing performance by adding more nodes to handle incoming requests. In Directus Cloud,
horizontal-scaling is handled by setting the number of Active and Standby Nodes.

### Node Type

As stated above, the Node Type refers to its configured processing power. Vertical Scaling is the concept of improving
scalabiltiy by increasing Node processing power. Directus Cloud offers several Node Types to help your Project scale.

- **Community**\
  Community Projects come equipped with one Node, which can handle basic web traffic required for hobby-projects, learning/demoing
  Directus Cloud, and other non-production use cases. Community Nodes will pause after 3 days of [inactivity](#inactivity).

- **General Purpose**\
  General Purpose Nodes are the right choice for most small-to-medium scale, production-ready use-cases.

- **Performance Tier**\
  Performance Tier Nodes provide higher processing power and may need to be implemented on Projects which will have requests
  for larger files or data sets.

- **Enterprise**\
  Enterprise Node configuration options are totally flexible.

### Active Nodes

## Standby Nodes (Auto-scaling)

Standby Nodes stay turned-off and provide

These two options set the number of Nodes available to take requests, _known as [Load Balancing](#load-balancing) as
well as horizontal scaling_. Active Nodes are always on and available to handle incoming requests, regardless of
traffic.

Standby Nodes nodes are nodes that simply stay turned off until needed. At times when traffic spikes high, and (if any
are configured) will activate within a few minutes, one-by-one, until capacity drops sufficiently low and safe. Standby
Nodes do add variability to Project costs, but you are only charged for Nodes when they are needed and there is no
premium price on Standby Node versus Active Nodes. For more pricing information, see [Billing](#billing).

- general node info

* hierarchcy
* Node
  - Node size/type/ vertical scaling - Node Type -> Community (frame it as less than GP), General Purpose or
    Performance, enterprise tier (totally flexible)
* Auto-scaling - horizontal
* Active vs Standby

---

Standby These nodes come online within a few minutes of hitting 80% capacity on Active Nodes, and you are only billed
for the hours that these nodes come online. When you select General Purpose or Performance Nodes, this choice applies to
both the Active and Standby nodes.

## Overages

Overages, in the context of the Directus Cloud, refer to fees generated when Standby Nodes are powered on during high
spikes in traffic/activity. To learn more, see [Nodes](#nodes), [Billing](#billing) and [Auto-scaling](#auto-scaling).

## Support Options

Premium Support, retainers for development, staff training sessions, guaranteed uptime, and other services. This is
offered on Enterprise Projects and terms are set case-by-case.

- all users = communtiy
- enterprise = defined in contract
- users who add-on support - contact sales for info.

Premium Support typically includes a private communication channel with team Engineers and guaranteed response time For
more information, see [Premium SLA](#premium-sla).

## Project

A Cloud Project is a Directus Instance along with its linked database and all other saved assets. See the
[Overview](#cloud/overview) to learn how Accounts, Teams and Projects inter-relate. Read the
[Projects documentation](/cloud/projects) to learn how to manage Projects.

There are 3 different Project Tiers on Directus Cloud. A side-by-side comparison of what is included in each Tier can be
found on the [Pricing Page](https://directus.io/pricing/). Here is a general overview:

### Community

The Community Tier offer a completely free Directus Project, perfect to spin-up hobby projects, demo Directus Cloud,
test a proof of concept or get started on any other non-production activity.

### Standard

The Standard Tier is perfect for most production-ready use cases, providing Projects with custom URLs, upgraded server
power and the configuration options:

- **Project URLs and/or Slug** — Customize URL slug _(if available of course)_.
- **Node Type** — Choose between [General Purpose and Performance Nodes](#nodes).
- **Load Balancing** — Select 1-6 [Active Nodes](#nodes) to run 24/7.
- **Auto-scaling** — Select 0-5 [Standby Nodes](#nodes) to run only during traffic spikes.
- **Datacenter Region** — Two choices: `United States, East` or `Europe, Frankfurt`.

### Enterprise

The Enterprise Tier provides power and scale to meet any Project's needs, along with [Premium SLAs](#premium-sla) and
advanced customization/configuration options:

- Custom-tailor Node Types, Load Balancing, and Auto-scaling to fit any need.
- Remote database access _(coming soon!)_.

## Rate Limiting

Rate limiting refers to technical limitations placed on Directus Cloud as well as Cloud Projects. This includes limits
on things like Project creation per hour and API requests per second per Project. For detailed information on these, as
well as other technical limits, please see [Cloud Policies](https://directus.io/cloud-policies/#).

## System Status

Click <span mi icon>check</span> in the Dashboard Header to check system status. This page displays the current
connectivity status of Directus Cloud, status on individual Projects by URL, as well as a daily Incidents log. This Page
is where to _find out what happened_ in the super rare event that the network slows down or goes down. For more
information, see [Cloud Policies](https://directus.io/cloud-policies/#).

![System Status](image.webp)

## Teams

In the Cloud Dashboard, a Team groups [Accounts](#accounts), giving them full access to the same [Projects](#projects).
See the [Overview](#cloud/overview) to learn how Accounts, Teams and Projects inter-relate. Read the
[Teams documentation](/cloud/teams) to learn how to manage Teams.

## Tenancy

Tenancy refers to how client data is stored in a database. In single-tenancy architecture, a database stores data from
only one tenant _(in the context of Directus Cloud, each Project represents a tenant). In multi-tenancy architecture, a
database stores data from multiple distinct Projects _(with mechanisms to protect data privacy)\_.

The database for Community projects is single-tenant but file-based and limited power db.

- Standard Projects use a multi-tenant architecture, resources shared across customers

- while Enterprise projects are single-tenant.
- Single tenant = you need Enterprise. dedicated to you. noe security concerns. 100% ur stuff.

- We run your Project as single-tenant. But you can implement multi-tennancy within your Project.

- each project in Cloud is scoped and there is no bleeding into other Proejcts. If your neighbor is busy, it will not
  impact your Project.

One container per Project. For std we share a database cluster. For Enterprise projects, as an added security measure,
are ran on fully separately.

## Quotas

Don't impose any _arbitrary_ limits on things like Collections, Roles or Users. Actual performance is based on the Nodes
configured, so there are hard technical Limits.

- ex: limited 100 Fields
- no functional quotas
- resources of Nodes and whatever you can do with that
- ::: tip Technical Limits
