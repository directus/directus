# Overview

> Our Cloud service manages all infrastructure and software updates on your Directus Projects. From hobbyists and
> startups to Fortune 500 companies, our flexible cloud service offers fair and predictable usage-based pricing.

![Hero Image](https://cdn.directus.io/docs/v9/cloud/overview/overview-20220322A/hero-image-20220402A.webp)

[[toc]]

[Directus Cloud](https://directus.cloud/) is a hosting platform for [Directus Projects](/cloud/glossary/#projects) which
handles data storage, hosting, updates and scalability so developers can focus on building their app. There are 3
[tiers of Cloud Projects](/cloud/glossary/#projects): Community, Standard, and Enterprise. All 3 tiers come with
everything in Directus Core as well as all [Cloud Exclusive](/cloud/glossary/#cloud-exclusives) Extensions.

The Cloud Dashboard is constructed to manage three key components: [Accounts](/cloud/glossary/#accounts),
[Teams](/cloud/glossary/#teams) and [Projects](/cloud/glossary/#projects). First, you create yourself an Account. Once
logged in, you create or join a Team and your Account then becomes a Member of that Team. Then you create Projects
within a Team.

Accounts can be Members on multiple Teams. All Team Members have SuperAdmin privileges to manage the Team's Projects,
Project [billing](/cloud/teams/#manage-billing), other Team Members, and the Team itself. Teams can have multiple Team
Members and multiple Projects. Projects can only be managed by one Team and cannot be transferred to new Teams.

## Getting Started

To make life easy, you have the option to
[create and login to your free Cloud Account](/cloud/accounts/#create-account-and-login) automatically with GitHub. If
you have no GitHub or do not wish to use this login method, email-and-password login is available as well. Once
logged-in, create a new Team or select an existing Team. Then you can access and manage the Team's associated Projects,
billing details, Team Members, Activity, and Settings.

<video alt="Cloud Dashboard Overview" loop muted controls autoplay>
  <source src="https://cdn.directus.io/docs/v9/cloud/overview/overview-20220322A/cloud-dashboard-overview-20220329A.mp4" type="video/mp4">
</video>

As mentioned above, the Dashboard layout itself is designed to manage [Accounts](/cloud/glossary/#accounts),
[Teams](/cloud/glossary/#teams) and [Projects](/cloud/glossary/#projects). The following highlights how the Dashboard
layout relates to each of these.

## Accounts

### Cloud Dashboard Header

- <span mi icon>check</span> — View Directus Cloud [system status](/cloud/glossary/#system-status).
- <span mi icon>notifications</span> — Notifications such as version upgrades, platform upgrades, etc.
- <span mi icon>help_outline</span> — Documentation, Community Support and Request for Premium Support.
- <span mi icon>expand_more</span> — [Create new Teams](/cloud/teams/#create-a-team) and navigate between Teams you are
  on.
- <span mi icon>account_circle</span> — [Access, edit or destroy Account](/cloud/accounts).

## Teams

- [Team Members](/cloud/teams) — View, invite and remove other Team Members or leave a Team yourself.
- [Team Activity](/cloud/teams/#view-team-activity) — View Team activity like Project creation and deletion, billing
  information changes, Member invitations and removals, etc.
- [Team Settings](/cloud/teams/#update-team-settings) — Edit the Team Name and Team Slug, as well as
  [destroy the Team](/cloud/teams/#destroy-a-team).

## Projects

- [Team Projects](/cloud/projects) — View and access all Projects managed within a Team. Click a Project to enter the
  Product Details Page and access, monitor, edit or delete a Project.
- [Team Billing](/cloud/teams/#manage-billing) — View and manage billing details such as credit card information, usage,
  subscriptions, and receipts.
