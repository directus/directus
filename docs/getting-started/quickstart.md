# Quickstart Guide

> This quickstart guide is designed to get you up and running with a Directus Cloud Project in a snap. Along the way,
> you will better understand what Directus is, setup your free Directus Cloud Account, get hands-on experience with the
> App and API, and find more resources and documentation to deep-dive into the App and API.

[[toc]]

## 1. Create Cloud Project and Login

<video autoplay muted loop controls>
<source src="" type="video/mp4" />
</video>

1. First, you'll need to [create and log in](/cloud/accounts/#create-account-and-login) to your Directus Cloud Account.
2. Next, you will need to [create a Team](/cloud/teams/#create-a-team) or navigate to an existing Team.
3. Now you're ready to [create a Community Project](/cloud/projects/#create-a-community-project).

_It should take around 90 seconds for the Cloud Project to build out. During this time, a link will be sent to the email
associated with you Cloud Account. The email will contain your Project URL as well as an email and password to login. If
you used GitHub to create your account, this will be your GitHub email. Once the build is complete, it's time log in to
the app!_

4. You can [access a Project](/cloud/projects/#access-a-project) from within the Cloud Dashboard or type the URL into
   your browser.
5. Log in with username and password from the email.

:::tip Check All Inboxes

Due to the algorithms used by some email providers, it is possible the email containing your Project URL, email and
password will end up in another non-primary folder such as "Social" or "Promotions". Be sure to check all inbox mail.

:::

## 3. Create a Collection

![Directus Empty State](https://cdn.directus.io/docs/v9/getting-started/quickstart/quickstart-20220217A/empty-state-20220217A.webp)

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
<source src="https://cdn.directus.io/docs/v9/getting-started/quickstart/quickstart-20220217A/add-field-20220217A.mp4" type="video/mp4" />
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

![Directus Create Item](https://cdn.directus.io/docs/v9/getting-started/quickstart/quickstart-20220217A/create-item-20220217A.webp)

Now that we have a Collection with a Field configured, it's time to add an [Item](/getting-started/glossary/#).

1. Navigate to the Content Module.
2. Click <span mi btn>add</span> in the page header to open the Item Page.
3. Set the Field Value(s) as desired and click <span mi btn>check</span> in the top-right to save your Item.

:::tip Learn More About Items

- [The Content Module](/app/content/)
- [The Item Page](/app/content/items)

:::

## 6. Set Roles & Permissions

![Directus Permissions](https://cdn.directus.io/docs/v9/getting-started/quickstart/quickstart-20220217A/permissions-20220217A.webp)

Directus comes with two built-in roles: Public and Admin. The Public Role determines what data is returned to
non-authenticated users. This Role comes with all permissions turned off, but can be reconfigured with fully granular
control to expose exactly what you want unauthenticated Users to see. The Admin role has full permissions and this
cannot be changed. Aside from these built-in Roles, any number of new Roles can be created, all with fully customized,
granular permissions.

By Default, content entered into Directus will be considered private, with permissions always set to the default of "No
Access" for all Roles and must be reconfigured for each Role. This means that no data will be returned by the API unless
it is available to Public or requested by an authenticated User that has the correct permissions.

Thus, in order to have the API return our Items, we'll have to reconfigure some permissions. For simplicity's sake,
we'll do this on the Public Role, instead of creating a new Role.

1. Navigate to **Settings Module > Roles & Permissions > Public**.
2. Click <span mi icon dngr>block</span> under the <span mi icon>visibility</span> icon on the desired Collection to
   open read access permissions.\
   In our case, the Collection name is `article`.
3. Click **"All Access"** to give the Public Role full read permissions to the Items in this Collection.

::: tip Learn More About Roles & Permissions

- Manage [Users, Roles and Permissions](/configuration/users-roles-permissions/) in the App.
- Manage [Users](/reference/system/users/), [Roles](/reference/system/roles), and
  [Permissions](/reference/system/permissions) via the API.

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
