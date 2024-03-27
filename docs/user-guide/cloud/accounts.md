---
description:
  Creating an Account is easy and free. Your Account gives you SuperAdmin access to your Teams and Projects on Directus
  Cloud, enabling you to create and manage Teams, Team Members, Projects, and Project Billing.
readTime: 3 min read
---

# Managing Cloud Accounts

> An Account is your portal to Directus Cloud. You can use it to manage your Teams, Team Members, Projects and billing.
> To avoid confusion, "User" is the term for user profiles in a Directus Project, while the terms "Account" and "Team
> Member" are used in the context of Directus Cloud. _Accounts on Directus Cloud_ and _Users in a Directus Project_ are
> two separate systems.

## Create Account and Login

![Create Account and Login](https://cdn.directus.io/docs/v9/cloud/accounts/accounts-20220322A/login-page-20220225A.webp)

Creating an Account is easy and free. As we talked about in the [Overview](/user-guide/cloud/overview), we've made life
easy for you by giving you the option to create and log in to your free Cloud Account automatically with GitHub. If you
don't have a GitHub account or prefer not to use this login method, email-and-password login is available, as well. In
either case, simply go to the [Login Page](https://directus.cloud/login) and follow the prompts.

## Manage Account

![Manage Account](https://cdn.directus.io/docs/v9/cloud/accounts/accounts-20220322A/managing-your-account-20220225A.webp)

To update your name or email:

1. Click <span mi icon>account_circle</span> in the Dashboard Header to enter your Account page.
2. Toggle <span mi icon prmry>edit</span> to allow edits.
3. Change your name and email as desired.
4. Click the **"Save"** button.

## Reset Password

![User Account](https://cdn.directus.io/docs/v9/cloud/accounts/accounts-20220322A/reset-password-20220322A.webp)

To reset your password:

1. Click <span mi icon>account_circle</span> in the Dashboard Header to enter your Account page.
2. Click **"Send Reset Link"**. An email will be sent to reset password.
3. Log in to the email associated with your Account.
4. Open the email and click **"Reset Password"**. You will be directed to the Password Reset page.
5. Reset the password as desired and click **"Reset Password"**.

## Destroy Account

![Destroy Account](https://cdn.directus.io/docs/v9/cloud/accounts/accounts-20220322A/destroying-your-account-20220225A.webp)

To destroy your Directus Cloud Account:

1. Click <span mi icon>account_circle</span> in the Dashboard Header to enter your Account page.
2. Toggle <span mi icon dngr>local_fire_department</span> and an input box will appear.
3. Type in your password, then click the **"Destroy Account"** button.

::: danger

Destroying your Account completely removes your Account and data from Directus Cloud. This action is permanent and
irreversible. Proceed with caution!

:::

::: tip Must leave all Teams before deleting

You cannot destroy your Account if you are a Member of one or more Teams. Leave all associated Teams before destroying
your Account.

:::
