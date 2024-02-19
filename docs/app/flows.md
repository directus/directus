---
description:
  Flows enable custom, event-driven data processing and task automation within Directus. Each flow is composed of one
  trigger, followed by a series of operations.
readTime: 5 min read
---

# Flows

> Flows enable custom, event-driven data processing and task automation within Directus. Each flow is composed of one
> trigger, followed by a series of operations.

::: tip Before You Begin

Please be sure to see the [Quickstart Guide](/getting-started/quickstart) to get a basic overview of the platform.

:::

::: tip Learn More

There is also dedicated API documentation on [Flows](/reference/system/flows) and
[Operations](/reference/system/operations).

:::

<!--
@TODO What is Task Automation?

Oversimplification of the internet:
- Store data
- Get Data
- Process Data
- Send Data
Database data stored as rows and columns
Web Request -> JSON
JSON -> Operations and Transformations
Scripts ->
Control Flow ->
Events ->
Async/Sync ->

### JSON vs JavaScript Objects

```json
{
	"key": "string", // string
	"key2": 1, // number
	"key3": {}, // json
	"key4": [], // array
	"key5": true, // boolean
	"key6": null // null
}
```
-->

## What's a Flow?

![What's a Flow?](https://cdn.directus.io/docs/v9/configuration/flows/flows/flows-20220603A/whats-a-flow-20220603A.webp)

<!--
<video title="What's a Flow" autoplay playsinline muted loop controls>
<source src="" type="video/mp4" />
</video>
-->

Each flow is made up of three elements: A trigger, operations, and a data chain.

### **Triggers**

Each flow begins with a [trigger](/app/flows/triggers), which defines the action or event that starts the Flow. This
action or event could be some type of transaction within the app, an incoming webhook, a cron job, etc.

### Operations

An [operation](/app/flows/operations) is an action or process performed within the flow. These enable you to manage
data: _send off emails, push in-app notifications, send webhooks, and beyond_.

To put it in conceptual terms, operations do three things:

- **Get data** from Directus or another outside service.
- **Process data** a.k.a. transform it, validate it, or whatever.
- **Send data** to Directus or another outside service.

::: tip Developers

You can even develop your own [custom operations](/extensions/operations) to fit any use-case.

:::

### Data Chains

In order for a flow's operations to track and access the same data, each flow creates its own
[data chain](#the-data-chain). Every operation has access to this data chain and each operation appends some value onto
this object after it runs. This means you can dynamically access data from a previous operation in the current operation
with [data chain variables](#data-chain-variables).

### Control Flow

Not every operation that executes in a flow does so successfully. In some cases, your operations are going to fail.
Perhaps an operation tried to access data that doesn't exist, or a webhook operation fails for some reason, or perhaps
you set a [condition](/app/flows/operations#condition) operation, which _fails by design_ when its condition is not met.

These kinds of failed operations do not immediately stop your flow. Instead, flows let you implement
[control flow](https://en.wikipedia.org/wiki/Control_flow), by providing **success paths** and **failure paths** within
a flow:

<!-- ![Control Flow](image.webp) -->

- **Success** — If `operation1` executes successfully, then `operation2` executes.
- **Failure** — Else if `operation1` fails on execution, then `operation3` executes.

_And there we have it!_ These are the conceptual cornerstones of any flow. Now you'll need to know how to actually
create a flow, which we discuss in the next section.

## Configure A Flow

<video autoplay playsinline muted loop controls title="Create a Flow">
	<source src="https://cdn.directus.io/docs/v9/configuration/flows/flows/flows-20220603A/create-a-flow-20220603A.mp4" type="video/mp4" />
</video>

### Create a Flow

1. Navigate to **Settings > Flows** and click <span mi btn>add</span> in the page header. A drawer will open.
2. Under **Flow Setup**, fill in a **Name** for the flow and the following _optional_ details:
   - **Status** — Sets the flow to active or inactive.
   - **Icon** — Adds an icon to help quickly identify the flow.
   - **Description** — Sets a brief verbal description of the flow.
   - **Color** — Sets a color to help identify the flow.
   - **Activity and Logs Tracking** — Lets you **Track Activity and Logs**, **Activity**, or **Neither**.

::: tip

To learn more, see the section below on [Logs](#logs) as well as the [Activity Log](/user-guide/settings/activity-log)
documentation.

:::

### Configure a Trigger

3. Click <span mi btn>arrow_forward</span> to navigate to **Trigger Setup**. Select a [trigger](/app/flows/triggers)
   type and configure as desired.
4. Click <span mi btn>done</span> in the menu header to confirm.

You'll now see your trigger in an empty grid area. Its time to start adding operations.

### Configure an Operation

5. On the trigger panel, click <span mi>add</span> and the **Create Operation** side drawer will open.
6. Choose a **Name**, an [operation](/app/flows/operations) type, and configure as desired.\
   Directus will convert the name into a unique operation key, used on the [data chain](#the-data-chain).\
   If you don't choose a name, the system will auto-generate a name and key for you.
7. Next, click <span mi btn>done</span> in the page header to confirm and return to the flow grid area.
8. From here, you can make the following optional configurations:
   - **Reposition** — You can drag and drop panels to reposition as desired.
   - **Unlink/Relink** — Click and drag <span mi icon prmry>adjust</span> or <span mi icon prmry>arrow_forward</span> to
     unlink/relink flows.
   - **Duplicate an Operation** — To duplicate an operation, click <span mi icon>more_vert</span> to open its context
     menu. Click <span mi icon>control_point_duplicate</span> and a duplicate of the operation (and its configuration
     details) will be created.
   - **Copy an Operation** — To copy and paste an operation into another flow, click <span mi icon>more_vert</span> to
     open its context menu. Click <span mi icon>input</span> and a popup menu will open. Choose the desired flow from
     the dropdown and click **Copy**.
   - **<span mi icon>data_object</span> Toggle Raw Editor** — Click <span mi icon>data_object</span> on an operations'
     form input fields to toggle the input type between standard and raw value. This allows you to add a raw value or
     [Data Chain Variables](#data-chain-variables) within any type of configuration option, even dropdown menus,
     checkboxes, and radio buttons.
   - **Delete an Operation** — To delete an operation, click <span mi icon>more_vert</span> then
     <span mi icon dngr>delete</span>. A popup menu will appear. Click **Delete** to confirm.
9. On the newly created operation panel:
   - Click <span mi icon>add</span> to add an operation to the **success path**.
   - Click <span mi icon>remove</span> to add an operation to the **failure path**.
10. Repeat steps 5-10 to build out your flow as desired.
11. Click <span mi btn>done</span> to confirm and create your flow.
12. Click <span mi btn>arrow_back</span> to return to the flows list.
13. Once created, you may need to re-edit your flow, toggle it to inactive, or delete it.

### Edit a Flow

1. Navigate to the desired flow.
2. Click <span mi btn muted>edit</span> in the flow page header and make reconfigurations as desired.
3. Click <span mi btn>done</span> to confirm.

### Toggle a Flow to Inactive

1. Navigate to **Settings > Flows** and click <span mi icon>more_vert</span> on the desired flow.
2. Click **<span mi icon>check</span> Set Flow to Active** or **<span mi icon>block</span> Set Flow to Inactive**.

### Delete a Flow

1. Click <span mi icon>more_vert</span> on the desired flow to open its context menu.
2. Click <span mi icon dngr>delete</span> and a popup menu will appear. Click **Delete** to confirm.

Now that we know how to create and configure a flow, it's time to get a firmer understanding of the data chain.

## The Data Chain

<!--
<video title="The data chain" autoplay playsinline muted loop controls>
<source src="https://cdn.directus.io/docs/v9/" type="video/mp4" />
</video>
-->

Remember, each flow creates its own JSON object to store any data generated.

When the flow begins, four keys are appended to the data chain: `$trigger`, `$accountability`, `$env`, and `$last`.
Then, as each operation runs, it has access to this data chain. Once an operation finishes, its data is appended under
its `<operationKey>`. When the operation doesn't generate data, `null` is appended under its key.

The following is a highly generic example of a data chain.

```json
{
	"$trigger": {
		// Contains data generated by the flow's trigger.
		// This could include headers, access tokens, payloads, etc.
		// Every data chain has a $trigger key.
	},
	"$accountability": {
		// Provides details on who/what started the flow.
		// This could include user's id, role, ip address, etc...
		// Every data chain has an $accountability key.
	},
	"$env": {
		// Environment variables allowed in `FLOWS_ENV_ALLOW_LIST`.
		// This could include PUBLIC_URL, PORT, etc...
		// Every data chain has an $env key.
	},
	"$last": {
		// The value appended under $last changes after each operation.
		// It stores data of the last operation that executed in the flow.
		// That way, you don't have to remember the previous operation's unique keyname.
		// It's a handy little convenience tool!
		// Every data chain has a $last key.
	},
	"operationKey1": "A value", // The data (if any) generated by the first operation.
	"operationKey2": {
		"nestedKey": ["nested val", "nested val 2"] // It will be common to have nested JSON data.
	},
	"operationKey3": null // A null value is appended if no data generated.
}
```

As you can see, the example above doesn't have any substantial data inside each key. In reality, there's going to be a
lot of data and it will always be slightly different, based on your flow's unique configuration. During configuration
and debugging, you'll need to use a tool like [The Log](#logs) to view your data chain and make sure each operation is
accessing and generating data as you intended.

::: tip

In our examples, we are using generic _placeholders_ for operation keys, like `<operationKey>`, which might look funny
to low-code users. In practice, operation keys will actually have unique and descriptive names, like `send_email_7538`.

:::

::: tip

Remember, `$trigger`, `$accountability`, and `$last` begin with `$`, but not `operationKeys`.

:::

## Data Chain Variables

<!--
<video title="Use data chain Keys as Variables" autoplay playsinline muted loop controls>
<source src="https://cdn.directus.io/docs/v9/" type="video/mp4" />
</video>
-->

While [configuring your operations](#configure-an-operation), you can use keys from the data chain as variables to
access data. Simply wrap the variable with quotes and _double mustaches_. For example:

```json
"{{ $accountability }}"
```

will get the data nested under the `$accountability` key, producing something like this:

```json
{
	"user": "4b11492d-631d-4b8a-bca7-2beasdfadf58b",
	"role": "12c79228-5361-4905-929b-d69d3w46trs6b",
	"admin": true,
	"app": true,
	"ip": "127.0.0.1",
	"userAgent": "Amazon CloudFront"
}
```

You can mix your own hard-coded JSON alongside variables.\
You can also use dot-notation and array indexing to retrieve sub-nested values.

```json
{
	"key0": "a hard-coded value",
	"key1": "{{ $trigger.payload }}",
	"key2": "{{ operationKey.payload.friend_list[0] }}"
}
```

You **cannot** pass any type of computation using double-moustache syntax.

```json
{
	"key": "{{ 2 + 2 }}",
	"key2": "{{ $trigger.payload.toLowerCase() }}"
}
```

::: tip

To perform computations on flow data, use the [script operation](/app/flows/operations#script) or a
[webhook](/app/flows/operations#webhook).

:::

Certain operations use dropdowns, toggles, checkboxes, and other input options. However, you can bypass this entirely to
input raw values directly with [Toggle to Raw Editor](#configure-an-operation). You can use double-moustache syntax to
access data dynamically in these input options as well.

<!--
<video autoplay playsinline muted loop controls title="">
	<source src="https://cdn.directus.io/docs/v9/configuration/flows/flows/" type="video/mp4" />
</video>
-->

## Logs

<video autoplay playsinline muted loop controls title="">
	<source src="https://cdn.directus.io/docs/v9/configuration/flows/flows/flows-20220603A/logs-20220603A.mp4" type="video/mp4" />
</video>

Accessible from the sidebar, logs store information for each flow execution. Each log will display information from
triggers as well as each operation in the flow. To access a flow's logs, follow these steps.

1. Navigate to **Settings > Flows** and click the desired flow.
2. Click **<span mi icon prmry>fact_check</span> Logs** in the sidebar. A side drawer will open, displaying the flow's
   logs.
3. Click a log and another side drawer will open, allowing you to peer through its data.
4. When finished, click <span mi btn muted>close</span> to close the drawer.

Logs are not a 1:1 mapping to the data chain. Each trigger and operation gets its own dropdown, which stores its
relevant data. Here's what you'll get from each of these:

**Trigger**

- **Options** — The values you input when you configured the trigger.\
  _(These configuration options are not stored on the data chain)_.
- **Payload** — Displays the data appended under `$trigger`.
- **Accountability** — Displays data appended under `$accountability`.

Note that `$accountability` is not nested under the `$trigger` key. However, it is listed under the Trigger in the Log
because `$accountability` is generated by the trigger.

**`<OperationKey>`**

- **Options** — The values you input when you configured the operation.\
  _(These configuration options are not stored on the data chain)_.
- **Payload** — Displays the data appended under this `<operationKey>`.

Remember, the [Log to Console](/app/flows/operations#log-to-console) operation is a key debugging tool. It does not
append data to the data chain. You will view your log message under **Options**. Therefore, anything you log will always
be displayed as nested under a `message` key. For example, if you decide to log `"The last operation was a success"`, it
will be displayed as:

```
{
	"message": "The last operation was a success"
}
```

::: warning Logs are stored in the database

Keep in mind that if you've configured a flow to track logs, all this information is stored in the database. You may
need to periodically delete this data.

:::

::: tip Where is `$last`?

You may notice `$last` is not in the Logs. Remember, `$last` constantly updates to store the data of the most recently
executed operation. The log shows the results of the entire flow. Therefore `$last` would simply be the very last
operation in the flow.

:::

::: tip More on Debugging

You may find a tool like [Postman](https://www.postman.com/) quite helpful for viewing data and debugging flows.

:::
