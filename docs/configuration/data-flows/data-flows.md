# Data Flows

> Data Flows enable event-driven data processing and task automation.

[[toc]]

<!--
::: Before You Begin

[Learn Directus](/getting-started/learn-directus)

:::
-->

## What's a Data Flow?

<video autoplay muted loop controls title="">
	<source src="https://cdn.directus.io/" type="video/mp4" />
</video>

Data Flows enable custom, event-driven data processing and task automation within Directus. Each Flow is composed of one
Trigger, followed by a series of Operations.

The Trigger defines an event which starts the data flow. This could be some event or action within the app, an incoming
webhook, a scheduled timer for cron jobs, or some other event. Please see the documentation on
[Triggers](/configuration/data-flows/triggers) for more details.

Operations are the actions performed after the Trigger, which include things like creating new Items in a Collection,
sending off emails, pushing in-app notifications, and sending webhooks, just to name a few options. You can even set up
divergent chains of Data Flow Operations, which execute conditionally, based on whether one Operation passed or failed.
To ensure data is passed on as expected, a [console log](configuration/operations/#log-to-console) is also included to
help design and troubleshoot your Data Flows. Please see the documentation on
[Operations](/configuration/data-flows/operations) for more details.

Once a Data Flow is triggered, a [Data Flow JSON Object](#the-data-flow-object) is created which stores data from the
Trigger event. Then as each Operation in the flow executes, the data generated is added onto this Data Flow Object.
Every Operation in a Data Flow has access to this Data Flow Object.

## Create a Data Flow

<video autoplay muted loop controls title="">
	<source src="https://cdn.directus.io/" type="video/mp4" />
</video>

1. Navigate to **"Settings > Flows"**.
2. Click <span mi btn>add</span> in the Page Header and a popup will appear.
3. Fill in a name for the Data Flow.\
   _Optional: Set a material icon, color, or note to help differentiate the Flow._
4. Click **"Save"** and you will be taken to the Flow Grid Page, with the Create Trigger Menu open.
5. Add a name to the Trigger, choose the Trigger Type, and fill in Trigger details as desired.
6. Click <span mi icon>done</span> in the Menu Header.
7. On the Trigger Panel, click <span mi>add</span> and the Create Operation Menu will open.
8. Create a name, select the Operation type, and configure as desired.
9. When done, click <span mi btn>done</span> in the Page Header and return to the Flow Grid Page.

_After your first Operation is created, you have the option to build flows on whether the previous Operation
successfully executed or not._

10. On the newly created Operation panel:
    - Click <span mi icon>add</span> to add Operation after successful execution of current Operation.
    - Click <span mi icon>remove</span> to add Operation after current Operation fails.
11. Repeat steps 8-10 as desired, until your Data Flow is complete.

## The Data Flow Object

<video autoplay muted loop controls title="">
	<source src="https://cdn.directus.io/" type="video/mp4" />
</video>

The Data Flow Object stores all data from a Data Flow. When you create an Operation, you are required to add a unique
name for it, which into turned into a key. The key are used to add the associated Operation's data on the Data Flows
Object. Each Operation in the flow has access to the Data Flows Object, and thus all its data.

This following is an example of a simple Data Flow with two Operations. The `$trigger`, `$last`, and `$accountability`
keys are included on every Data Flow, though their values will differ. The name and number of Operation keys will
obviously depend on how you configure your Data Flow and whether each Operation executes successfully and actually
appends data onto the Data Flow Object.

```JSON
{
    "$trigger": {
        "path": "/trigger/<SomeTriggerUUID>",
        "query": {},
        "body": {},
        "method": "GET",
        "headers": {
            "connection": "close",
            "accept-encoding": "gzip, deflate, br",
            "host": "localhost:8055",
            "postman-token": "<SomePostmanAccessToken>",
            "cache-control": "no-cache",
            "accept": "*/*",
            "user-agent": "PostmanRuntime/7.29.0"
        }
    },
    "$last": null, // The data of the last operation in the flow. In this case, the last operation, operation_key_2, is null.
    "$accountability": { // Provides details on who/what tripped the Trigger and generated this Data Flow Object.
        "user": null,
        "role": null,
        "admin": false,
        "app": false,
        "ip": "0.0.0.0",
        "userAgent": "PostmanRuntime/7.29.0",
        "permissions": []
    },
    "operation_key_1": { // In real life, this will be whatever keyname you assigned to the first operation in the flow.
        "id": 1,
        "user_created": "<Some UUID>",
        "title": "My First Blog Post",
        "content": "<p>My First Content!</p>"
    },
	"operation_key_2": null, // The data, if any, which was stored in the second operation.
}
```

### Variables within Flows

The above key names can also be used as variables throughout your data flow:

```JSON
{
    "operation_key_3": {{$trigger}}
}
```

You can also use dot-notation to get sub-nested values within the Flow Object:

```JSON
{
    "operation_key_3": {{$operation_key_1.id}}
}
```
