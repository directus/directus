---
description:
  A Team is an organizational system that groups Accounts together as Team Members and provides consolidated billing on
  its nested Projects.
readTime: 10 min read
---

# Cloud Teams

> A Team is an organizational system that groups Accounts together as Team Members and provides consolidated billing on
> its nested Projects. Teams within the Cloud Dashboard allow individuals to separate or consolidate Projects and
> payment methods, as well as manage Projects independently or with other Team Members.

For example, a company can use Teams to organize Projects by department, each with consolidated billing and scoped
access. Similarly, agencies or freelancers with multiple customers can create a Team per client to limit their access
and isolate billing. Teams are free, so create as many as you need to appropriately organize Team Members, Projects and
payment methods.

## Create a Team

![Create Team](https://cdn.directus.io/docs/v9/cloud/teams/teams-20220322A/create-a-team-20220329A.webp)

To create a Team:

1. Open the Team Menu in the Dashboard Header and click **"Create a Team <span mi icon prmry>add</span>"**.\
   The Create Team page will open.
2. Enter a Team Name and Team Slug, then click **"Save"**.

::: tip Team Name and Team Slug

The Team Name is a text name assigned to a Team, used in the Cloud Dashboard. The Team slug lies within the full URL
`https://directus.cloud/TEAM-SLUG/projects`. These are purely organizational, allowing you to easily remember the Team
and link to specific Cloud Dashboards. They do not impact Cloud Projects or billing and can be
[updated at any time](#update-team-settings).

:::

## Update Team Settings

![Managing a Team](https://cdn.directus.io/docs/v9/cloud/teams/teams-20220322A/managing-a-team-20220225A.webp)

To update Team Settings:

1. Open the Team Menu in the Dashboard Header and select the desired Team.
2. Click **"Settings"** to enter the Team Settings page.
3. Toggle <span mi icon prmry>edit</span> to allow edits.
4. Edit Team Name and Team Slug as desired.
5. Click the **"Save"** button.

## View Team Activity

![View Team Activity](https://cdn.directus.io/docs/v9/cloud/teams/teams-20220322A/view-team-activity-20220322A.webp)

The Team Activity Page displays billing information changes, created and destroyed Projects, Team Members added or
removed, Team Name and Team Slug changes, and any other major Team-oriented activities. To view Team Activity:

1. Open the Team Menu in the Dashboard Header and select the desired Team.
2. Click **"Activity"**.

## Invite Team Members

![Inviting a Team Member](https://cdn.directus.io/docs/v9/cloud/teams/teams-20220322A/inviting-a-team-member-20220225A.webp)

All Team Members can invite new Members via email. Each invitee will be emailed a link to accept the invitation and join
the Team. To invite Team Members:

1. Open the Team Menu in the Dashboard Header and select the desired Team.
2. Click **"Members"** to enter the Members Page.
3. Scroll down to the Invite New Members section.
4. Enter one or more email(s), comma separated.
5. Click **"Send Invites."**

::: tip

Clicking the emailed invitation link does not automatically create an Account for you. Invitees will need to
[create an Account](/user-guide/cloud/accounts#create-account-and-login) before accepting an invitation to join a Team.

:::

## Manage Team Members

![Removing a Team member](https://cdn.directus.io/docs/v9/cloud/teams/teams-20220322A/leaving-a-team-20220225A.webp)

All Team Members have the ability to remove other Members or invites from a Team. To remove Members or leave a Team
yourself:

1. Open the Team Menu in the Dashboard Header and select the desired Team.
2. Click **"Members"** to enter the Members Page.
3. Click the <span mi icon>exit_to_app</span> or <span mi icon>close</span> button on the desired Member.
4. Click **"Confirm"**.

::: warning

If an Account leaves or is removed from a Team, it will be fully "locked out" of the Team until re-invited by another
Member.

:::

## Destroy a Team

![Destroying a Team](https://cdn.directus.io/docs/v9/cloud/teams/teams-20220322A/destroy-a-team-20220225A.webp)

To destroy a Team:

1. Open the Team Menu in the Dashboard Header and select the desired Team.
2. Click **"Settings"** to enter the Team Settings Page.
3. Scroll down to the "Destroy this Team" section.
4. Toggle <span mi icon dngr>local_fire_department</span> and an input box will appear.
5. Type the Team Name into the input box.
6. Click **"Destroy Team"**.

::: danger

Destroying a Team completely removes all its data from Directus Cloud. This action is permanent and irreversible.
Proceed with caution!

:::

::: tip Teams with Active Projects

To delete a Team, you must first delete any active Projects within it.

:::
