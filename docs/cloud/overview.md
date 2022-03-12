# Overview

> Create and manage Teams and Projects, Invite Users, and set billing information with the easy-to-use Cloud Dashboard
> login.

![Hero Image](image.webp)

[[toc]]

::: tip Dashboard or API Login

All actions on Directus Cloud can be done on the Cloud API, which will be released soon!

:::

The Cloud Dashboard contains three key components: Accounts, Teams and Projects. A person creates an Account _(these
Accounts are completely free)_. Accounts then create or join Teams, whereupon the Account becomes a Member of the Team.
Teams are how projects and billings are organized on Directus Cloud. Team Members create Projects, which are individual
Instances of Directus. Accounts are able to be Members on multiple Teams. Teams are able contain multiple Directus
Projects and multiple Members. All Team Members have Super Admin privileges on all Team Projects.

There are 3 tiers of Cloud Projects: Community, Standard, and Enterprise. All 3 tiers come with everything in Directus
Core as well as all [Cloud Exclusive Extensions](). The Community Tier offer a completely free Directus Project, perfect
to spin-up hobby projects, demo Directus Cloud, test a proof of concept or get started on any other non-production
activity. The Standard Tier provides Projects with custom URLs, upgraded server power and many configuration options;
perfect for most production-ready use cases. The Enterprise Tier allows custom-tailored Projects, fit for massive scale
as well as other unique use-cases.

To make life easy, you have the option to create and login to your free Cloud Account automatically with Github. If you
have no Github or do not wish to use this login method, email-and-password login is available as well. Once logged-in,
create a new Team or Select an existing Team to access and manage its associated Projects, Billing, Members, Activity,
and Settings. Here is an overview of the Cloud Dashboard.

<video alt="Cloud Dashboard Overview" loop muted controls autoplay>
  <source src="" type="video/mp4">
</video>

The Dashboard has 6 key navigation areas: the Dashboard Header, Projects, Members, Billing, Activity and Settings.
Here's how these navigation areas relate to Accounts, Projects, and Teams.

## Accounts

### Cloud Dashboard Header

- <span mi icon>check</span> — View Directus Cloud system status.
- <span mi icon>notifications</span> — Notifications such as version upgrades, platform upgrades, etc.
- <span mi icon>help_outline</span> — Documentation, Community Support and Request for Premium Support.
- **Team Dropdown Menu** — Create new Teams and Switch between existing Teams.
- <span mi icon>account_circle</span> — Access, edit and destroy Account.

## Projects

- **Team Projects** — View and access all [Projects](/cloud/projects) managed within a Team. Click a Project to enter
  the Product Details Page and access, monitor, edit or delete a Project.

- **Team Billing** — View and manage billing details such as credit card information, usage, subscriptions, and
  receipts.

## Teams

- **Team Members** — View, invite and remove other Team Members or leave a Team yourself.

- **Team Activity** — View Team activity like Project creation and deletion, billing information changes, Member
  invitations and removals, etc.

- **Team Settings** — Edit the Team Name and Team Slug, as well as delete the Team.

## System Status

Click <span mi icon>check</span> in the Dashboard Header to check system status. This page displays the current status
of Directus Cloud, status on individual Projects by URL, as well as a daily Incidents log. This Page is where to _find
out what happened_ in the super rare event that the network slows down or goes down.

<video alt="Cloud Dashboard Overview" loop muted controls autoplay>
  <source src="" type="video/mp4">
</video>
