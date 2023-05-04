---
description:
  Get up and running with Directus Cloud in minutes. Learn the basics of building your data model and managing
  permissions.
readTime: 7 min read
---

# Quickstart Guide

> This quickstart guide is designed to get you up and running with a Directus Cloud Project in a snap. Along the way,
> you will better understand what Directus is, setup your free Directus Cloud Account, get a _hands-on introduction_ to
> the App and API, and find more resources to deep-dive into.

## 1. Create Cloud Account and Login

First, you'll need to create an Account and log in on [Directus Cloud](https://directus.cloud/login).

Your Directus Cloud Account allows you to create and manage any number of Projects. We've made life easier by giving you
the option to create and log in to your free Cloud Account automatically with GitHub. If you don't have a GitHub account
or prefer not to use this login method, email-and-password login is available as well.

The very first time you log in to your Cloud Account, you will be prompted to create a Team. Teams are totally free to
create. Each Directus Cloud Project exists within the scope of one Team. They allow you to organize Team Members,
Projects and Project Billing as desired.

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

:::tip Check All Inbox Folders

Due to the algorithms used by some email providers, it is possible the email containing your Project login information
will end up in another folder like "Social" or "Promotions".

:::

## 3. Create a Collection

Once logged in, you're greeted with the option to create your first [Collection](/getting-started/glossary#collections).

1. Navigate into the Content Module.
2. Click **"Create Collection"** and a side menu will appear.
3. Fill in a **Name**.\
   For the sake of this demo, we'll call ours `articles`, but feel free to make it your own!
4. Leave the other options at default. Click <span mi btn>arrow_forward</span> and the **"Optional System Fields"** menu
   will open.\
   Keep the values in this menu at the default, toggled off, for now. You can adjust them later.
5. Click <span mi btn>check</span> in the menu header.

:::tip Learn More About Collections

- [The Content Module](/app/content)
- [Create and Manage a Collection](/app/data-model/collections)
- [Build Relationships Between Collections](/app/data-model/relationships)

:::

## 4. Create a Field

With your first Collection created, it's time to start adding some [Fields](/getting-started/glossary#fields).

1. Navigate to **Settings Module > Data Model > `Collection-Name`**.
2. Click the **"Create Field"** button and select the **"Input"** Field type.
3. Fill in a Field name under **Key**. We'll be calling our Field `title`.\
   Directus offers powerful Field customization options, but let's stick to the defaults for now.
4. Select **"Save"**.

::: tip Learn More About Fields

- [Create and Manage Fields in the App](/app/data-model)

:::

## 5. Create an Item

Now that we have a Collection with a Field configured, it's time to add an [Item](/getting-started/glossary#).

1. Navigate to the Content Module.
2. Click <span mi btn>add</span> in the page header to open the Item Page.
3. Fill in the Field Value(s) as desired.
4. Click <span mi btn>check</span> in the top-right to save your Item.

:::tip Learn More About Items

- [The Content Module](/app/content)
- [The Item Page](/app/content/items)

:::

## 6. Set Roles & Permissions

Directus comes with two built-in roles: Public and Admin. The Public Role determines what data is returned to
non-authenticated users. Public comes with all permissions turned off and can be reconfigured with fully granular
control to expose exactly what you want unauthenticated Users to see. The Admin role has full permissions and this
cannot be changed. Aside from these built-in Roles, any number of new Roles can be created, all with fully customized,
granular permissions.

By Default, content entered into Directus will be considered private. So permissions always start off set to the default
of <span mi icon dngr>block</span> **No Access**, with full ability to reconfigure as desired. So, in order to have the
API return our Items, let's add some read permissions. For simplicity's sake, we'll do this on the Public Role, instead
of creating a new Role.

1. Navigate to **Settings Module > Roles & Permissions > Public**.
2. Click <span mi icon dngr>block</span> under the <span mi icon>visibility</span> icon on the desired Collection.\
   In our case, the Collection name is `article`.
3. Click **"All Access"** to give the Public Role full read permissions to the Items in this Collection.

::: tip Learn More About Roles & Permissions

- [Users, Roles and Permissions](/app/users-roles-permissions).

:::

## 7. Connect to the API

Now that your Project has some content in it which is exposed to the Public, it's time to start using this content
externally! Data can be accessed in a number of ways, including the REST and GraphQL API endpoints. In this case, we'll
use the `/items/` [REST API endpoint](/reference/items) to retrieve the Item we just created.

1. Open `http://your-project-url.directus.app/items/articles`.\
   You can use the browser or an API tool like [Postman](http://postman.com) or [Paw](https://paw.cloud)

_And there it is! The Article Item you just created is being served in beautiful JSON, ready to be used anywhere and
everywhere!_

```json
{
	"data": [
		{
			"id": 1,
			"title": "Hello World!"
		}
	]
}
```

_In this example, we made a super-simple read request with the API, but there's more! The REST and GraphQL APIs provide
exhaustive endpoints for the data model and every single action that you can do in the App can be done via the API. In
fact, the App is just a GUI powered by the API._

:::tip Learn More About The API

- [Intro to the API](/reference/introduction)
- [JS SDK](/reference/sdk)

:::
