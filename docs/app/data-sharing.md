# Data Sharing

> Data Sharing allows you to create a hyperlink to share Items with Users that do not have the proper permissions to
> view items in the Collection.

![What Shares look like](video.mp4)

[[toc]]

## What's a Share?

In a given Project, some Collections will likely be hidden for the Public as well as other Roles. There may be cases
when you want to share an Item with a person (or people) that don't have the permissions to see it. This is where Shares
come in to play. Shares let other people see an Item, even if they don't have proper permissions and even if they're not
Users in the Directus instance. Once a Share is created, you can then _share it_ via hyperlink or from the email
associated with your account. The link will take the user to a page with nothing but the content of that shared Item.

::: tip Read-only permissions

At this time, Shares are read-only. However, data sharing is a fully extensible feature that could support full CRUD
permissions. PRs to address this are welcome.

Interested in financially sponsoring this extension? [Contact us](https://directus.io/contact/).

:::

## How it Works

![How to create a Data Share](video.mp4)

1. Navigate to the Content Module.
2. Navigate to the Collection of the Item you want to share.
3. Click the Item to go into the Item's Editing Page.
4. Click the Shares button in the Sidebar.
5. From the dropdown, click "New Share".
6. Fill in the Share Options. Everything on the [Share Options Menu](#share-options-menu) is optional, but please note:

   - Without a name, it will be harder to remember the context/reason for the Share, especially with multiple shares on
     a single Item.
   - If no Role is selected, it defaults to Public permissions, which provides no real benefit since anyone can access
     Items available to Public. Learn More about [assigning a Role to a Share](#assigning-a-role-to-a-share).
   - The other access constraints are optional. Learn more about each constraint [here](#share-options-menu).

7. Click <span mi btn>check</span> in the Menu Header once you have set a name, a Role and constraints. You will see
   your new Share under "Shares" in the Sidebar.

8. Hover over the new Share Interface and click the <span mi icon>more_horiz</span> button on the right side of your
   Share.

![copy send edit delete shares menu](https://cdn.directus.io/docs/v9/app-guide/content/data-shares/copy-send-edit-delete-shares-menu-20220211A.webp)

9. From here you have 4 options:
   - **Copy Link** – Creates a hyperlink to share. Click "Copy Link" and share link with the user.
   - **Send Link** – Prompts user to add email(s) to send the link to. Fill in emails separated by a comma, then hit
     "Send Link".
   - **Edit** – Reopens the Share Options Menu for additional edits.
   - **Delete** – Permanently deletes the Share.

Once the link is opened by a user, a custom page displaying the Shared Item will be rendered.

::: warning Logout before using

If you click a link while logged in to Directus, it may try to direct you to the Directus App, which will yield a
message that says "Page Not Found". To avoid this, logout of the browser before opening the link.

:::

## Share Options Menu

![Share Options Menu](https://cdn.directus.io/docs/v9/app-guide/content/data-shares/shares-options-menu-20220209A.webp)

- **Name** – Adds a name to describe the Share.
- **Role** – Assigns a Role for the Share to inherit permissions from. Learn more under
  [Assigning a Role](#assigning-a-role).
- **Password** – Creates a password that must be used to access the shared Item.
- **Start Date** – Selects the first date that the Share can be accessed.
- **End Date** – Selects the last date that the Share can be accessed.
- **Max Uses** – Sets total number of times the shared Item can be viewed.
- **Times Used** - Displays number of times the shared Item was viewed.

## Who Can Create / View Data Shares?

A User's ability to create shares will be based on their Role's permissions. If you are an `Administrator`,
_congratulations_! You can share any Item you want. However, other Roles created will likely have limits set on their
Share permissions.

Any given Share will have the same read permissions as the Role it was assigned. This permission set is baked into the
hyperlink provided.

This system allows for absolutely granular configuration options on Shares... _but it also means you'll need to
understand both Roles and Permissions thoroughly to use Shares properly_. Here are some highlights of what you can do:

- Set the Collections a Role can view or share.
- Filter for specific Items a Role can view or share.
- Set specific Fields a Role can view or share.
- Set view permissions of relationally linked items.
- Restrict Role access to specific IP address(es).

::: warning You must understand Users, Roles and Permissions

The following sections are quite lean on explanation and all refer to
[Users, Roles, and Permissions](/configuration/users-roles-permissions/#configuring-permissions).

:::

## Is Data Sharing Safe?

We obviously don't want to expose Items unless they are explicitly shared, however some Items may be linked to Items in
other Collections. So, in addition to inheriting the role's permissions, the API automatically generates and injects a
permissions set so that only the shared Item _(and the Items relationally linked to the shared Item)_ can be viewed. But
again, as noted just above, view-ability is dependent on whether the Role assigned allows read access to those
Collections in the first place.

## Assigning an Existing Role

The Role option allows you to assign a Role to the Share. The Share will take on the read permissions of the Role
assigned.

![Select Role for Share](https://cdn.directus.io/docs/v9/app-guide/content/data-shares/select-role-for-share-20220210A.webp)

### Assign an existing Role

1. Navigate into **Share Options Menu**.
2. Click the Role input box. A side menu will appear.
3. Select the Role you'd like your Share to inherit permissions from.
4. Click <span mi btn>check</span> to confirm.

## Creating / Editing a Role

_If your Role has the correct permissions configured_, you can create a new Role and assign it to a Share _"on the fly"_
in the Share Options Menu. But you will still need to navigate to **Settings > Roles and Permissions > [Role Name]** to
configure any read permissions. Learn more [here](/configuration/users-roles-permissions).

![Creating / Editing a Role within Shares](https://cdn.directus.io/docs/v9/app-guide/content/data-shares/creating-and-editing-roles-within-shares-20220211A.webp)

### Create a new Role

1. Navigate into **Share Options Menu**.
2. Click <span mi icon>add</span> and the Role Options Menu will appear.
3. Fill out the options to create the Role according to your needs.
4. Click <span mi btn>check</span> to confirm Role creation.

### Edit an assigned Role

1. Navigate into **Share Options Menu**.
2. Click <span mi icon>open_in_new</span> and the Role Options Menu will appear.
3. Edit Role options according to your needs.
4. Click <span mi btn>check</span> to confirm edits.

::: warning You're editing the actual Role!!

If you edit a Role in this menu, these changes will take effect app-wide, not just in the context of a specific Share.

:::

## Limit Sharing to Specific Collections

You can limit which Collections a Role is allowed to share.

1. Navigate to **Settings > Roles and Permissions**.
2. Select the **[Role Name]** that will be responsible for creating the Share.
3. Find the **[Collection]** you wish to set Filter(s) for and click the icon in the column under
   <span mi icon>share</span> and a small menu will appear.
4. Select <span mi>check</span> to enable and <span mi>block</span> to disable Shares on this collection.

## Limit Sharing to Specific Items

Sometimes you may want a given Role to be able to share some Items but not others. Filters allow you to control exactly
which Items a Role will be able to share, enabling you to do things like _only share reports that are marked as 'Done'_.

### How to Set a Filter:

1. Navigate to **Settings > Roles and Permissions**.
2. Select the **[Role Name]** that will be responsible for creating the Share.
3. Find the **[Collection]** you wish to set Filter(s) for and click the icon in the column under
   <span mi icon>share</span> and a small menu will appear.
4. Select <span mi icon>rule</span>**Use Custom** and a side menu will appear.
5. Create your Filter(s) as needed.

## Limit Sharing of Item Fields

When you create a Share on some Item, you must associate a Role _(and thus the Role's permissions)_ to the Item. This
allows you to set read permissions for the exact fields _(including relational fields)_ that can get shared.

### How to Limit Field Visibility

1. Navigate to **Settings > Roles and Permissions**.
2. Select the **[Role Name]** that is assigned to the Share.
3. Find the **[Collection]** and click the icon in the column under the <span mi icon>visibility</span> icon. A small
   menu will appear.
4. Select <span mi icon>rule</span>**Use Custom** and a side menu will appear.
5. Click **Field Permissions**.
6. Click to check the Collection Fields you'd like to allow read permissions on.
7. Select <span mi>check</span> in the side menu Header to confirm changes.

## Creating a New User

![Create User within Shares](https://cdn.directus.io/docs/v9/app-guide/content/data-shares/creating-a-new-user-within-shares-20220211A.webp)

Once you have configured a Role, you may want to add Users into this Role. Creating a Role from the Shares is just the
same as creating a new User in **User Directory > All Users >** <span mi btn>add</span>. It is a _real_ User, available
globally throughout the app.

To create a new User within the Share Options Menu:

1. Navigate into **Share Options Menu > Add / Edit Role Menu > Users In Role**.
2. Click "Create New". This will open **Creating Item in Directus Users**.
3. Configure the new User as desired.
4. Click <span mi btn>check</span> to confirm and create new User.

## Adding an Existing User

![Add Existing User Menu](https://cdn.directus.io/docs/v9/app-guide/content/data-shares/add-existing-user-menu-20220211A.webp)

To add an existing User:

1. Navigate into **Share Options Menu > Add / Edit Role Menu > Users In Role**.
2. Click "Add Existing".
3. Click on the User(s) you wish to add.
4. Click the <span mi btn>check</span> icon to confirm your selection.

## Extensibility Options

Directus Core is completely open-source, modular and extensible. Extensions allow you to expand or modify any part of
Directus to fit your needs. Learn more [here](extensions/introduction/).

## Tutorial

Need some training wheels? Work through the free tutorial, with real data, on your own cloud instance! Use Shares for
`N` real life use cases and walk away with the conceptual understanding to get creative and tailor-fit this tool to your
project(s) as needed. [Start Learning]().

## More Help

Looking for technical support for your non-enterprise project? Please visit the
[Directus Discord Community](https://directus.chat/).

- Contact Dev team for sponsored feature
- Cloud Extensibility options
