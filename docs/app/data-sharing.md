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

Looking to sponsor an extension? Need dedicated engineering support on an enterprise project? [Contact Sales]()

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

![Copy / Send / Edit / Delete Shares Menu]()

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
- **Role** – Assigns an existing Role, or alternatively, clicking <span mi icon>add</span> lets you create a new Role on
  the fly.
- **Password** – Creates a password that must be used to access the shared Item.
- **Start Date** – Selects the first date that the Share can be accessed.
- **End Date** – Selects the last date that the Share can be accessed.
- **Max Uses** – Sets total number of times the shared Item can be viewed.
- **Times Used** - Displays number of times Item was viewed.

## Roles and Permissions for Shares

Your ability to create shares will be based on your Role's permissions. If you are an `Administrator`,
_congratulations_! You can share any Item you want. However, other Roles will likely have limits created on their Share
permissions.

Any given Share will have the same read permissions as the Role it was assigned. This permission set is baked into the
hyperlink provided.

This system allows for absolutely granular configuration options on Shares... _but it also means you'll need to
understand both Roles and Permissions thoroughly to use Shares properly_. Here are some highlights of what you can do:

- Set the Collections a Role can view or share.
- Filter for specific Items a Role can view or share.
- Set specific Fields a Role can view or share.
- Set view permissions of relationally linked items.
- Restrict Role access to specific IP address(es).

Learn all about configuring permissions [here](configuration/users-roles-permissions/#configuring-permissions).

## Is Data Sharing Safe?

We obviously don't want to expose Items unless they are explicitly shared, however some Items may be linked to Items in
other Collections. So, in addition to inheriting the role's permissions, the API automatically generates and injects a
permissions set so that only the shared Item _(and the Items relationally linked to the shared Item)_ can be viewed. But
again, as noted [just above](#roles-and-permissions-for-shares), view-ability is dependent on whether the Role assigned
allows read access to those Collections in the first place.

## Creating a new Role from Share Options Menu

While you can create a Role _on-the-fly_ in the Share Options Menu, you will still need to navigate to **Settings >
Roles and Permissions > [Role Name]** to assign its read permissions.

## Limit Sharing for Specific Collections

You can limit which Collections a Role is allowed to share from within **Settings > Roles and Permissions > [Role
Name]**.

## Limit Sharing to Specific Items

Sometimes you may want a given Role to be able to share some Items but not others. Within **Settings > Roles and
Permissions > [Role Name] > Use Custom**, you can create filters to control which Role is allowed to share which
particular Item within the system. This allows you to do things like _only share reports that are marked as 'Done'_.

## Limit Sharing of Item Fields

When you create a Share on an Item, you must associate a Role _(and thus the Role's permissions)_ to the Item. This
process allows fine tune control of the exact fields _(including relational fields)_ that get shared. Learn more
[here](http://localhost:8080/configuration/users-roles-permissions/#configuring-permissions).

## Extensibility Options

Directus Core is completely open-source, modular and extensible. Learn more about Extensions
[here](extensions/introduction/).

## Tutorial

Need some training wheels? Work through the free tutorial, with real data, on your own cloud instance! Use Shares for
`N` real life use cases and walk away with the conceptual understanding to get creative and tailor-fit this tool to your
project(s) as needed. [Start Learning]().

## More Help

Looking for technical support for your non-enterprise project? Please visit the
[Directus Discord Community](https://directus.chat/).

- Contact Dev team for sponsored feature
- Cloud Extensibility options
