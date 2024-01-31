---
description:
  When most flows begin, they pass the trigger's payload to the data chain and execute once. This recipe explains how to
  execute a flow for each element in a payload's array.
directus_version: 9.18.1
author: Eron Powell
---

# For Loops In Flows

<GuideMeta />

## Explanation

Sometimes you may have an array of data you'd like to iterate over and run operations on, one-by-one. However, you may
have noticed that each operation in a flow executes just one time. Because of this, you can't create a "for-loop" within
the operations of a single flow.

However, to achieve a "for-loop", you can instead use the [trigger flow](/app/flows/operations#trigger-flow) operation
to pass the data into an [another flow](/app/flows/triggers#another-flow) trigger. When this type of trigger receives an
array as a Payload, the flow runs for each item in the array individually.

::: tip

Remember: for some use-cases, you can also iterate through data in a [Run Script](/app/flows/operations#run-script)
operation.

:::

## The Recipe

::: tip Requirements

You'll need a flow with an array of data on its data chain.

:::

### Configure the Starting Flow

1. Configure a [flow](/app/flows#configure-a-flow) a [trigger flow](/app/flows/operations#trigger-flow) operation.
2. Under **Payload**, be sure to add the desired array.
3. Save and exit the flow.

### Configure the "For-Loop" Flow

Once your starting flow is configured as desired, follow these steps.

1. [Create a flow](/app/flows#create-a-flow) using the [another flow](/app/flows/triggers#another-flow) trigger.
2. [Configure operations](/app/flows#configure-an-operation) as desired.

## Final Tips

Once your for-loop is configured, you can process the data several ways.

First, you could simply let the "for-loop" flow process each element in the **Payload**.

Second, you could also configure a **Response Body** in the trigger of your "for-loop" flow. The **Response Body** gets
appended under the [trigger flow](/app/flows/operations#trigger-flow) operation in the starting flow.

Third, you could add another [trigger flow](/app/flows/operations#trigger-flow) operation into the "for-loop" flow, to
create complex flow chains. If you do this, just keep API performance in mind. If you configure a **Response Body**, the
parent flow will halt execution until it receives **Response Body**.

Good luck and have fun! :cook:
