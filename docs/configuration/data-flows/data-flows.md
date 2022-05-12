# Data Flows

> Slick introduction to Data Flows.

[[toc]]

## What's a Data Flow?

<video autoplay muted loop controls title="">
	<source src="https://cdn.directus.io/" type="video/mp4" />
</video>

Data Flows enable custom, event-driven data processing and task automation within Directus. They are composed of a
Trigger, followed by a series of Operations.

The Trigger defines an event which starts the data flow. This could be an incoming webhook, a scheduled timer for cron
jobs, or some other event. Please see the documentation on [Triggers]() for complete details on each Trigger type.
Operations are actions performed one after the other. You can also set two Operations, one to execute if the previous
Operation passed and another to execute if it failed. Please see the documentation on [Operations]() for complete
details on each Trigger type.

Once a Data Flow is triggered, a JSON object is created which stores data from the Trigger event, as well as each
Operation executed in the flow as they are executed. Each subsequent Operation has access to the data that was fetched
or generated in all previous Operations of the Data Flow.

<!-- EXPLAIN VARIABLE SYSTEM -->

## Create a Data Flow

<video autoplay muted loop controls title="">
	<source src="https://cdn.directus.io/" type="video/mp4" />
</video>

1. Navigate to **"Settings > Flows"**.
2. Click <span mi btn>add</span> in the Page Header and a popup will appear.
3. Fill in a name for the Data Flow.\
   _Optional: Set a material icon, color, or note to help differentiate the Flow._
4. Click **"Save"** and you will be taken to the Flow Grid Page, with the Create Trigger Menu open.
5. Add a name to identify the Trigger, choose the Trigger Type, and fill in Trigger details _(if any)_.
6. Click <span mi icon>done</span> in the Menu Header.
7. On the Trigger Panel, click <span mi>add</span> and the Create Operation Menu will open.
8. Create a name, select the Operation type, and configure as desired.
9. When done, click <span mi btn>done</span> in the Page Header and return to the Flow Grid Page.

_After your first Operation is created, you have the option to build flows on whether the previous Operation
successfully executed or not._

10. On the newly created Operation panel:
    - Click <span mi icon>add</span> to add Operation if success.
    - Click <span mi icon>minus</span> to add Operation if failure.
11. Repeat steps eight and nine as desired, until your Data Flow is complete.

## Trigger Variables

<!-- Not sure what variables are available to triggers yet.-->

- `articles.items.create`

## Flow Object Variables

<video autoplay muted loop controls title="">
	<source src="https://cdn.directus.io/" type="video/mp4" />
</video>

Remember, data produced in each step of the Data Flow is stored as JSON objects sub-nested into the main Data Flow JSON
object. As you are configuring your Data Flow, you are able to access the entire Flow Object, as well as the nested
Objects generated in each previous Operation.

- <!--What is the variable to access the whole flow object?.-->
- `$trigger` - Returns data produced
- `{{some_operation__key}}` — Allows access to the nested JSON object produced by an Operation with key
  `{{some_operation_key}}`.
