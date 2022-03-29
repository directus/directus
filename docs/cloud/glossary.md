# Glossary

[[toc]]

## Accounts

Your Account is your SuperAdmin Cloud Dashboard profile, used to create and join Teams, [pay bills](#billing), and
manage Projects. See the [Overview](/cloud/overview) to learn how Accounts, [Teams](#teams) and [Projects](#projects)
interrelate. [Learn More](/cloud/accounts) :::tip Accounts vs Users

To avoid confusion, "User" is the term for users in a Directus Project, while the terms "Account" and "Team Member" are
used in the context of Directus Cloud. Accounts on Directus Cloud and Users in a Directus Project are two separate
systems.

## Asset Storage

Directus Core allows asset storage for any type of file. This applies on all Cloud Projects. However, on Directus Cloud,
certain hard technical limits apply to file uploads such as limits on size per asset and total asset storage per
Project. For more details, see [Cloud Policies](https://directus.io/cloud-policies/#)

Asset Storage space varies by Project tier. For details, see [Cloud Policies](https://directus.io/cloud-policies/)

## Automatic Updates

Software updates on any app can be a time-consuming chore, taking developer energy and focus away from core business
logic. Cloud Projects are updated every two weeks in rolling releases _(i.e. done with no downtime)_. These updates keep
your Project on the latest version and fully up-to-date with all [Cloud Exclusives](#cloud-exclusives), dependencies,
and security patches.

::: tip Version-locking

Version-locking is available on Enterprise Projects.

:::

## Backups

By default, file assets and databases are backed up once per day on all Standard and Enterprise Projects. Additionally,
the frequency can be reconfigured as needed on Enterprise Projects. In the event of an emergency, such as your Node
crashing, your data will be safe. If you need access to backed-up data, [contact us](https://directus.io/contact/)

:::warning

Please note that Community Projects are not backed up.

:::

## Billing

Since our Community tier is completely free, and our Enterprise tier pricing is individually tailored based on customer
needs, this section will focus on our pay-as-you-go Standard tier.

### How Bills Are Calculated

[Project billing](/cloud/teams/#manage-billing) is calculated based on the total number of hours that Active and Standby
Nodes are utilized during the billing period. Once the [Node Type](#nodes) is selected, the associated hourly rate will
apply to both Active and Standby Nodes.

:::tip Node Pricing

**General Purpose:** $0.03424657534 / hour\
**Performance Tier:** $0.06849315068 / hour

:::

Note that this means the monthly prices given for Active Nodes, _$25/month for General Purpose and $50/month for
Performance tier_, are actually estimates based on the cost per hour times the average length of a month (730 hours).
So, the pricing shown for one Active, General Purpose Node is `$0.03424657534 x 730hrs = $25`, however the actual bill
will vary slightly each month.

Furthermore, a Standard Project's Nodes can be reconfigured at any time. You can upgrade and downgrade Node Types, add
and remove Nodes, or destroy your Project as you please. In the end, _you simply pay for the actual Node-hours used by
your Project_.

The following four examples demonstrate this billing system:

**Hourly Pricing**\
A Project is configured to use General Purpose Nodes, with one Active Node and zero Standby Nodes. The Project runs for 3
days and 3.5 hours (75.5 hours total, rounds to 76 hours) and is then destroyed, costing `1 Node x $0.03424657534/hour x 76 hours = $2.60`.

The bill will be `$2.60` plus Tax/VAT, charged at Project destruction.

**Active Nodes**\
A Project is configured to use Performance Tier Nodes, with two Active Nodes and zero Standby Nodes. The Project runs the
full month (730 hours). For this billing cycle, the two Active Nodes will cost `2 Nodes x $0.06849315068/hour x 730 hours = $100`.

The monthly bill will be `$100` plus Tax/VAT.

**Overages on Standby Nodes**\
A Project is configured to use General Purpose Nodes, with three Active Nodes and two Standby Nodes. The Project runs the
full month (730 hours). There are two traffic spikes. The first spike is smaller and only activates one Standby Node for
6.5 hours. The second spike is larger and activates the first Node from 4pm to 12am (eight hours), and the second Node from
6pm to 11pm (five hours), for a total of `8 + 5 = 13` hours. Between both spikes, Standby Nodes run for a total of 19.5 hours
(rounds to 20 hrs). Active Nodes will cost `3 Nodes x $0.03424657534/hour x 730 hours = $75.00` plus Standby Node overages
`20 Node-hours x $0.03424657534/hour = $0.68`.

The monthly bill will be `$75.68` plus VAT/Tax.

**Pro-rated Changes**\
A Project begins the billing cycle configured to use General Purpose Nodes, one Active and zero Standby. A massive traffic
spike is expected from marketing activities this month and 200 hours into the month, the Project is reconfigured. The Node
Type is now Performance Tier, and uses two Active Nodes and five Standby Nodes. In the end, the marketing event was a failure,
traffic was just slightly above average. The five Standby Nodes were not needed and never activated. The first 200 hours
cost `(1 General Purpose Node x $0.03424657534/hour x 200hrs) = $6.85`. The other 530 hours cost `(2 Performance Nodes x $0.06849315068/hour x 530 hours) = 72.60`.

The monthly bill will be `$79.45` plus VAT/Tax.

### Optimize Node Configuration

As stated in the beginning of this section and as shown by the examples above, _you are never locked-in to a specific
Node configuration_. As needs change on a Project, you are free to reconfigure Node Type as well as the number of Active
and Standby Nodes as needed. However, you may need to monitor overall system traffic to make informed decisions on Node
configuration. The [Project Monitor Page](/cloud/projects/#monitor-a-project) provides performance analytics, which can
be used to help identify and decide on optimal Node configuration for your Project.

:::warning Standby Nodes

For production-ready Projects of any kind, it is probably a good idea to have one or more Standby Nodes. These do not
activate and you do not pay until they are needed. Alternatively, as with any web app or site, if you do not have the
processing power to handle traffic spikes, it can crash your Nodes!

:::

## Caching

Caching is enabled on Cloud Projects. Public data is cached in the CDN for a short period of time. All Directus Cloud
Projects are running behind a [Global CDN](#global-cdn). Enterprise Projects offer other advanced caching strategies as
well.

## Cloud Exclusives

These are [Extensions](#extensions) to Directus Core which are only available on Cloud Projects _(such as the Kanban
Layout for project management)_. Cloud Exclusive development is managed by the Core Team, so these will stay up-to-date
with the [latest version of Directus](#automatic-updates).

## Data Portability

Directus Core is totally detached from the database. Data can be cleanly imported and exported on Projects with the API
via the schema endpoints. For Enterprise clients, the Directus Team will work with you to help you through this process.

## Data Processing

In order to optimize your Project and help you meet any local data compliance laws such as GDPR, Standard and Enterprise
Projects allow you to choose the region your Project is hosted in. There are 15 Datacenter Regions available to
Enterprise Projects and 2 Datacenter Regions available to Standard Projects.

## Encryption and Security

[Asset Storage](#asset-storage), data storage, and in-transit encryption are included on all Cloud Projects. All data at
rest remains encrypted. HTTPS/TLS protocols are enabled on all in-transit data. Cloud Projects are created with secure
and safe [tenancy](#multi-tenancy) architectures.

:::tip Directus Core Security Features

Directus core comes with even more powerful security features out-of-the-box including IP address whitelabeling, 2FA
enabling, SSO options, customization for Password Rule requirements, and the flexibility to use any access token
paradigm desired.

:::

## Extensions

The term _Extension_ refers to any feature or component that adds to the functionality of Directus Core. Directus has
been architected to be [completely modular and extensible](/extensions/introduction) to ensure you will never hit a hard
feature ceiling within the platform.

All Cloud Projects have access to the [Cloud Exclusive Extensions](#cloud-exclusives), which are developed and
maintained by the Core Team. Enterprise Projects get all Cloud Exclusives, but also have the option to implement their
own custom Extensions as needed.

## Global CDN

A Global CDN is provided on all Cloud Projects, out-of-the-box, with over 300 cache locations, which means assets and
data will be delivered with the lowest latency.

## Infrastructure

In the context of these docs, Infrastructure refers to the hard and soft tech specs to the equipment running your
Directus Project. This includes the database, [database tenancy](#multi-tenancy), [Node Type](#node-types),
[data storage region](#data-portability), [rate limiting](#rate-limiting), etc. Infrastructure differs by Project tier.
Refer to [Projects](#projects) as well as the Infrastructure section on the [pricing page](https://directus.io/pricing/)
for side-by-side comparisons.

## Nodes

Directus Cloud has options to choose the processing power of your Node as well as the number of Nodes your Project runs
on. Nodes can be configured to meet traffic needs at any scale. In general, there are two approaches to scale
performance, vertical-scaling and horizontal-scaling. Vertical-scaling refers to the use of improved the hardware _(e.g.
better CPUs and more RAM)_ to scale up. In Directus Cloud, configuring the Node Type will provide vertical-scaling.
Horizontal-scaling refers to increasing the number of Nodes to scale up. In Directus Cloud, adding more Active and
Standby Nodes will provide horizontal-scaling.

### Node Types

Each Node Type provides a different level of processing power.

- **Community**\
  Community Projects come equipped with one Node, which can handle basic web traffic required for hobby-projects, learning/demoing
  Directus Cloud, and other non-production use cases. Community Nodes will pause after 3 days of [inactivity](#inactivity).

- **General Purpose**\
  General Purpose Nodes are the basic Node Type offered on Standard Projects. These Nodes are the right choice for most small-to-medium
  scale, production-ready use-cases.

- **Performance Tier**\
  Performance Tier Nodes are the upgraded Node Type offered on Standard Projects. These Nodes provide higher processing power
  and may need to be implemented on Projects under unique conditions _(e.g. a Project frequently sends and receives larger
  files and data sets)_.

- **Enterprise**\
  Node configuration options are flexible and customizable, tailored to the Project's needs.

:::tip

In Standard Projects, the Node Type configured [and associated cost per hour](#billing) will apply to both Active and
Standby Nodes.

:::

### Active Nodes

Active Nodes stay on constantly. A Project must have at least 1 Active Node in order to function.

:::warning

Community Nodes paused due to [inactivity](/cloud/projects/#resume-a-community-project) can't receive requests until
unpaused.

:::

### Load Balancing

Akin to horizontal-scaling, the term Load balancing refers to the configured minimum number of Active Nodes your Project
is running, and the instantaneous distribution of load across servers.

### Standby Nodes

Standby Nodes stay turned-off until traffic starts to take up significant system capacity, at which point Standby Nodes
activate one-by-one as needed to handle the increase in traffic safely. Activation occurs within just a few moments.

Standby Nodes are not required, however you do not pay when Standby Nodes are disabled. For more pricing information,
see [billing](#billing).

### Auto-scaling

Auto-scaling refers to the automatic horizontal scaling provided by Standby Nodes, which helps to keep system capacity
at safe levels.

:::tip Optimal Node Configuration

As noted under [Billing](#billing), Projects can be reconfigured as needed. The
[Project Monitor Page](/cloud/projects/#monitor-a-project) provides performance analytics to help inform Node
configuration decisions.

:::

## Projects

A Cloud Project is a Directus Instance along with its linked database and all other saved assets. All Cloud Projects
come [quota-free](#quotas) and include all [Cloud Exclusives](#cloud-exclusives).

Read the [Projects documentation](/cloud/projects) to learn how to manage Projects. See
[Support Options](#support-options) to find out how to get help on your Project.

There are 3 different Project tiers on Directus Cloud. A side-by-side comparison of what is included in each tier can be
found on the [Pricing Page](https://directus.io/pricing/). The following highlights the configuration options available
at each Project tier.

### Community

A Community Project comes with the following configurations.

- **Project Name** — Custom.
- **Project URL** — Random.
- [Datacenter](#data-processing) — `United States, East`.
- [Node Type](#node-types) — Community Node.
- [Load Balancing](#load-balancing) — One Active Node.
- [Auto-Scaling](#auto-scaling) — Not Available.
- **Starting Template** — Create an Empty Project or a Demo Project with dummy data.

### Standard

A Standard Project comes with the following configuration options:

- **Project Name** — Custom.
- **Project URL** — Customize URL slug _(if available of course)_.
- [Datacenter](#data-processing) — Two choices: `United States, East` or `Europe, Frankfurt`.
- [Node Type](#node-types) — Choose between General Purpose and Performance Nodes.
- [Load Balancing](#load-balancing) — Select 1-6 Active Nodes.
- [Auto-Scaling](#auto-scaling) — Select 0-5 Standby Nodes.

### Enterprise

Enterprise Projects are custom-tailored, offering power and scale to meet any Project's needs, 15+
[Datacenter regions](#data-processing), as well as [Basic and Premium Support options](#basic-and-premium-support).

:::tip Ready to go Enterprise?

[Contact Sales](https://directus.io/contact/)

:::

## Quotas

Directus does not impose _arbitrary_ software-based limits of any kind. So for things like Collections, Roles, or Users-
whether you have 1 or 10,000 of these, you are free to build out your Project as needed, with no up-charge. However,
actual Project performance is going to depend on Node configuration, so there are hard technical Limits. For details,
see [Cloud Policies](https://directus.io/cloud-policies/)

## Rate Limiting

Rate limiting refers to technical limitations within Directus Cloud as well as Cloud Projects. This includes limits on
things like API requests per second per Project. For details, see [Cloud Policies](https://directus.io/cloud-policies/#)

## Support Options

There are three types of support for Directus.

### Community Support

As an open-source Project, everyone is encouraged to reach out to the Community for help on Projects, _and of course
help others as well_. Find us on [GitHub](https://github.com/directus/directus/discussions) and
[Discord](https://directus.chat/) to join the thousands of other developers all discussing and guiding the future of the
Directus platform. Most common questions have already been asked and answered and can be easily searched.

:::warning No Guaranteed Response Time

While the Directus Core Team plays an active and engaged role in community discussions, aiming to answer questions
within a few days, there is no guaranteed response time for Community Support.

:::

### Basic and Premium Support

Basic and Premium Support offer direct communication with the Directus Core Team. Basic support is included on all
Enterprise Projects. Premium Support adds 24/7 response times for critical software issues only.

:::tip Add-on Support

Looking for Basic or Premium Support on a self-hosted Project? [Contact Sales](https://directus.io/contact/)

:::

## System Status

<video alt="System Status" loop muted controls autoplay>
  <source src="https://cdn.directus.io/docs/v9/cloud/glossary/glossary-20220322A/system-status-20220329A.mp4" type="video/mp4">
</video>

Click <span mi icon>check</span> in the Dashboard Header to navigate to the System Status Page. This page displays the
current connectivity status of Directus Cloud, status on individual Projects by URL, and also provides a daily Incidents
log. This Page is where to _find out what happened_ in the super rare event that the network slows down or goes down.
For more information, see [Cloud Policies](https://directus.io/cloud-policies/#)

## Teams

In the Cloud Dashboard, a Team groups [Accounts](#accounts), giving them full access to the same [Projects](#projects).
See the [Overview](/cloud/overview) to learn how Accounts, Teams and Projects interrelate. Read the
[Teams documentation](/cloud/teams) to learn how to manage Teams.

## Multi-tenancy

Tenancy refers to how client data is stored within a database. In single-tenancy architecture, a database stores data
from only one tenant. In multi-tenancy architecture, a database stores data from multiple tenants, with mechanisms in
place to protect data privacy. In the context of Directus Cloud, each Project represents a tenant.

**Community**\
Community project databases are technically single-tenant, but also file-based, and therefore may be too limited on power
for a production-ready environment.

**Standard**\
Standard Projects are created using multi-tenant architecture. However, each Standard Project is scoped- one container per
Project, with no bleeding into other Projects. If your neighbor's Project gets busy, it will not impact your Project.

**Enterprise**\
Databases on Enterprise Projects are single-tenant, offering 100% isolation. No neighbors.

:::tip

This section refers to how your Cloud Project is stored among other Cloud Projects and has nothing to do with how you
design your Project's data model. You can implement single or multi-tenant architecture within any Directus Cloud
Project.

:::
