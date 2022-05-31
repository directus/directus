# Quickstart Guide

> If you're looking for the fastest way to get up-and-running with Directus, this guide will walk you through getting
> things installed, configured, and modeled.

## 1. Installation

Make sure you have the latest LTS version or newer of [Node.js](https://nodejs.dev) installed, and have a running
database ready to connect to.

Run the following command in your terminal and follow the prompts.

```bash
npm init directus-project example-project
```

Choose SQLite from the list. Use up/down arrow keys to select the SQL type.

```bash
? Choose your database client SQLite
```

After that a file path for `data.db`, your database, will be suggested. Hit the enter key to stick with the default
path.

```bash
? Database File Path: <file-path>/example-project/data.db
```

Next you'll set your username/email and password.

```bash
Create your first admin user:
? Email: admin@example.com
? Password: ********
```

After that, you're all set!

```
Your project has been created at <file-path>/example-project.

The configuration can be found in <file-path>/example-project/.env
```

Once the installation is complete, you can start Directus by navigating to your project folder _(in this case
`example-project`)_ and running:

```bash
npx directus start
```

After that, you will see this message:

```bash
✨ Server started at http://localhost:8055
```

#### Other Options

When you link other types of SQL to Directus, you may have additional prompts:

- **Database Host** – IP address for your database.
- **Port** – Port number your database is running on.
- **Database Name** – Name of your existing database.
- **Database User** – Name of existing user in database.
- **Database Password** – Password to enter database.
- **Enable SSL** – Select `Y` for yes or `N` for no.
- **Root** – Provide the root name.

Simply configure these according to your project's needs.

::: warning Directus seeds your database

Directus installs a few dozen tables into the database it is linked to; so if you're adding it to a database with
existing data. However, installation of Directus will not alter the existing data tables.

:::

## 2. Login to App

With the server running, you're now able to login to your new Directus project and start using it.

Our start command stated that the server started at port `8055`, which means we can navigate to
[http://localhost:8055](http://localhost:8055) to open Directus in the browser.

Login using the admin credentials you configured during the installation in Step 1.

## 3. Create a Collection

Once logged in, you're greeted with the option to create your first Collection:

![Directus Empty State](https://cdn.directus.io/docs/v9/getting-started/quickstart/quickstart-20220217A/empty-state-20220217A.webp)

Follow the prompts and create a Collection. For the sake of this demo, we'll be calling ours `articles`, but feel free
to make it your own!

::: tip More Info on Collections

For a more in-depth guide to setting up Collections, see [Collections](/app/content-collections).

:::

## 4. Create a Field

With the Collection created, it's time to start adding some Fields. Click the **"Create Field"** button, and select
**"Input"**:

<video autoplay muted loop controls>
<source src="https://cdn.directus.io/docs/v9/getting-started/quickstart/quickstart-20220217A/add-field-20220217A.mp4" type="video/mp4" />
</video>

We'll be calling our Field `title`. While Directus offers a range of powerful field customization options, we'll be
sticking to the defaults for now. These defaults use the "String" datatype.

::: tip More Info on Fields

To learn more about the different types of Fields, and all available options, see
[Fields](/getting-started/glossary/#fields).

:::

## 5. Create an Item

Now that we have a Collection with a Field configured, it's time to start adding some content. Navigate to the Content
Module (top left), and click <span mi btn>add</span> in the top-right to get started. This will take you to the
Create/Edit Item page:

![Directus Create Item](https://cdn.directus.io/docs/v9/getting-started/quickstart/quickstart-20220217A/create-item-20220217A.webp)

Once you're happy with your creation, click <span mi btn>check</span> in the top-right to save your Item to the
database.

::: tip More Info on Items

To learn more about the different types of Items, and all available options, see [Items](/app/content-items/).

:::

## 6. Set Role/Public Permissions

By default, all content entered into Directus is considered private. This means that no data will be returned by the
API, unless requested by an authenticated user that has the correct permissions. In order to have the API return our
items, we'll have to setup some permissions. Navigate to **Settings Module <span mi icon dark>chevron_right</span> Roles
& Permissions**.

Directus ships with a special **"Public"** role that controls what data is returned to non-authenticated users. Select
the Public Role, find your Collection, and click the icon under the <span mi icon>visibility</span> icon (read/view
permission) to allow the Public Role to read the Items in your Collection.

![Directus Permissions](https://cdn.directus.io/docs/v9/getting-started/quickstart/quickstart-20220217A/permissions-20220217A.webp)

::: tip More Info on Roles & Permissions

Roles & Permissions are extremely powerful and can get pretty in-depth. To learn all about the nuances in setting these
up, see [Roles](/reference/system/roles) & [Permissions](/reference/system/permissions).

:::

## 7. Connect to the API

Now that your project has some content in it, it's time to start using this content externally. Data can be accessed in
a number of ways, including the REST API, GraphQL, the CLI, or even straight from the database. In this case, we'll use
[the `/items/` REST API endpoint](/reference/items) to retrieve the item we just created.

Using your browser, or an API tool like [Postman](http://postman.com) or [Paw](https://paw.cloud), open
[http://localhost:8055/items/articles](http://localhost:8055/items/articles).

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
