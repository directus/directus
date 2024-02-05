# Shares

> The Shares utility enables you to share an Item with anyone, regardless of their permissions, even if they are not
> users within the project.

<video autoplay playsinline muted loop controls>
<source src="https://cdn.directus.io/docs/v9/app-guide/content/data-sharing/data-sharing-20220217A/data-shares-20220217A.mp4" type="video/mp4" />
<p>Your browser is not displaying the video for some reason. Here's a <a href="https://cdn.directus.io/docs/v9/app-guide/content/data-sharing/data-sharing-20220217A/data-shares-20220217A.mp4">link to the video</a> instead.</p>
</video>

<!--
@TODO
Create a ::: tip Before You Begin
getting-started > intro-tutorial
configuration > users-roles-permissions
-->

## What's a Share?

In any Project, some Collections may be accessible for only certain User roles, or hidden from the public. You may
decide to share one of the Items within the collection with an individual or group of individuals who don't yet have
permission. In this case, use Shares. Shares let you give anybody access to an Item. When you create a Share on an Item,
a Role for the Share to inherit view permissions is assigned. Then you can share the Item via a hyperlink or email. The
link leads to a page containing the read-only content for just that shared Item.

::: tip Read-only

At this time, Shares are read-only. However, Data Sharing is an extensible feature that could support full CRUD
permissions. We welcome any [pull-requests](/contributing/introduction) to address this or interest in
[sponsoring the feature](/getting-started/support#sponsored-work).

:::

::: warning Users, Roles and Permissions!

You will need to understand how [Users, Roles, and Permissions](/user-guide/user-management/users-roles-permissions)
work in Directus to configure Shares properly.

:::

## How It Works

<video autoplay playsinline muted loop controls>
<source src="https://cdn.directus.io/docs/v9/app-guide/content/data-sharing/data-sharing-20220217A/how-shares-work-20220217A.mp4" type="video/mp4" />
<p>If your browser is not displaying the video for some reason, here's a <a href="https://cdn.directus.io/docs/v9/app-guide/content/data-sharing/data-sharing-20220217A/how-shares-work-20220217A.mp4">link to the video</a> instead.</p>
</video>

1. Navigate to the Content Module.
2. Navigate to the Collection of the Item you want to share.
3. Click the Item to open its Item Page.
4. Click the Shares button in the Sidebar.
5. From the dropdown, click "New Share."
6. Fill in the Share Options. Everything on the [Share Options Menu](#share-options-menu) is optional, but please note:
   - Without a name, it will be harder to remember the context/reason for the Share, especially with multiple shares on
     a single Item.
   - If no Role is selected, it defaults to Public permissions, which provide no benefit, as anyone can access Items
     available to the Public role.
   - The other access constraints are totally optional.
7. Click <span mi btn>check</span> in the Menu Header once you have set a name, a Role and constraints. You will see
   your new Share under **Shares** in the sidebar.
8. Click the <span mi icon>more_horiz</span> button on the right side of your Share.

![copy send edit delete shares menu](https://cdn.directus.io/docs/v9/app-guide/content/data-sharing/data-sharing-20220217A/copy-send-edit-delete-shares-menu-20220217A.webp)

9. Here you have 4 options:
   - **Copy Link** – Creates a hyperlink that you can copy and paste.
   - **Send Link** – Creates prompt for the User to add email(s) and share the link.
   - **Edit** – Reopens the Share Options Menu for additional edits.
   - **Delete** – Permanently deletes the Share.

Once the link is opened by a user, a custom page displaying the Shared Item will be rendered.

::: warning Logout to test links

If you open a Share link while logged in to Directus, it will redirect to the Item in the Directus App. When testing a
Share, make sure to log out of the app before opening the link, or simply open the link in another browser or incognito
tab.

:::

## Share Options Menu

![Share Options Menu](https://cdn.directus.io/docs/v9/app-guide/content/data-sharing/data-sharing-20220217A/share-options-menu-20220217A.webp)

- **Name** – Adds a name to describe the Share.
- **Role** – [Assigns a Role](#assigning-a-role) from which the Share will inherit permissions.
- **Password** – Creates a password that must be used to access the shared Item.
- **Start Date** – Selects the first date that the Share can be accessed.
- **End Date** – Selects the last date that the Share can be accessed.
- **Max Uses** – Sets the total number of times the shared Item can be viewed.
- **Times Used** - Displays the number of times the shared Item was viewed.

## Creating and Viewing Shares

<!--
@TODO
configuration > users-roles-permissions
getting-started > intro-tutorial
-->

A User's ability to create Shares depends on their Role's permissions. If you are an `Administrator`, _congratulations!_
You can share any Item you want. However, Users with other Roles will likely have limited Share permissions.

Any Share will inherit the same read permissions as the Role it was associated with in the Share Options Menu.

This system allows for absolutely granular configuration options on Shares... _but it also means you'll need to
understand [Users, Roles, and Permissions](/user-guide/user-management/users-roles-permissions) thoroughly to use Shares
properly_. Here are some highlights of what you can do:

- Set the Collections a Role can view or share.
- Filter for specific Items a Role can view or share.
- Set specific Fields a Role can view or share.
- Set view permissions of relationally linked Items.
- Restrict Role access to specific IP address(es).

## Is Data Sharing Safe?

Obviously, you don't want to expose Items unless they are explicitly shared, however some Items may be linked to Items
in other Collections. So, in addition to inheriting the Role's permissions, the API automatically generates and injects
a permissions set so that only the shared Item _(and the Items relationally linked to that shared Item)_ can be viewed.
As noted previously, viewability is dependent on whether the Role associated to the Share has read permissions on those
linked Collections.

## Assigning a Role

The Role option in the [Share Options Menu](#share-options-menu) lets you associate a Role to the Share. The Share will
then inherit permissions of that Role.

![Select Role for Share](https://cdn.directus.io/docs/v9/app-guide/content/data-sharing/data-sharing-20220217A/select-existing-role-menu-20220217A.webp)

### Assign an Existing Role

1. Navigate to the **Share Options Menu**.
2. Click the Role Input Box and a new side menu will appear _(shown above)_.
3. Select the Role from which you'd like your Share to inherit permissions.
4. Click <span mi btn>check</span> to confirm.

### Creating / Editing a Role

_If your Role has the correct permissions configured_, you can create a new Role and assign it to a Share _"on the fly"_
in the Share Options Menu. However, you will still need to navigate to **Settings > Access Control > [Role Name]** to
configure any read permissions.

![Creating / Editing a Role within Shares](https://cdn.directus.io/docs/v9/app-guide/content/data-sharing/data-sharing-20220217A/creating-and-edit-roles-menu-20220217A.webp)

### Create a New Role

1. Navigate to the **Share Options Menu**.
2. Click <span mi icon>add</span> in the Role Input Box and the Role Options Menu will appear.
3. Fill out the options to create the Role according to your needs.
4. Click <span mi btn>check</span> to confirm Role creation.

### Edit an Assigned Role

1. Navigate to the **Share Options Menu**.
2. Click <span mi icon>open_in_new</span> in the Role Input Box and the Role Options Menu will appear.
3. Edit Role options according to your needs.
4. Click <span mi btn>check</span> to confirm edits.

::: warning You're creating / editing actual Roles!

If you create or edit a Role in this menu, your changes will take effect across the application, not just in the context
of the Share.

:::

## Limit Sharing by Collection

You can limit which Collections a Role is allowed to share:

1. Navigate to **Settings > Access Control**.
2. Select the **[Role Name]** that will be responsible for creating the Share.
3. Find the **[Collection]** you wish to set Filter(s) for, then click the icon in the column under
   <span mi icon>share</span> and a small menu will appear.
4. Select <span mi>check</span> to enable and <span mi>block</span> to disable Shares on this Collection.

## Limit Sharing by Item

Sometimes you may want a given Role to be able to share some Items but not others. Filters allow you to control exactly
which Items a Role will be able to share, for example, _only share reports that are marked as 'Done'_. To use Filters:

1. Navigate to **Settings > Access Control**.
2. Select the **[Role Name]** that will be responsible for creating the Share.
3. Find the **[Collection]** you wish to set the Filter(s) for, then click the icon in the column under
   <span mi icon>share</span> and a small menu will appear.
4. Select <span mi icon>rule</span>**Use Custom** and a side menu will appear.
5. Create your Filter(s) as needed.

## Limit Sharing by Field

When you create a Share on some Item, you associate a Role _(and thus the Role's permissions)_ to the Item. This allows
you to set read permissions for the exact fields _(including relational fields)_ that get shared. To limit sharing by
Field:

1. Navigate to **Settings > Access Control**.
2. Select the **[Role Name]** that is assigned to the Share.
3. Find the **[Collection]** then click the icon in the column under the <span mi icon>visibility</span> icon and a
   small menu will appear.
4. Select <span mi icon>rule</span>**Use Custom** and a side menu will appear.
5. Click **Field Permissions**.
6. Click to check the Collection Fields for which you'd like to allow read permissions.
7. Select <span mi>check</span> in the side menu Header to confirm changes.
