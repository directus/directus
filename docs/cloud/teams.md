# Teams

> Teams group Accounts together as Team Members, allowing Team Members to access and manage the same Project(s).

[[toc]]

## Create a Team

![Create Team](https://cdn.directus.io/docs/v9/cloud/accounts-and-teams/accounts-and-teams-20220228A/creating-a-team-20220225A.webp)

Teams are how you organize Projects and share them across multiple Accounts. They're free, so create as many as you'd
like! Just follow these steps:

1. Login to the Cloud Dashboard.
2. Open the Team Menu in the Dashboard Header.
3. In the dropdown, click **"Create a Team <span mi icon prmry>add</span>"** and the Create Team Page will open.
4. Enter a Team Name, Team Slug, and click **"Save"**.

## Edit Team Name and Slug

![Managing a Team](https://cdn.directus.io/docs/v9/cloud/accounts-and-teams/accounts-and-teams-20220228A/managing-a-team-20220225A.webp)

The Settings Page enables changes to the Team Name and Team Slug. These can be changed at any time without affecting
Projects within.

1. Login to the Cloud Dashboard.
2. Open the Team Menu in the Dashboard Header.
3. In the dropdown, click to select the Team you wish to manage.
4. Click **"Settings"** to enter the Team Settings Page.
5. Toggle <span mi icon prmry>edit</span> to allow edits.
6. Make your changes as desired.
7. Click the **"Save"** button.

## Destroy a Team

![Destroying a Team](https://cdn.directus.io/docs/v9/cloud/accounts-and-teams/accounts-and-teams-20220228A/destroy-a-team-20220225A.webp)

This action is permanent and irreversible. Destroying a Directus Cloud Team completely removes all its data from our
platform. To destroy a Team, follow these steps:

1. Login to the Cloud Dashboard.
2. Open the Team Menu in the Dashboard Header.
3. In the dropdown, click to select the Team you wish to destroy.
4. Click **"Settings"** to enter the Team Settings Page.
5. Scroll down to the "Destroy this Team" section.
6. Toggle <span mi icon dngr>local_fire_department</span> and an input box will appear.
7. Type the Team Name into the input box.
8. Click **"Destroy Team"**.

::: tip Destroy Contained Project First

You will be unable to destroy a Team if it contains one or more Projects.

:::

::: danger DANGER!

Action is permanent and irreversible, proceed with caution.

:::

## View Team Activity

![View Team Activity](image.webp)

The Team Activity Page displays created and destroyed Projects, billing information changes, Team Members added or
removed, name and slug changes, as well as any other major Team-oriented activities.

1. Login to the Cloud Dashboard.
2. Open the Team Menu in the Dashboard Header.
3. In the dropdown, click to select the appropriate Team.
4. Click **"Activity"**.

## View Billing Details

![View Billing Details](image.webp)

Please follow these steps see billing details such as credit available to Team Projects, total active subscriptions (to
Standard Projects), and invoice receipts:

1. Login to the Cloud Dashboard.
2. Open the Team Menu in the Dashboard Header.
3. In the dropdown, click to select the appropriate Team.
4. Click **"Billing"** to enter the Billing Details Page.

Learn more about [Billing](/cloud/glossary/#billing).

## Manage Billing

<video alt="Manage Billing" loop muted controls autoplay>
  <source src="" type="video/mp4">
</video>

To change a default payment method, add or remove additional payment methods, and change other billing details follow
these steps:

1. Login to the Cloud Dashboard.
2. Open the Team Menu in the Dashboard Header.
3. In the dropdown, click to select the appropriate Team.
4. Click **"Billing"** to enter the Billing Details Page.
5. Click **"Manage Billing"** to enter the Stripe payments gateway.
6. Adjust payment methods and details as needed.
7. Click **"Return to Directus Cloud"**.

Learn more about [Billing](/cloud/glossary/#billing).

## Invite Team Members

![Inviting a Team Member](https://cdn.directus.io/docs/v9/cloud/accounts-and-teams/accounts-and-teams-20220228A/inviting-a-team-member-20220225A.webp)

All Team Members can invite new Members via email. Each invitee will be emailed a link to accept invitation and join the
Team. Just follow these steps:

1. Login to the Cloud Dashboard.
2. Open the Team Menu in the Dashboard Header.
3. Select the appropriate Team from the dropdown.
4. Click **"Members"** to enter the Members Page.
5. Scroll down to the Invite New Members section.
6. Enter one or more email(s), comma separated.
7. Click **"Send Invites"**.

## Remove Members or Leave Team

![Removing a Team member](https://cdn.directus.io/docs/v9/cloud/accounts-and-teams/accounts-and-teams-20220228A/leaving-a-team-20220225A.webp)

All Team Members have the ability to remove other Members or invites from a Team. To remove Members or leave a Team
yourself, follow these steps:

1. Login to the Cloud Dashboard.
2. Open the Team Menu in the Dashboard Header.
3. Select the appropriate Team from the dropdown.
4. Click **"Members"** to enter the Members Page.
5. Click <span mi icon>exit_to_app</span> or <span icon>close</span> button on the desired Member.
6. Click **"Confirm"**.

:::warning Removed Accounts are "Locked Out"

Be Careful! If an Account leaves or is removed from a Team, it will be fully "locked out" of the Team until re-invited
by another Member.

:::
