---
description:
  Get up and running with Directus Cloud in minutes. Learn the basics of building your data model and managing
  permissions.
readTime: 7 min read
---

# Quickstart Guide

> This quickstart guide is designed to get you up and running with a Directus Cloud Project in a snap. Along the way,
> you will better understand what Directus is, setup your Directus Cloud Account, and get a _hands-on introduction_ to
> the App.

## 1. Create Cloud Account and Login

First, you'll need to create an Account and log in on [Directus Cloud](https://directus.cloud/login).

Your Directus Cloud Account allows you to create and manage any number of Projects. We've made life easier by giving you
the option to create and log in to your Cloud Account automatically with GitHub. If you don't have a GitHub account or
prefer not to use this login method, email-and-password login is available as well.

The very first time you log in to your Cloud Account, you will be prompted to create a Team. Each Directus Cloud Project
exists within the scope of one Team. They allow you to organize Team Members, Projects and Project Billing as desired.

Once your Team is created, it's time to create your Directus Cloud Project!

## 2. Create and Access Project

To create a Project, follow the steps below:

1. Open the Team Menu in the Dashboard Header and select or create the desired Team.
2. Navigate to **"Projects"** and click **"Create Project"**.
3. Set the Project Name and tier.
4. Scroll to the bottom of the screen and choose the **"Empty Project"** Starting Template.\
   Note: The **"Demo Project"** adds in dummy data for in-depth feature demonstrations.
5. Click **"Create Project"**.

_It should take around 90 seconds for the Cloud Project to build out. During this time, a link will be sent to the email
associated with your Cloud Account. The email will contain your Project URL as well as an email and password to login.
If you used GitHub to create your account, this will be your GitHub email. Once the build is complete, it's time log
in!_

7. You can access a Project from within the Cloud Dashboard or type the URL into your browser.
8. Log in with your username and password from the email.

::: tip Check All Inbox Folders

Due to the algorithms used by some email providers, it is possible the email containing your Project login information
will end up in another folder like "Social" or "Promotions".

:::

## 3. Create a Collection

Once logged in, you're greeted with the option to create your first
[Collection](/user-guide/overview/glossary#collections).

1. Navigate into the Content Module.
2. Click **"Create Collection"** and a side menu will appear.
3. Fill in a **Name**.\
   For the sake of this demo, we'll call ours `articles`, but feel free to make it your own!
4. Leave the other options at default. Click <span mi btn>arrow_forward</span> and the **"Optional Fields"** menu will
   open.\
   Keep the values in this menu at the default, toggled off, for now. You can adjust them later.
5. Click <span mi btn>check</span> in the menu header.

::: tip Learn More About Collections

- [The Content Module](/user-guide/content-module/content)
- [Create and Manage a Collection](/app/data-model/collections)
- [Build Relationships Between Collections](/app/data-model/relationships)

:::

## 4. Create a Field

With your first Collection created, it's time to start adding some [Fields](/user-guide/overview/glossary#fields).

1. Navigate to **Settings Module > Data Model > `Collection-Name`**.
2. Click the **"Create Field"** button and select the **"Input"** Field type.
3. Fill in a Field name under **Key**. We'll be calling our Field `title`.\
   Directus offers powerful Field customization options, but let's stick to the defaults for now.
4. Select **"Save"**.

::: tip Learn More About Fields

- [Create and Manage Fields in the App](/app/data-model)

:::

## 5. Create an Item

Now that we have a Collection with a Field configured, it's time to add an [Item](/user-guide/overview/glossary#).

1. Navigate to the Content Module.
2. Click <span mi btn>add</span> in the page header to open the Item Page.
3. Fill in the Field Value(s) as desired.
4. Click <span mi btn>check</span> in the top-right to save your Item.

::: tip Learn More About Items

- [The Content Module](/user-guide/content-module/content)
- [The Item Page](/user-guide/content-module/content/items)

:::
