# Project Options

[[toc]]

## Accounts

Accounts are the term for your Super Administrator Cloud Dashboard Profile to create and join Teams, pay bills, and
manage Projects. In contrast, "User" is the term for Profiles within a Directus Project. Accounts on the Cloud Dashboard
and the Users created within a Directus Project are two separate systems. See the [Overview](#cloud/overview) to learn
how Accounts, Teams and Projects inter-relate. Read the [Accounts documentation](/cloud/accounts) to learn how to manage
Accounts.

## Asset Storage

Support for any type of file is included on all Cloud Projects. Certain technical limits apply to file uploads such as
limits on size per asset and total asset storage per Project. For all limitation details, see
[Cloud Policies](https://directus.io/cloud-policies/#).

Asset Storage space varies by Project Tier. For details, see [Cloud Policies](https://directus.io/cloud-policies/#).

- Storage device details? @rijk -> Performance

## Automatic Software Updates

- Upgrade latest version every two weeks, all dependencies, security patches,
- How time consuming it would be to do on your own!
- All done with no downtime (rolling releases)

## Auto-Scaling

Auto-scaling refers to the practice of activating Standby Nodes during times of spiked web traffic. For more
information, see [Nodes](#nodes).

- move explanation from nodes into auto-scaling.

## Backups

Data backups are enabled for Standard and Enterprise Projects.

- Backup Frequency -> nightly for std and nightly for enterprise (but is configurable)
- :::tip
- How to access backup info -> internal use. if needed, open support ticket and request. In future available through
  dashboard.

## Billing

Community Projects are free of charge. Enterprise Projects are custom-tailored and set case-by-case. Standard billing
charges are determined by 2 factors:

- The rate based on [Node Type](#nodes) _(General Purpose vs Performance Tier)_.
- Cumulative Node hours within billing cycle.

The Node Type selected applies to all Nodes in a Project _(both Active and Standby)_.

Note that for Active Nodes, a flat-rate monthly price is given on the
[Create a Project](/cloud/projects/#create-a-project) section. In actuality, this "monthly fee" is just the hourly node
rate for the Node Type selected multiplied by the number of hours in a month. Bills are invoiced monthly or at Project
deletion. So for example:

The [Project Monitor Page](/cloud/projects/#monitor-a-project) provides analytics on Node performance to help inform
decisions to add or remove Active and Standby Nodes. To manage billing, see
[Manage Billing](/cloud/teams/#manage-billing). For information on specific hourly rates and refunds, see
[Cloud Policies](https://directus.io/cloud-policies/).

### Example 1 hrly pricing

- Less than a month -> illustrate it is all done hourly.

### Example 2- active nodes

- 2 nodes, no standby's with exact pricing system.

### Example 3 - overages on standby

- 2 nodes, 2 standby nodes. 2 spikes: 1 w/1 node, 1 w/2 nodes.

### Example 4 - pro-rated changes

- pro-rated billing (change infrastructure) - change from 1 GP to 2 Performance mid-month.

---

Project billing is based on the total number of hours across all active/standby nodes utilized during the billing
period. All usage is measured on a calendar monthly basis, with usage reset on the first day of each new billing period.
For example, if you signed up on the 15th, your usage period is set to be from 15th to 14th of a calendar month.

For example, if your project is configured to use 2 General Purpose Nodes ($0.03424657534 / hour / node), and it is
active for the entire month (730 hours), then your base monthly fee will be $50.00. If you have a spike of usage during
a month that causes one standby node to be activated for 19.5 consecutive hours (rounds up to 20 hours), then an
additional $0.69 will be added to your monthly fee. This brings your total fee for the month to $50.69 + Tax/VAT.

## Caching

- Community and Standard Projects? @rijk
- Directus Core's [default caching strategy](configuration/config-options/#cache), which leaves caching disabled.
- Enterprise Projects offers advanced caching.

* schema, content, global CDN

## Cloud API

Any action in the Directus Cloud Dashboard can be performed programmatically via the Cloud API.

- advantages and possibilities @rijk

* Release date - coming soon

## Cloud Exclusives

These are [Extensions](#extensions) to Directus Core which provide extra functionality _(such as the Kanban Layout for
project management)_. Directus is completely open-source and free to use, so anyone can create their own custom
Extensions on self-managed Projects, however custom Extensions are not supported by the Core Team and may not work as
newer Versions are released. Cloud Exclusive development is managed by the Core Team.

## Community Support

As an open-source Project, you are encouraged to reach out to the Community for help on Projects, and of course to help
others as well. To join the thousands of other developers all discussing and guiding the future of the Directus
platform, the two primary channels to engage with the community would be
[Github](https://github.com/directus/directus/discussions) and [Discord](https://directus.chat/). Most common questions
have already been asked and answered and can easily be found in Github Discussions and Issues. Note that while the
Directus Core Team plays an active and engaged role in community discussions, there is no guaranteed turnaround time on
official answers.

## Data Portability

- Import/Export of data
- Migration in and out of the platform (currently manual and only for enterprise, will

## Data Processing

- No info found in context of Directus @rijk

* Info. on GDPR - all paid instances = data in GDPR compliant region

## Encryption and Security

Data-storage and in-transit encryptions is included on all Cloud Projects. All data at rest remains encrypted. HTTPS/TLS
protocols are enabled on all in-transit data.

- data at rest encryption type? @rijk
- Encryption of file assets?
- Minimum Password requirements: 2FA

## Extensions

Directus has been architected to be [completely modular and extensible](/extensions/introduction). This ensures you will
never hit a hard feature ceiling within the platform. However, as new versions of Directus are released, it is not
possible to make sure all future versions of Directus are compatible with all self-developed Extensions. For this
reason, Community and Standard Projects only have access to the [Cloud Exclusive](#cloud-exclusives) Extensions managed
by the Core Team. Enterprise Projects get all Cloud Exclusives and can also build custom Extensions.

## Global CDN

A global CDN is provided on all Cloud Projects, out-of-the-box.

- Specifics on our CDN. @rijk
- Should we tie this into caching?
- AWS cloudfront/cloudflare, 300+ nodes.

## Inactivity

If there is no user app activity for 3 days on a Community Project, the [Infrastructure](#infrastructure) is paused.
Projects which remain paused for a certain duration will be automatically deleted, see details in
[Cloud Policies](https://directus.io/cloud-policies/#). To avoid deletion, you must manually
[resume the Project](/cloud/projects/#resume-paused-project) within the Cloud Dashboard. User requests will not resume
the Project.

## Infrastructure

In the context of these docs, Infrastructure refers to the hard and soft tech specs to the equipment running your
Directus Project. This includes the database (and database tenancy), chosen [Node Type](#nodes), Datacenter region
selection, rate limiting, etc. Infrastructure differs Tier to Tier. Standard has numerous Infrastructure configuration
options. Refer to the Infrastructure section on the [pricing page](https://directus.io/pricing/) for side-by-side
comparison between Tiers.

## Load Balancing

Load balancing allows you to configure the minimum number of [Active Nodes](#nodes) your Project is running, so as to
instantaneously distribute load across multiple servers. This is essentially the same concept as Horizontal Scaling.
Note that the total number of Active Nodes can be changed at any time _(see
[Manage a Project](/cloud/projects/#manage-a-project))._ The [Project Monitor Page](/cloud/projects/#monitor-a-project)
provides analytics on Node performance, which helps inform the decision on whether or not to add or remove Active and
Standby Nodes. So don't feel tied to a single decision up front.

## Nodes

When creating a Standard Project, you will be prompted to choose Node Type (General Purpose or Performance Tier), then
select a number of Active Nodes and Standby Nodes. Here is a clarification of these terms.

### General Purpose vs Performance Tier

These terms refer to the Node processing power, _also known as vertical scaling_. General Purpose Nodes are the right
choice for most common use-cases. Performance Tier Nodes provide higher processing power. This choice is applied to all
Nodes on a Project, both Active and Standby.

### Active Nodes vs Standby Nodes

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

## Parallel Operations

Parallel operations refers to breaking up different parts of a task among multiple processors (CPUs) to help reduce the
amount of computation time.

- Parallel operations in Directus Cloud @rijk
- maybe SQLite???

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

* () needs a fact-check @rijk

## Quotas

- no functional quotas
- resources of Nodes and whatever you can do with that.
- ::: tip Technical Limits
