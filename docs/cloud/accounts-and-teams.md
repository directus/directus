# Accounts and Teams

> You must create an Account and join a Team to access a Directus [Project]. Your Directus Account is as it sounds, a
> typical user account. A Team is the same, it is a group of users that have access to Directus Projects. A user Account
> can have multiple Teams, Teams can have multiple Projects.

[[toc]]

## Creating an Account

![Login Page](image.webp)

Directus Cloud Accounts are how individual users access the platform. Creating a new account is easy and free. You may
your account via Github or enter a username, email, and password manually. Simply go to the
[login page](https://directus.cloud/login) and follow the prompts.

## Signing In to Your Account

![Login Page](image.webp)

Navigate to our Sign In page and enter your account credentials. If you forgot your account's password, you can go to
our Password Reset page.

## Managing your Account

![User Account](image.webp)

You can update your account information at any time by following these steps:

1. Sign in to the Cloud Dashboard.
2. Click <span mi icon>account_circle</span> in the upper right-hand side of the Dashboard Header.
3. Edit your name or email by toggling <span mi icon>edit</span> to the right.
4. Click the **"Save"** button.

## Destroying your Account

![Destroy Account](image.webp)

This action is permanent and irreversible. Destroying your Directus Cloud Account completely removes all your data and
assets from our platform. To destroy your Directus Cloud account, follow these steps:

1. Sign in to the Cloud Dashboard using the account you would like to destroy
2. Click the Account Button in the Dashboard Header
3. Confirm your password, and then click the **"Destroy"** button

::: warning

You can not destroy your account if you are a member of one or more Teams. You must first leave all associated teams
before destroying your account.

:::

::: danger DANGER!

**Action is permanent and irreversible, proceed with caution.**

:::

## Creating a Team

![Create Team](image.webp)

Teams are how you organize Projects and share them across multiple accounts. They're free, so create as many as you'd
like! To create a new team...

1. Sign in to the Cloud Dashboard.
2. Open the Team Menu in the Dashboard Header.
3. Click the **"Create a Team"** option.
4. Enter a team name, unique slug, and click **"Save"**.

## Managing a Team

![Managing a Team]()

After signing in to the Dashboard, you will be taken to your default team (see Account Settings).

1. Sign in to the Cloud Dashboard.
2. Open the Team Menu in the Dashboard Header.
3. Select the team you wish to manage.
4. Navigate to the **"Settings"** page.
5. Edit your Team Name or Slug by toggling <span mi icon>edit</span> to the right.

## Inviting a Team Member

![Inviting a Team Member]()

All members of a team can invite new members. Each invited user will receive an email with a link to accept the
invitation to join the team.

1. Sign in to the Cloud Dashboard.
2. Open the Team Menu in the Dashboard Header.
3. Select the appropriate team from the dropdown.
4. Navigate to the **"Members"** page.
5. Scroll down to the **"Invite New Members"** section.
6. Enter one or more email(s) (comma separated).
7. Click **"Send Invites"**.

## Removing a Team Member

![Removing a Team Member]()

All team members have the ability to remove other members or invites from the team.

1. Sign in to the Cloud Dashboard.
2. Open the Team Menu in the Dashboard Header.
3. Select the appropriate team from the dropdown.
4. Navigate to the "Members" page.
5. Click the "Remove from Team" button for the appropriate member.

## Leaving a Team

![Leaving a Team]()

You can leave a team if you no longer want access, but you can not get access again without being re-invited by another
member. To leave a team, follow these steps:

1. Sign in to the Cloud Dashboard.
2. Open the Team Menu in the Dashboard Header.
3. Select the appropriate team from the dropdown.
4. Navigate to the "Members" page.
5. Click the "Leave Team" button for your account.

## Destroying a Team

![Destroying a Team]()

This action is permanent and irreversible. Destroying a Directus Cloud Team completely removes all its data from our
platform (for all team members). To destroy a Directus Cloud Team, follow these steps:

1. Sign in to the Cloud Dashboard.
2. Open the Team Menu in the Dashboard Header.
3. Select the team you wish to destroy from the dropdown.
4. Navigate to the **Settings** page.
5. Scroll down to the "Destroy this Team" section.
6. Toggle <span mi icon danger>local_fire_department</span> and an input box will appear.
7. Enter the team name into the input box.
8. Click **"Destroy Team"**.

::: tip

You cannot destroy a Team if it contains one or more Projects. Destroy any contained Projects before destroying your
Team.

:::

::: danger DANGER

Action is permanent and irreversible, proceed with caution.

:::
