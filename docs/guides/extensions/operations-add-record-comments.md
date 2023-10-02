---
description: Learn how to create an operation to insert comments within a workflow.
contributors: Tim Butterfield, Kevin Lewis
---

# Use Custom Operations to Add an Item Comment

Operations allow you to trigger your own code in a Flow. This guide will show you how to add comments to a record using
built-in services and make it available as a configurable Flow operation.

![An Add Comment operation in a Flow](https://marketing.directus.app/assets/5b20c836-39f1-4905-95ad-e829f1a65efc.png)

## Install Dependencies

Open a console to your preferred working directory and initialize a new extension, which will create the boilerplate
code for your operation.

```shell
npx create-directus-extension@latest
```

A list of options will appear (choose operation), and type a name for your extension (for example,
`directus-operation-add-comment`). For this guide, select JavaScript.

Now the boilerplate has been created, open the directory in your code editor.

## Build the Operation UI

Operations have 2 parts - the `api.js` file that performs logic, and the `app.js` file that describes the front-end UI
for the operation.

Open `app.js` and change the `id`, `name`, `icon`, and `description`.

```js
id: 'operation-add-comment',
name: 'Add Comment',
icon: 'chat',
description: 'Add a comment to a record',
```

Make sure the `id` is unique between all extensions including ones created by 3rd parties - a good practice is to
include a professional prefix. You can choose an icon from the library [here](https://fonts.google.com/icons).

With the information above, the operation will appear in the list like this:

<img src="https://marketing.directus.app/assets/7033ae7b-178f-489a-aa7f-170d498e6c83.png" alt="Add comment - add a comment to a record. A chat icon is displayed in the box." style="padding:2px 6px;"/>

`options` are the fields presented in the frontend when adding this operation to the Flow. To add a comment, you will
need to know the collection, item id and the comment itself. Replace the placeholder options with the following:

```js
options: [
	{
		field: 'collection',
		name: '$t:collection',
		type: 'string',
		meta: {
			width: 'half',
			interface: 'system-collection',
		},
	},
	{
		field: 'comment_key',
		name: 'ID',
		type: 'string',
		meta: {
			width: 'half',
			interface: 'tags',
			options: {
				iconRight: 'vpn_key',
			},
		},
	},
	{
		field: 'comment',
		name: 'Comment',
		type: 'text',
		meta: {
			width: 'full',
			interface: 'input-multiline',
		},
	},
],
```

- `collection` - the interface system-collection which renders a searchable dropdown for all collections. This field
  will also accept a manually entered string or a variable from the Flow.
- `comment_key` - field where the ID of the item is entered. This will accept a string, guid, int or a variable from the
  Flow. This must be an existing record in Directus.
- `comment` - a simple input-multiline field (textarea) to match how comments are made. Variables from the Flow can be
  mixed with standard text.

<img src="https://marketing.directus.app/assets/000d7d2a-8bdf-400f-8e46-2a6c018a58b3.png" alt="Add comment operation is selected. There are three fields - collection, IDs, and comment. Collection is a dropdown and IDs is a key." style="padding:6px 8px;"/>

The `overview` section defines what is visible inside the operation’s card on the Flow canvas. An overview object
contains 2 parameters, `label` and `text`. The label can be any string and does not need to match the field name. The
text parameter can be a variable or just another string.

It will be useful to see the collection and the comment on the card. To do this you must include the fields value from
the options (`collection` and `comment`) as properties. Replace the placeholder objects with the following:

```js
overview: ({ collection, comment }) => [
	{
		label: '$t:collection',
		text: collection,
	},
	{
		label: 'Comment',
		text: comment,
	},
],
```

- `collection` will use the system’s label for a collection and the text will be the chosen collection from the user.
- `comment` uses a string for the label, and the text will be the contents of the comment textarea field from the user.

<img src="https://marketing.directus.app/assets/1eaa545e-05a0-4b1c-b921-1d56902ac10d.png" alt="The flow overview card shows a collection and comment value." style="max-width: 400px;"/>

## Build the API Function

Open the `api.js` file and update the `id` to match the one used in the `app.js` file.

The `handler` needs to include the values from the options and some key services to create a comment. Replace the
handler definition with the following:

```js
handler: async ({ collection, comment_key, comment }, { services, database, accountability, getSchema }) => {
```

Notice the fields are added in the first object, then the services in the second.

Comments are stored inside the `directus_activity` table so the `ActivityService` is required to perform the action.
Inside the handler, set the following constants:

```js
const { ActivityService } = services;
const schema = await getSchema({ database });

const activityService = new ActivityService({
	schema: schema,
	accountability: accountability,
	knex: database,
});
```

The id field called `comment_key` needs to be able to accept both a single ID or multiple IDs. Add the following to
convert a single ID to an array then add them to the `keys` constant. Note the use of JSON.parse to allow JSON entry
into the field.

```js
if (!Array.isArray(comment_key) && comment_key.includes('[') === false) {
	comment_key = [comment_key];
}

const keys = Array.isArray(comment_key) ? comment_key : JSON.parse(Array.isArray(comment_key));
```

The final part of the script is to loop through all the keys and write the comment to them. Also it will be useful to
write the outcome back to the Flow’s logs. This is done by return as response to the function.

Create some disposable variables results and activity, then write the response from `activtyService.createOne` to the
activity variable and append it to the results array.

```js
let results = [];
let activity = null;

for await (const key of keys) {
	try {
		activity = await activityService.createOne({
			action: 'comment',
			comment: comment,
			user: accountability?.user ?? null,
			collection: collection,
			ip: accountability?.ip ?? null,
			user_agent: accountability?.userAgent ?? null,
			origin: accountability?.origin ?? null,
			item: key,
		});
		results.push(activity);
	} catch (error) {
		return error;
	}
};
return results;
```

The function `activtyService.createOne` requires the above parameters. For the comment to work, the `action` must be
`'comment'`. Then update the comment, collection and item parameters with the fields from `app.js`. The exception being
item which uses the key from the loop.

`user`, `ip`, `user_agent`, and `origin` all come from the `accountability` service. This means the comment will be left
by the user that triggers the workflow. At the end, the results array is returned and will be visible in the Flow logs.

Here is an example of how the comment will appear on a record:

<img src="https://marketing.directus.app/assets/4155f7fa-41af-4af1-8b96-d3e7b26f20db.png" alt="Inside of the sidebar, the comment pane shows one new comment from Tim Butterfield saying 'reminder sent'" style="max-width: 300px; padding: 1em 1em 1em 0;"/>

Build the operation with the latest changes.

```
npm run build
```

## Add Operation to Directus

When Directus starts, it will look in the `extensions` directory for any subdirectory starting with
`directus-extension-`, and attempt to load them.

To install an extension, copy the entire directory with all source code, the `package.json` file, and the `dist`
directory into the Directus `extensions` directory. Make sure the directory with your extension has a name that starts
with `directus-extension`. In this case, you may choose to use `directus-extension-operation-add-comment`.

Restart Directus to load the extension.

:::info Required files

Only the `package.json` and `dist` directory are required inside of your extension directory. However, adding the source
code has no negative effect.

:::

## Use the Operation

In the Directus Data Studio, open the Flows section in Settings. Create a new flow with an event trigger such as
`item.update`. Select the collection(s) to use.

Add a new step (operation) in the flow by clicking the tick/plus on the card. This can be at any point in the workflow.
From the list of options, choose **Add Comment**.

<img src="https://marketing.directus.app/assets/0bc1022b-2da7-4064-8c80-0fc32da59159.png" alt="Select Add Comment. Inside of Collection, type {{$trigger.payload.collection}}. Inside of IDs, type {{$trigger.payload.keys}}. For the comment, type any that you would like to add as a comment." style="padding:6px 8px;"/>

Save the operation, save the Flow, and then trigger it by updating a record from the chosen collections. Open the
collection records again to see the new comment. To see the response from the API function, open the flow and check out
the logs in the right side toolbar.

## Summary

With this operation, a comment will be created with the pre-configured settings on all submitted keys and respond with
an array of activity IDs for the comments. This operation requires setting up fields on the front-end and using Directus
services on the API side to complete the transaction. Now that you know how to interact with these services, you can
investigate other ways to extend your operations.

## Complete Code

`app.js`

```js
export default {
	id: 'your-extension-id',
	name: 'Add Comment',
	icon: 'chat',
	description: 'Add a comment to a record',
	overview: ({ collection, comment }) => [
		{
			label: '$t:collection',
			text: collection,
		},
		{
			label: 'Comment',
			text: comment,
		},
	],
	options: [
		{
			field: 'collection',
			name: '$t:collection',
			type: 'string',
			meta: {
				width: 'half',
				interface: 'system-collection',
			},
		},
		{
			field: 'permissions',
			name: '$t:permissions',
			type: 'string',
			schema: {
				default_value: '$trigger',
			},
			meta: {
				width: 'half',
				interface: 'select-dropdown',
				options: {
					choices: [
						{
							text: 'From Trigger',
							value: '$trigger',
						},
						{
							text: 'Public Role',
							value: '$public',
						},
						{
							text: 'Full Access',
							value: '$full',
						},
					],
					allowOther: true,
				},
			},
		},
		{
			field: 'comment_key',
			name: 'ID',
			type: 'string',
			meta: {
				width: 'half',
				interface: 'tags',
				options: {
					iconRight: 'vpn_key',
				},
			},
		},
		{
			field: 'comment',
			name: 'Comment',
			type: 'text',
			meta: {
				width: 'full',
				interface: 'input-multiline',
			},
		},
	],
};
```

`api.js`

```js
export default {
	id: 'your-extension-id',
	handler: async ({ collection, comment_key, comment }, { services, database, accountability, getSchema }) => {
		const { ActivityService } = services;
		const schema = await getSchema({ database });

		const activityService = new ActivityService({
			schema: schema,
			accountability: accountability,
			knex: database,
		});

		if (!Array.isArray(comment_key) && comment_key.includes('[') === false) {
			comment_key = [comment_key];
		}

		const keys = Array.isArray(comment_key) ? comment_key : JSON.parse(Array.isArray(comment_key));

		console.log(`Converted ${keys}`);

		let results = [];
		let activity = null;

		for await (const key of keys) {
			try {
				activity = await activityService.createOne({
					action: 'comment',
					comment: comment,
					user: accountability?.user ?? null,
					collection: collection,
					ip: accountability?.ip ?? null,
					user_agent: accountability?.userAgent ?? null,
					origin: accountability?.origin ?? null,
					item: key,
				});

				results.push(activity);
			} catch (error) {
				return error;
			}
		}

		return results;
	},
};
```
