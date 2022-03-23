# Glossary

[[toc]]

## Accounts

Your Account is the term for your SuperAdmin Cloud Dashboard profile, used to create and join Teams,
[pay bills](#billing), and manage Projects. See the [Overview](/cloud/overview) to learn how Accounts, [Teams](#teams)
and [Projects](#projects) interrelate. Read the [Accounts documentation](/cloud/accounts) to learn how to manage
Accounts.

:::tip Accounts vs Users

To avoid confusion, "User" is the term for users in a Directus Project, while the terms "Account" and "Team Member" are
used in the context of Directus Cloud. Accounts on Directus Cloud and Users in a Directus Project are two separate
systems.

:::

## Asset Storage

Directus Core allows asset storage for any type of file. This applies on all Cloud Projects. However, on Directus Cloud,
certain hard technical limits apply to file uploads such as limits on size per asset and total asset storage per
Project. For more details, see [Cloud Policies](https://directus.io/cloud-policies/#).

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

Community Projects are free. Each Enterprise Project is custom-tailored and so is the bill. For more information on
Enterprise billing, [contact sales](https://directus.io/contact/). The rest of this section will focus on billing
details for Standard Projects.

### Manage Billing

Billing is organized such that each Team has its own separate billing and each Project within a Team is
[calculated](#how-bills-are-calculated) and [invoiced separately every month](#billing-cycles).

Team Members are SuperAdmins. As such, they have full access to
[manage billing information and payment methods](/cloud/teams/#manage-billing), including information provided by other
Team Members. Team Members should be highly trusted individuals.

All bills will first be invoiced to the default payment method. You may notice that it is possible to add additional
payment methods, and it may be a good idea to do so, as keeping multiple payment methods on file provides a fail-safe to
help make sure your Project stays running. In the event that there is an issue processing the default payment method,
the other payment methods on file will be attempted. If the bill is not paid, the Nodes are paused, halting web-traffic,
until a successful payment is made. If the paused Project is never repaid, it will eventually be deleted along with all
its data and assets! For more details see, [Cloud Policies](https://directus.io/cloud-policies/).

To manage payment methods and other billing details, see how to [manage Team Billing](/cloud/teams/#manage-billing).

For information on refunds, see [Cloud Policies](https://directus.io/cloud-policies/).

:::tip Create Multiple Teams

Teams are free. Use them to create separation appropriately between Project invoices, payment methods and Team Members.

:::

### Billing Cycles

Bills are invoiced on a calendar monthly basis, so each new billing period begins after exactly one month. When a
Project is destroyed, the bill is processed immediately. As mentioned in the previous section, bills are invoiced
per-Project. So, if a Team has 4 Standard Projects, it will be charged 4 times each month.

:::tip What's a Calendar Monthly Basis?

This is the period from a day of one month to the corresponding day of the next month, if such exists. If not, it runs
to the last day of the next month _(e.g. January 3 to February 3 or from January 31 to February 29)_.

:::

### How Bills Are Calculated

Project billing is calculated based on the total number of hours that Active and Standby Nodes are utilized during the
billing period. Once the [Node Type](#nodes) is selected, the associated hourly rate will apply to both Active and
Standby Nodes.

:::tip Node Pricing

**General Purpose:** $0.03424657534 / hour\
**Performance Tier:** $0.06849315068 / hour

:::

Note that this means the monthly prices given for Active Nodes, _$25/month for General Purpose and $50/month for
Performance Tier_, are actually estimates based on the cost per hour times the average length of a month (730 hours).
So, the pricing shown for one Active, General Purpose Node is `$0.03424657534 x 730hrs = $25`, however the actual bill
will vary slightly month-to-month.

Furthermore, a Standard Project's Nodes can be reconfigured at any time. You can upgrade or downgrade Node Types, add
Nodes, remove Nodes or destroy your Project as you please. In the end, _you simply pay for the actual Node-hours used by
your Project_.

The following four examples demonstrate this billing system:

**Hourly Pricing**\
A Project is configured to use General Purpose Nodes, with 1 Active Node and 0 Standby Nodes. The Project runs for 3 days
3.5 hours (75.5 hours total, rounds to 76 hours) and is then destroyed, costing `1 Node x $0.03424657534/hour x 76 hours = $2.60`.

The bill will be `$2.60` plus Tax/VAT, charged at the moment of Project destruction.

**Active Nodes**\
A Project is configured to use Performance Tier Nodes, with 2 Active Nodes and 0 Standby Nodes. The Project runs the full
month (730 hours). Charges will run `2 Nodes x $0.06849315068/hour x 730 hours = $100`.

The monthly bill will be `$100` plus Tax/VAT.

**Overages on Standby Nodes**\
A Project is configured to use General Purpose Nodes, with 3 Active Nodes and 2 Standby Nodes. The Project runs the full
month (730 hours). There are 2 traffic spikes. The first spike is smaller and only activates 1 Standby Node for 6.5 hours.
The second spike is larger and activates the first Node from 4pm to 12am (8 hours), and the second Node from 6pm to 11pm
(5 hours), for a total of `8 + 5 = 13` hours. Between both spikes, Standby Nodes run for a total of 19.5 hours (rounds to
20 hrs). The Active Nodes will cost `3 Nodes x $0.03424657534/hour x 730 hours = $75.00` and Standby Node overages will total
`20 Node-hours x $0.03424657534/hour = $0.68`.

The monthly bill will be `$75.68` plus VAT/Tax.

**Pro-rated Changes**\
A Project begins the billing cycle configured to use General Purpose Nodes, 1 Active and 0 Standby. A massive traffic spike
is expected from marketing activities this month and 200 hours into the month, the Project is reconfigured to use 2 Performance
Tier Nodes and 5 Standby Nodes. In the end, the marketing event was a failure, traffic was just slightly above average. The
5 Standby Nodes were not needed and never activated. The portion of the bill before reconfiguration will be `(1 General Purpose Node x $0.03424657534/hour x 200hrs) = $6.85`
and then adding in reconfigured costs `(2 Performance Nodes x $0.06849315068/hour x 530 hours) = 72.60`.

The monthly bill will be `$79.45` plus VAT/Tax.

### Optimize Node Configuration

As stated in the beginning of this section and as shown by the examples above, _you are never locked-in to a specific
Node configuration_. As needs change on a Project, you are free to reconfigure capacity and scale up or down as needed
_at the click of a button_. However, you may need to monitor overall system traffic to make informed decisions on Node
configuration. The [Project Monitor Page](/cloud/projects/#monitor-a-project) provides performance analytics, which can
be used to help decide optimal Node configuration.

:::tip Standby Nodes

For production-ready Projects of any kind, it is probably a good idea to have one or more Standby Nodes. These do not
activate and you do not pay until they are needed. Alternatively, as with any web app or site, if you do not have the
processing power to handle traffic spikes, it can crash your Nodes!

:::

## Caching

Caching is enabled on Cloud Projects. Public data is cached in the CDN for a short period of time. All Directus Cloud
Projects are running behind a [Global CDN](#global-cdn). Enterprise Projects offer other advanced caching strategies.

## Cloud Exclusives

These are [Extensions](#extensions) to Directus Core which are only available on Cloud Projects _(such as the Kanban
Layout for project management)_. Cloud Exclusive development is managed by the Core Team, so these will stay up-to-date
with the [latest version of Directus](#automatic-software-updates).

## Data Portability

Directus Core is totally detached from the database. Data can be cleanly imported and exported on Projects with the API
via the schema endpoints. For Enterprise clients, the Directus team will work with you to help you through this process.

## Data Processing

In order to optimize your Project and help you meet any local data compliance laws such as GDPR, Standard and Enterprise
Projects allow you to choose the region your Project is hosted in. There are 15 datacenter regions available to
Enterprise Projects and 2 Datacenter regions available to Standard Projects.

## Encryption and Security

[Asset Storage](#asset-storage), data storage, and in-transit encryption are included on all Cloud Projects. All data at
rest remains encrypted. HTTPS/TLS protocols are enabled on all in-transit data. Cloud Projects are created with secure
and safe [tenancy](#tenancy) architectures.

:::tip Directus Core Security Features

Directus core comes with even more powerful security features out-of-the-box including IP address whitelabeling, 2FA
enabling, SSO options, customization for Password Rule requirements, and the flexibility to use any Access Token
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

## Inactivity

If there is no app activity for 3 days on a Community Project, the [Infrastructure](#infrastructure) is paused. Projects
which remain paused for a certain duration will be automatically deleted, see details in
[Cloud Policies](https://directus.io/cloud-policies/#). To avoid deletion, you must manually
[resume the Project](/cloud/projects/#resume-paused-project) within the Cloud Dashboard. Once paused, requests to the
app will not resume the Project.

## Infrastructure

In the context of these docs, Infrastructure refers to the hard and soft tech specs to the equipment running your
Directus Project. This includes the database, database tenancy, chosen [Node Type](#nodes), data storage region, rate
limiting, etc.

Infrastructure configuration options differ by Project Tier. Refer to [Projects](#projects) as well as the
Infrastructure section on the [pricing page](https://directus.io/pricing/) for side-by-side comparison between Tiers.

## Nodes

Directus Cloud has options to choose the processing power of your Node as well as the number of Nodes your Project runs
on. Nodes can be configured to meet traffic needs at any scale. There are two approaches to scale-up Project
performance, vertical-scaling and horizontal-scaling. Vertical-scaling is the concept of increasing performance and
capacity by using Nodes with better hardware specs _(e.g. better CPUs and more RAM)_. In Directus Cloud,
vertical-scaling is handled by configuring the Node Type. Horizontal-scaling is the concept of increasing performance
and capacity by adding a larger number of Nodes to handle incoming requests. In Directus Cloud, horizontal-scaling is
handled by setting the number of Active Nodes and Standby Nodes.

### Node Type

Each Node Type provides a different levels of processing power.

- **Community**\
  Community Projects come equipped with one Node, which can handle basic web traffic required for hobby-projects, learning/demoing
  Directus Cloud, and other non-production use cases. Community Nodes will pause after 3 days of [inactivity](#inactivity).

- **General Purpose**\
  General Purpose Nodes are the basic Node Type offered on Standard Projects. These Nodes are the right choice for most small-to-medium
  scale, production-ready use-cases.

- **Performance Tier**\
  Performance Tier Nodes are the upgraded Node Type offered on Standard Projects. These Nodes provide higher processing power
  and may need to be implemented on Projects under unique conditions _(for example a Project frequently sends and receives
  larger files and data sets)_.

- **Enterprise**\
  Enterprise Node configuration options are flexible and customizable, tailored to the needs of the Project.

:::tip

In Standard Projects, the Node Type configured [and associated cost per hour](#billing) will apply to both Active and
Standby Nodes.

:::

### Active Nodes

Active Nodes stay on constantly. A Project must have at least 1 Active Node in order to function. Community Nodes paused
due to [inactivity](#inactivity) can't receive requests until unpaused.

### Load Balancing

Akin to horizontal-scaling, the term Load balancing refers to the configured minimum number of Active Nodes your Project
is running, and the instantaneous distribution of load across these servers.

### Standby Nodes

Standby Nodes stay turned-off until traffic starts to take up significant system capacity, at which point Standby Nodes
activate one-by-one as needed to handle the increase in traffic safely. Activation occurs within just a few moments.

Standby Nodes are not required, however you do not pay when Standby Nodes are disabled. For more pricing information,
see [billing](#billing).

### Auto-scaling

Standby Nodes automatically activate and de-activate, scaling performance and power up and down based on traffic spikes
and system capacity, providing on-demand horizontal-scaling.

:::tip Optimal Node Configuration

As noted under [Billing](#billing), Projects can be reconfigured as needed. The
[Project Monitor Page](#project-monitor-page) provides performance analytics to help inform Node configuration
decisions.

:::

## Project Monitor Page

<video alt="Project Monitor Page" loop muted controls autoplay>
  <source src="https://cdn.directus.io/docs/v9/cloud/glossary/glossary-20220322A/monitor-a-project-20220322A.mp4" type="video/mp4">
</video>

On this page, 4 graphs are shown:

- **Combined Node Usage** — Total load placed on all Nodes.
- **Horizontal Scaling** — Indicates number of Standby Nodes that get activated.
- **API Requests** — Average API requests.
- **API Bandwidth** — Average read/write bandwidth.

This information may help inform Node configuration decisions. Learn how to access the
[Project Monitor Page](/cloud/projects/#monitor-a-project).

## Project URL

Project URLs are randomized for Community Cloud Projects. Standard Projects offer custom URLs, which are displayed as
follows: `some-custom-url.directus.app`. In any case, your desired URL must be available, not in use by another Project.

For Enterprise Projects, [contact sales](https://directus.io/contact/)

## Projects

A Cloud Project is a Directus Instance along with its linked database and all other saved assets. All Cloud Projects
come [quota-free](#quotas) and include all [Cloud Exclusives](#cloud-exclusives).

Read the [Projects documentation](/cloud/projects) to learn how to manage Projects. See
[Support Options](#support-options) to find out how to get help on your Project.

There are 3 different Project Tiers on Directus Cloud. A side-by-side comparison of what is included in each Tier can be
found on the [Pricing Page](https://directus.io/pricing/). Here is a general overview:

### Community

The Community Tier is a completely free Directus Project, perfect to spin-up hobby projects, demo Directus Cloud, test a
proof of concept or get started on any other non-production activity. Community Projects come with the following
configurations:

- [Project URL](/cloud/glossary/#project-url) — Random.
- [Datacenter](/cloud/glossary/#data-processing) — `United States, East`.
- [Node Type](/cloud/glossary/#nodes) — Community Node.
- [Load Balancing](/cloud/glossary/#nodes) — 1 Active Node.
- [Auto-Scaling](/cloud/glossary/#nodes) — Not Available.
- **Starting Template** — Create an Empty Project or a Demo Project with dummy data.

### Standard

The Standard Tier is perfect for most production-ready use cases, providing Projects with custom URLs, upgraded server
power and the following configuration options:

- [Project URL](#project-url) — Customize URL slug _(if available of course)_.
- [Datacenter](#data-processing) — Two choices: `United States, East` or `Europe, Frankfurt`.
- [Node Type](#nodes) — Choose between General Purpose and Performance Nodes.
- [Load Balancing](#nodes) — Select 1-6 Active Nodes.
- [Auto-Scaling](#nodes) — Select 0-5 Standby Nodes.

### Enterprise

The Enterprise Tier provides power and scale to meet any Project's needs, offers 15+
[Datacenter regions](#data-processing), and [Premium Support](#support-options) options. For more information,
[contact sales](https://directus.io/contact/)

## Quotas

Directus does not impose _arbitrary_ software-based limits of any kind. So for things like Collections, Roles, or Users-
whether you have 1 or 10,000 of these, you are free to do what you need, with no upcharge. However, actual Project
performance is going to depend on Node configuration, so there are of course hard technical Limits. For more details,
please refer to [Cloud Policies](https://directus.io/cloud-policies/).

## Rate Limiting

Rate limiting refers to technical limitations within Directus Cloud as well as Cloud Projects. This includes limits on
things like API requests per second per Project. For detailed information, please see
[Cloud Policies](https://directus.io/cloud-policies/#).

## Support Options

There are two tiers of Support for Directus.

### Community Support

As an open-source Project, everyone is encouraged to reach out to the Community for help on Projects, _and of course
help others as well_. Find us on [GitHub](https://github.com/directus/directus/discussions) and
[Discord](https://directus.chat/) to join the thousands of other developers all discussing and guiding the future of the
Directus platform. Most common questions have already been asked and answered and can be easily searched.

:::warning No Guaranteed Response Time

While the Directus Core Team plays an active and engaged role in community discussions, aiming to answer questions
within a few days, there is no guaranteed response time for Community Support.

:::

### Premium Support

Premium Support could include retainers for development, staff training sessions, guaranteed uptime, and any other
common services. This is offered for Enterprise Projects and specific terms are set case-by-case. Premium Support often
includes a private communication channel with team Engineers and guaranteed response times.

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

**Community Tenancy**\
Community project databases are technically single-tenant, but also file-based, and therefore may be limited on power for
a production-ready environment.

**Standard Tenancy**\
Standard Projects are created using multi-tenant architecture. However, each Standard Project is scoped- one container per
Project, with no bleeding into other Projects. If your neighbor's Project gets busy, it will not impact your Project.

**Enterprise Tenancy**\
Databases on Enterprise Projects are single-tenant, offering 100% isolation. No Neighbors.
