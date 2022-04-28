# Quickstart Guide

> This quickstart guide is designed to get you up and running with a Directus Cloud Project in a snap. Along the way,
> you will better understand what Directus is, setup your free Directus Cloud Account, get hands-on experience with the
> App and API, and find more resources to deep-dive into the App and API.

## 1. Create Cloud Account and Login

<video autoplay muted loop controls>
<source src="https://cdn.directus.io/docs/v9/getting-started/quickstart/quickstart-20220427A/create-account-and-login-20220427.mp4" type="video/mp4" />
</video>

First, you'll need to [create an Account and log in](/cloud/accounts/#create-account-and-login) on
[Directus Cloud](https://directus.cloud/login)

Your Directus Cloud Account allows you to create and manage any number of Community and Standard Projects. We've made
life easier by giving you the option to create and log in to your free Cloud Account automatically with Github. If you
don't have a Github account or prefer not to use this login method, email-and-password login is available, as well.

The very first time you log in after account creation, you will be prompted to create a Team. Teams allow you to
organize Team Members, Projects and Project Billing as desired.

:::tip Learn more About Cloud

- [Overview](/cloud/overview/)
- [Cloud Accounts](/cloud/accounts/)
- [Cloud Teams](/cloud/teams/)

:::

## 2. Create and Access Project

<video autoplay muted loop controls>
<source src="https://cdn.directus.io/docs/v9/getting-started/quickstart/quickstart-20220427A/create-and-access-project-20220427A.mp4" type="video/mp4" />
</video>

You will need to create a [Team](/cloud/teams/) or navigate to the existing Team under which you want to create a
Community Project. To create a Community Project, follow the steps below:

1. Open the Team Menu in the Dashboard Header and select or [create](/cloud/teams/#create-a-team) the desired Team.
2. Navigate to **"Projects"** and click **"Create Project"**.
3. Set the Project Name.
4. Select the Community tier.
5. Scroll to the bottom of the screen and choose the **"Empty Project"** Starting Template.\
   Note the **"Demo Project"** adds in dummy data for more in-depth demo purposes.
6. Click **"Create Project"**.

_It should take around 90 seconds for the Cloud Project to build out. During this time, a link will be sent to the email
associated with your Cloud Account. The email will contain your Project URL as well as an email and password to login.
If you used GitHub to create your account, this will be your GitHub email. Once the build is complete, it's time log
in!_

7. You can [access a Project](/cloud/projects/#access-a-project) from within the Cloud Dashboard or type the URL into
   your browser.
8. Log in with your username and password from the email.

:::tip Check All Inboxes

Due to the algorithms used by some email providers, it is possible the email containing your Project URL, email and
password will end up in another non-primary folder such as "Social" or "Promotions". Be sure to check all inbox mail.

:::

:::tip Learn More About Teams and Projects

- [Overview](/cloud/overview/)
- [Cloud Projects](/cloud/projects/)

:::

## 3. Create a Collection

<video autoplay muted loop controls>
<source src="https://cdn.directus.io/docs/v9/getting-started/quickstart/quickstart-20220427A/create-a-collection-20220427A.mp4" type="video/mp4" />
</video>

Once logged in, you're greeted with the option to create your first
[Collection](/getting-started/glossary/#collections).

1. Navigate into the Content Module.
2. Click **"Create Collection"** and a side menu will appear.
3. Fill in a **Name**.\
   For the sake of this demo, we'll be calling ours `articles`, but feel free to make it your own!
4. Leave the other settings at default and click <span mi btn>arrow*forward</span> and the **"Optional System Fields"**
   will open. Keep the values in this menu at default *(toggled off)\_ for now. You can adjust these later.
5. Click <span mi btn>check</span> in the menu header.

:::tip Learn More About Collections

- [The Content Module](/app/content)
- [Create and Manage a Collection](/configuration/data-model/)
- [Build Relationships Between Collections](/configuration/relationships/)

:::

<!--
@TODO configuration > data-model
Change the link to the "Create a Collection" format
-->

## 4. Create a Field

<video autoplay muted loop controls>
<source src="https://cdn.directus.io/docs/v9/getting-started/quickstart/quickstart-20220427A/create-a-field-20220427A.mp4" type="video/mp4" />
</video>

With your first Collection created, it's time to start adding some [Fields](/getting-started/glossary/#fields).

1. Navigate to **Settings Module > Data Model > `Collection-Name`**.
2. Click the **"Create Field"** button and select the **"Input"** Field type.
3. Fill in a Field name under **Key**. We'll be calling our Field `title`.\
   While Directus offers a range of powerful field customization options, we'll be sticking to the defaults for now. These
   defaults use the "String" datatype.
4. Select **"Save"**.

::: tip Learn More About Fields

- [Create and Manage Fields in the App](/configuration/data-model/)

:::

## 5. Create an Item

<video autoplay muted loop controls>
<source src="https://cdn.directus.io/docs/v9/getting-started/quickstart/quickstart-20220427A/create-an-item-20220427B.mp4" type="video/mp4" />
</video>

Now that we have a Collection with a Field configured, it's time to add an [Item](/getting-started/glossary/#).

1. Navigate to the Content Module.
2. Click <span mi btn>add</span> in the page header to open the Item Page.
3. Fill in the Field Value(s) as desired.
4. Click <span mi btn>check</span> in the top-right to save your Item.

:::tip Learn More About Items

- [The Content Module](/app/content/)
- [The Item Page](/app/content/items)

:::

## 6. Set Roles & Permissions

<video autoplay muted loop controls>
<source src="https://cdn.directus.io/docs/v9/getting-started/quickstart/quickstart-20220427A/set-read-permissions-20220427A.mp4" type="video/mp4" />
</video>

Directus comes with two built-in roles: Public and Admin. The Public Role determines what data is returned to
non-authenticated users. Public comes with all permissions turned off and can be reconfigured with fully granular
control to expose exactly what you want unauthenticated Users to see. The Admin role has full permissions and this
cannot be changed. Aside from these built-in Roles, any number of new Roles can be created, all with fully customized,
granular permissions.

By Default, content entered into Directus will be considered private, with permissions always set to the default of "No
Access" for all Roles and the full ability to reconfigure as desired. This means that no data will be returned by the
API unless it is available to Public or requested by an authenticated User that has the correct permissions.

Thus, in order to have the API return our Items, we'll have to add some read permissions. For simplicity's sake, we'll
do this on the Public Role, instead of creating a new Role.

1. Navigate to **Settings Module > Roles & Permissions > Public**.
2. Click <span mi icon dngr>block</span> under the <span mi icon>visibility</span> icon on the desired Collection.\
   In our case, the Collection name is `article`.
3. Click **"All Access"** to give the Public Role full read permissions to the Items in this Collection.

::: tip Learn More About Roles & Permissions

- Manage [Users, Roles and Permissions](/configuration/users-roles-permissions/).

:::

## 7. Connect to the API

Now that your Project has some content in it which is exposed to the Public, it's time to start using this content
externally! Data can be accessed in a number of ways, including the REST and GraphQL API Enpoints. In this case, we'll
use the `/items/` [REST API endpoint](/reference/items) to retrieve the item we just created.

Open [http://localhost:8055/items/articles](http://localhost:8055/items/articles) in the browser or an API tool like
[Postman](http://postman.com) or [Paw](https://paw.cloud)

And there it is! The Article Item you just created is being served in beautiful JSON, ready to be used anywhere and
everywhere!

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
exhaustive endpoints for the data model and every single action that you can do in the App can be done via the API._

:::tip Learn More About The API

- [Intro to the API](/reference/introduction/)
- [JS SDK](/reference/sdk/)

:::
