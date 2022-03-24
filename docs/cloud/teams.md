# Cloud Teams

> Teams are an organizational system that provide consolidated billing on Projects. Teams group Accounts together as
> Team Members, allowing Team Members to manage the same Project(s).

[[toc]]

## Create a Team

![Create Team](https://cdn.directus.io/docs/v9/cloud/teams/teams-20220322A/creating-a-team-20220225A.webp)

Teams are how you organize Projects and share them across multiple Accounts. They're free, so create as many as you'd
like! To create a Team, follow the steps below.

1. Open the Team Menu in the Dashboard Header and click **"Create a Team <span mi icon prmry>add</span>"**. The Create
   Team Page will open.
2. Enter a Team Name, Team Slug, and click **"Save"**.

:::tip Team Names and Team Slugs

The Team Name is a text name assigned to a Team, which you see on-screen. The Team slug defines your Team within the URL
`https://directus.cloud/TEAM-SLUG/projects`. These are purely organizational, allowing you to easily remember the Team
and link to specific Cloud Dashboards. They have no impact on the functionality of your Team or its Projects.

:::

## Update Team Settings

![Managing a Team](https://cdn.directus.io/docs/v9/cloud/teams/teams-20220322A/managing-a-team-20220225A.webp)

The Settings Page enables changes to the Team Name and Team Slug. These can be changed at any time without affecting
Projects within. To update Team Settings, follow the steps below.

1. Open the Team Menu in the Dashboard Header and click the Team you wish to manage.
2. Click **"Settings"** to enter the Team Settings Page.
3. Toggle <span mi icon prmry>edit</span> to allow edits.
4. Edit Team Name and Team Slug as desired.
5. Click the **"Save"** button.

## Destroy a Team

![Destroying a Team](https://cdn.directus.io/docs/v9/cloud/teams/teams-20220322A/destroy-a-team-20220225A.webp)

This action is permanent and irreversible. Destroying a Directus Cloud Team completely removes all its data from our
platform. To destroy a Team, follow the steps below.

1. Open the Team Menu in the Dashboard Header and click the Team you wish to destroy.
2. Click **"Settings"** to enter the Team Settings Page.
3. Scroll down to the "Destroy this Team" section.
4. Toggle <span mi icon dngr>local_fire_department</span> and an input box will appear.
5. Type the Team Name into the input box.
6. Click **"Destroy Team"**.

::: danger DANGER!

Action is permanent and irreversible, proceed with caution.

:::

::: tip Teams with Active Projects

To delete a team, you must first delete any active projects within it.

:::

## View Team Activity

![View Team Activity](https://cdn.directus.io/docs/v9/cloud/teams/teams-20220322A/view-team-activity-20220322A.webp)

The Team Activity Page displays created and destroyed Projects, billing information changes, Team Members added or
removed, name and slug changes, as well as any other major Team-oriented activities. To view Team Activity, follow the
steps below.

1. Open the Team Menu in the Dashboard Header and select the desired Team.
2. Click **"Activity"**.

## View Billing Details

![View Billing Details](https://cdn.directus.io/docs/v9/cloud/teams/teams-20220322A/view-billing-details-20220322A.webp)

Please follow these steps to see billing details such as credit available to Team Projects, total active subscriptions,
and invoice receipts. [Learn More](/cloud/glossary/#billing).

1. Open the Team Menu in the Dashboard Header and select the desired Team.
2. Click **"Billing"** to enter the Billing Details Page.

## Manage Billing

![Manage Billing](https://cdn.directus.io/docs/v9/cloud/teams/teams-20220322A/manage-billing-20220322A.webp)

To change a default payment method, add or remove additional payment methods, and change other billing details follow
the steps below. [Learn More](/cloud/glossary/#billing).

1. Open the Team Menu in the Dashboard Header and select the desired Team.
2. Click **"Billing"** to enter the Billing Details Page.
3. Click **"Manage Billing"** to enter the Stripe payments gateway.
4. Adjust payment methods and details as needed.
5. Click **"Return to Directus Cloud"**.

:::tip Stripe Payment

To handle billing, Directus Cloud uses Stripe, a secure, industry-leading, dynamic, international billing service.

:::

## Invite Team Members

![Inviting a Team Member](https://cdn.directus.io/docs/v9/cloud/teams/teams-20220322A/inviting-a-team-member-20220225A.webp)

All Team Members can invite new Members via email. Each invitee will be emailed a link to accept invitation and join the
Team. To invite Team Members, follow the steps below.

1. Open the Team Menu in the Dashboard Header and select the desired Team.
2. Click **"Members"** to enter the Members Page.
3. Scroll down to the Invite New Members section.
4. Enter one or more email(s), comma separated.
5. Click **"Send Invites"**.

## Manage Team Members

![Removing a Team member](https://cdn.directus.io/docs/v9/cloud/teams/teams-20220322A/leaving-a-team-20220225A.webp)

All Team Members have the ability to remove other Members or invites from a Team. To remove Members or leave a Team
yourself, follow the steps below.

1. Open the Team Menu in the Dashboard Header and select the desired Team.
2. Click **"Members"** to enter the Members Page.
3. Click <span mi icon>exit_to_app</span> or <span icon>close</span> button on the desired Member.
4. Click **"Confirm"**.

:::warning

Be Careful! If an Account leaves or is removed from a Team, it will be fully "locked out" of the Team until re-invited
by another Member.

:::
