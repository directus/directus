# Teams

> Teams group Members together and give them access to the same Project(s).

[[toc]]

## Create a Team

![Create Team](https://cdn.directus.io/docs/v9/cloud/accounts-and-teams/accounts-and-teams-20220228A/creating-a-team-20220225A.webp)

Teams are how you organize Projects and share them across multiple accounts. They're free, so create as many as you'd
like!

1. Login to the Cloud Dashboard.
2. Open the Team Menu in the Dashboard Header.
3. In the dropdown, click <span mi icon prmry>add</span> and the Create Team page will open.
4. Enter a Team Name, Team Slug, and click **"Save"**.

## Edit Team Name and Slug

![Managing a Team](https://cdn.directus.io/docs/v9/cloud/accounts-and-teams/accounts-and-teams-20220228A/managing-a-team-20220225A.webp)

The Settings Page enables changes to the Team Name and Team Slug. These can be changed at any time without effecting
Projects within.

1. Login to the Cloud Dashboard.
2. Open the Team Menu in the Dashboard Header.
3. In the dropdown, click to select the Team you wish to manage.
4. Navigate to the Settings page.
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
4. Navigate to the Settings page.
5. Scroll down to the "Destroy this Team" section.
6. Toggle <span mi icon dngr>local_fire_department</span> and an input box will appear.
7. Enter the team name into the input box.
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
removed, name and slug changes, as well as any other major Team-oriented changes.

## View Billing Details

For full billing details, see [Billing](/cloud/glossary/#billing).

![View Billing Details](image.webp)

1. Login to the Cloud Dashboard.
2. Open the Team Menu in the Dashboard Header.
3. In the dropdown, click to select the Team which manages the Project you wish to view billing details for.
4. Click **"Billing"** to enter the Billing Details Page.

On this page, you will be able to view credit available to Team Projects, total active subscriptions (a.k.a. Standard
Projects), and invoice receipts.

## Manage Billing

For full billing details, see [Billing](/cloud/glossary/#billing).

<video alt="Manage Billing" loop muted controls autoplay>
  <source src="" type="video/mp4">
</video>

1. Login to the Cloud Dashboard.
2. Open the Team Menu in the Dashboard Header.
3. In the dropdown, click to select the Team which manages the Project you wish to manage billing details for.
4. Click **"Billing"** to enter the Billing Details Page.
5. Click **"Manage Billing"** to enter the Stripe payments gateway.
6. Adjust credit card details as needed.
7. Click **"Return to Directus Cloud"**.

## Invite Team Member(s)

![Inviting a Team Member](https://cdn.directus.io/docs/v9/cloud/accounts-and-teams/accounts-and-teams-20220228A/inviting-a-team-member-20220225A.webp)

All members of a Team can invite new Members via email. Each invitee will be emailed a link to accept invitation and
join the Team.

1. Login to the Cloud Dashboard.
2. Open the Team Menu in the Dashboard Header.
3. Select the appropriate Team from the dropdown.
4. Navigate to the Members page.
5. Scroll down to the Invite New Members section.
6. Enter one or more email(s), comma separated.
7. Click **"Send Invites"**.

::: tip Adding Members to Projects

By default, Team members are not given user access to the Team's Projects. To manage a Project's Users, see the
documentation for [User Directory](/app/user-directory).

:::

## Remove Members and Leave Team

![Removing a Team member](https://cdn.directus.io/docs/v9/cloud/accounts-and-teams/accounts-and-teams-20220228A/leaving-a-team-20220225A.webp)

All Team Members have the ability to remove other members or invites from a Team. To Remove Members or leave a team
yourself, follow these steps:

1. Sign in to the Cloud Dashboard.
2. Open the Team Menu in the Dashboard Header.
3. Select the appropriate Team from the dropdown.
4. Navigate to the "Members" page.
5. Click <span mi icon>exit_to_app</span> or <span icon>close</span> button on the desired Member(s).
6. Click confirm to remove.

:::warning Removed Accounts are "Locked Out"

Be Careful! If an Account leaves or is removed from a Team, it will be fully "locked out" of the Team until re-invited
by another team Member.

:::
