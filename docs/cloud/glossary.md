# Project Options

[[toc]]

## Accounts

Accounts are the term for your Super Administrator Cloud Dashboard Profile to create and join Teams, pay bills, and
manage Projects. In contrast, "User" is the term for Profiles within a Directus Project. Accounts on the Cloud Dashboard
and the Users within Directus Project are two separate systems.

## Asset Storage

## Asset Support

Asset support for any type of file is included on all Cloud Projects. Certain technical limits apply to file uploads
including limits on characters per Field, size per asset, and total asset storage per Project. For all limitation
details, see [Cloud Policies](https://directus.io/cloud-policies/#).

## Auto-Scaling

Auto-scaling refers to the practice of using Standby Nodes during times of spiked web traffic. For more information, see
[Standby Nodes](#standby-nodes).

## Backups

Standard and Enterprise Projects and data are backed up by default.

## Billing

- invoiced monthly or at project cancellation
- billed per node hour
- Node count and auto-scale nodes
- Where to manage billing
- 2-3 examples

## Caching

- configuration/config-options/#cache
- Simple explanation of defaults
- Advanced options availabe for Enterprise Projects

## Cloud API

Any action in the Directus Cloud Dashboard can be performed programmatically via the Cloud API.

- advantages and possibilities.
- Release date.

## Cloud Exclusives

These are special features are Extensions to Directus Core which provide extra functionality _(such as the Kanban Layout
for project management)_. Directus is completely open-source and free to use, so anyone can create their own custom
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

## Data-processing

- no info available

## Encryption and Security

Encryption in transit is included on all Cloud Projects.

## Extensions

- remove and link all instances to the extensions docs?

## Global CDN

A global CDN is provided on all Cloud Projects.

-> More details pls.

## Inactivity

If there is no user app activity for 3 days on a Community Project, the Infrastructure is paused. Projects which remain
paused for a certain duration will be automatically deleted, see [Cloud Policies](https://directus.io/cloud-policies/#)
for duration details on pause time and duration. To avoid deletion, you must manually
[unpause the Project](/cloud/projects/#resume-paused-project) within the Cloud Dashboard.

## Infrastructure

In the context of these docs, Infrastructure refers to the hard and soft tech specs to the equipment running your
Directus Project. This includes concepts like database tenancy, server type, Datacenter region selection, rate limiting,
etc. Infrastructure differs Tier to Tier. Refer to the [pricing page](https://directus.io/pricing/) for side-by-side
comparison between Tiers.

## Load Balancing

Load balancing allows you to configure the minimum number of [Active Nodes](#nodes) your Project is running, so as to
instantaneously distribute load across multiple servers. This is essentially the same concept as Horizontal Scaling.
Note that the total number of Active Nodes can be changed at any time _(see
[Manage a Project](/cloud/projects/#manage-a-project))._ The [Project Monitor Page](/cloud/projects/#monitor-a-project)
provides analytics on Node performance, which helps inform the decision on whether or not to add or remove Active and
Standby Nodes. So don't feel tied to a single decision up front.

## Migration

-> Not enough info

## Nodes

When creating a Standard Project, you will be prompted to choose Node Type (General Purpose or Performance Tier) as well
as select a number of Active Nodes and Standby Nodes.

### General Purpose vs Performance Tier

These terms refer to the Node processing power, _also known as vertical scaling_. General Purpose Nodes are the right
choice for most common use-cases. Performance Tier Nodes provide higher processing power. This choice is applied to all
Nodes on a Project, both Active and Standby.

### Active Nodes vs Standby Nodes

Active Nodes are always on and available to handle incoming requests, regardless of traffic. At times when traffic
spikes high, Standby Nodes (if any are configured) will activate within a few minutes, one-by-one, until the system can
handle the capacity. Standby Nodes add variability to Project costs, but you are only charged when they are needed. For
more information, see [Billing](#billing). The [Project Monitor Page](/cloud/projects/#monitor-a-project) provides
analytics on Node performance to help inform decisions to add or remove Active and Standby Nodes.

## Overages

## Parallel Operations

## Premium SLA

## Premium Support

## Projects

A Cloud Project refers to a running Directus Instance and its linked database.

## Rate Limiting

Rate limiting refers to technical limitation placed on Directus Cloud and Cloud Projects. Rate limits include caps on
things like Project creation per hour and API requests per second per Project. For detailed information on rate _(and
other technical)_ limits, please see [Cloud Policies](https://directus.io/cloud-policies/#).

## Standby Nodes

Standby nodes are nodes that simply stay turned off until needed. These nodes come online within a few minutes of
hitting 80% capacity on Active Nodes, and you are only billed for the hours that these nodes come online. When you
select General Purpose or Performance Nodes, this choice applies to both the Active and Standby nodes.

## System Status

Click <span mi icon>check</span> in the Dashboard Header to check system status. This page displays the current
connectivity status of Directus Cloud, status on individual Projects by URL, as well as a daily Incidents log. This Page
is where to _find out what happened_ in the super rare event that the network slows down or goes down.

<video alt="Cloud Dashboard Overview" loop muted controls autoplay>
  <source src="" type="video/mp4">
</video>

## Teams

## Tennancy (Single vs Multi)

## Tiers: Community vs Standard vs Enterprise

### Community Tier

### Standard Tier

- Project URLs and/or Slug
- Node Type: (aka vertical scaling)
- Load Balancing —
- Auto-scaling - standby nodes - Not paying unless you use them. https://directus.io/cloud-policies/
- Datacenter Region - Choose from

### Enterprise Tier

- Remote database access coming soon! Contact us.
- 15+ regions
- Use copy from website/cloud etc.

## Quotas

## Updates
