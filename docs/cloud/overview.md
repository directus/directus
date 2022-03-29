# Overview

> Our Cloud service manages all infrastructure and software updates on your Directus Projects. From hobbyists and
> startups to Fortune 500 companies, our flexible cloud service offers fair and predictable usage-based pricing.

![Hero Image](image.webp)

[[toc]]

[Directus Cloud](https://directus.cloud/) is a hosting platform for [Directus Projects](/cloud/glossary/#projects),
offering [Cloud Exclusive Extensions](/cloud/glossary/#cloud-exclusives), bi-weekly
[automatic software updates](/cloud/glossary/#automatic-updates),
[horizontal and vertical scaling](/cloud/glossary/#nodes) at the click of a button, hosting options to fit any
budget-and-scale, and a [pricing system](/cloud/glossary/#billing) that allows you to scale up or down at anytime.
Directus Cloud handles data storage, hosting, updates and scalability so developers can focus on building their app.

The Cloud Dashboard contains three key components: [Accounts](/cloud/glossary/#accounts),
[Teams](/cloud/glossary/#teams) and [Projects](/cloud/glossary/#projects).

First you create an Account. Once logged in, you create or join a Team and your Account then becomes Member of that
Team. All Team Members have SuperAdmin privileges to manage Projects, Project [billing](/cloud/glossary/#billing), other
Team Members, and the Team itself. Accounts can be Members on multiple Teams. Teams can have multiple Team Members and
multiple Projects. Projects can only be managed by one Team. Projects cannot be transferred to new Teams.

![Cloud Hierarchy](image.webp)

## Getting Started

To make life easy, you have the option to
[create and login to your free Cloud Account](/cloud/accounts/#create-account-and-login) automatically with GitHub. If
you have no GitHub or do not wish to use this login method, email-and-password login is available as well. Once
logged-in, create a new Team or Select an existing Team to access and manage its associated Projects, billing details,
Team Members, Activity, and Settings.

<video alt="Cloud Dashboard Overview" loop muted controls autoplay>
  <source src="https://cdn.directus.io/docs/v9/cloud/overview/overview-20220322A/cloud-dashboard-overview-20220329A.mp4" type="video/mp4">
</video>

There are 3 [tiers of Cloud Projects](/cloud/glossary/#projects): Community, Standard, and Enterprise. All 3 tiers come
with everything in Directus Core as well as all [Cloud Exclusive](/cloud/glossary/#cloud-exclusives) Extensions.

The Dashboard layout itself is designed to manage [Accounts](/cloud/glossary/#accounts), [Teams](/cloud/glossary/#teams)
and [Projects](/cloud/glossary/#projects):

## Accounts

### Cloud Dashboard Header

- <span mi icon>check</span> — View Directus Cloud [system status](/cloud/glossary/#system-status).
- <span mi icon>notifications</span> — Notifications such as version upgrades, platform upgrades, etc.
- <span mi icon>help_outline</span> — Documentation, Community Support and Request for Premium Support.
- <span mi icon>expand_more</span> — [Create new Teams](/cloud/teams/#create-a-team) and navigate between Teams you are
  on.
- <span mi icon>account_circle</span> — [Access, edit or destroy Account](/cloud/accounts).

## Teams

- **Team Members** — [View, invite and remove](/cloud/teams) other Team Members or leave a Team yourself.

- **Team Activity** — [View Team activity](/cloud/teams/#view-team-activity) like Project creation and deletion, billing
  information changes, Member invitations and removals, etc.

- **Team Settings** — [Edit the Team Name and Team Slug](/cloud/teams/#update-team-settings), as well as delete the
  Team.

## Projects

- **Team Projects** — View and access all Projects managed within a Team. Click a Project to enter the Product Details
  Page and [access, monitor, edit or delete a Project](/cloud/projects).

- **Team Billing** — [View and manage billing details](/cloud/teams/#manage-billing) such as credit card information,
  usage, subscriptions, and receipts.
