---
description:
  This recipe explains how to schedule content to be published for a future date for a statically generated site.
directus_version: 9.21.2
author: Bryant Gillespie
---

# Schedule Future Content for Static Sites

<GuideMeta />

## Explanation

This guide explains how to schedule content to be published on a future date for a statically generated site (SSG).

We'll be using [Flows](/app/flows) to publish articles when the current date matches the published date.

First we'll schedule a flow to run at regular intervals.

Next we'll check the timestamps of items with our content collection. And we'll update those the status of those items
whenever the published date is less than or equal the current timestamp.

Last, we'll kick off a new deployment of your static site at your hosting provider using one of the recipes below.

- [Triggering a static site build at Netlify](/guides/headless-cms/trigger-static-builds/netlify)
- [Triggering a static site build at Vercel](/guides/headless-cms/trigger-static-builds/vercel)

::: info Note

If your site fetches content at runtime or at the time of a page request, please
[follow the guide for dynamic sites](/guides/headless-cms/schedule-content/dynamic-sites).

:::

## How-To Guide

::: tip Requirements

You’ll need to have already created a collection for your site content like `articles` or `posts` or `pages` with a
field `status` that controls the published state.

:::

### Add a Field to Control Publish Date and Time

1. Under Settings, go to Data Model.

2. Choose your content [Collection](/app/data-model/collections).

3. [Add a new field](/app/data-model/fields#create-a-field-standard) to your content Collection.

   ![The interface for creating a new field is shown. The field type Datetime is selected. The Key is named date_published. The field for Use 24-Hour format is checked.](https://cdn.directus.io/docs/v9/headless-cms/how-to-packet-20220222A/scheduling-content-publish-date-timestamp.webp)

   a. Choose **Timestamp** for the Type.

   b. For the Key, use something relevant like `date_published`.

   c. Save the Field and your Collection.

### Add Some Content and Set a Publish Date

4. [Create or update an Item](/user-guide/content-module/content/items) inside your Collection

   ![A content item within the Articles collection is shown. The title is "What is Headless CMS?". English translations are also shown with a Summary field. The Summary reads "A quick overview of what Headless CMS is and how it's beneficial to your team."](https://cdn.directus.io/docs/v9/headless-cms/how-to-packet-20220222A/scheduling-content-create-content-scheduled.webp)

   a. Set the `status` field to `scheduled`

   b. Add a date for the `date_published` field

   c. Add the content for other fields and save the Item

### Create and Configure Your Flow

5. [Create a new Flow](/app/flows#create-a-flow)

   ![Under the Creating a New Flow interface, the Flow Setup tab is shown. The name of the new flow is Published Scheduled Articles. The status is Active. The Description field reads "This is triggered every 15 minutes to publish any scheduled articles". The icon selected is "Fiber New". For the Color field, a green color with the hex code #2ECDA7 is selected. Track Activity & Logs is selected.](https://cdn.directus.io/docs/v9/headless-cms/how-to-packet-20220222A/scheduling-content-flow-setup.webp)

   Give it a memorable name and short description like `Publish Scheduled Articles`.

6. [Complete the Trigger Setup](/app/flows/triggers#triggers)

   ![Under the Creating New Flow interface, the Trigger Setup tab is shown. The selected trigger is Schedule(CRON). The Interval field has a value of "* 15 * * * *".](https://cdn.directus.io/docs/v9/headless-cms/how-to-packet-20220222A/scheduling-content-trigger.webp)

   a. For **Type**, Select [Schedule (CRON)](/app/flows/triggers#schedule-cron). This will trigger this flow at regular
   intervals of time.

   b. Add your **Interval** in proper CRON syntax.

   **Examples**

   - `* */1 * * * *` - Would trigger this flow every minute
   - `* */15 * * * *` – Would trigger this flow every 15 minutes

### Add an Operation to Check The Published Date and Update Data

7. [Create a new Operation](/app/flows/operations#operations)

   ![Inside a Directus Flow, the Create Operation interface is shown. The Name of the operation is "Update Articles". The Key is "update_articles". The type of Operation is "Update Data". The Collection for the operation is "Articles". The Payload for the operation is a JSON object with key - status and value of published. There is also a JSON object for the Query field. A filter that checks that the item status is equal to "scheduled" and the date_published is less than or equal to the current timestamp.](https://cdn.directus.io/docs/v9/headless-cms/how-to-packet-20220222A/scheduling-content-update-articles.webp)

   a. For the type of Operation, select **Update Item**

   b. **Name** your operation, i.e. `Update Articles` or similar.

   c. Under **Collection**, choose your content collection i.e. `Articles` in our example.

   d. Check **Emit Events**

   ::: warning

   Emit Events will trigger an `item.update` event in this flow. Be careful when using it in your Flows to avoid
   creating infinite loops where Flows continuously trigger one another.

   :::

   e. Set your **Payload**

   ```json
   {
   	"status": "published"
   }
   ```

   f. Add your filter rule in the **Query** field.

   ```json
   {
   	"filter": {
   		"_and": [
   			{
   				"status": {
   					"_eq": "scheduled"
   				}
   			},
   			{
   				"date_published": {
   					"_lte": "$NOW"
   				}
   			}
   		]
   	}
   }
   ```

   g. Save this Operation

   h. Save your Flow

### Trigger a New Build for Your Static Site

In this recipe, we'll terminate the flow here because we'll use a separate flow to trigger the build or deployment
process for your site. This approach helps keep everything modular and easier to maintain.

If you haven't already, you'll want to configure one of the recipes below.

- [Triggering a static site build at Netlify](/guides/headless-cms/trigger-static-builds/netlify)
- [Triggering a static site build at Vercel](/guides/headless-cms/trigger-static-builds/vercel)

You checked Emit Events in the Operation during Step 7. This will emit an `item.update` event which is a trigger for the
Flows in the recipes above.

## Final Tips

**Tips**

- Make sure to test your flow several times to ensure everything is working as expected.
- As you add other collections that are published on your static site or frontend, make sure you update this Flow to
  include those collections in your Trigger.
