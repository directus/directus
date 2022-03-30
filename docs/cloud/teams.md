# Cloud Teams

> Each Cloud Project is nested within one Team. A Team is an organizational system which groups Accounts together as
> Team Members and provides consolidated billing on its nested Projects. Teams are free, so create as many as you need
> to appropriately organize Team Members and Project billing.

[[toc]]

## Create a Team

![Create Team](https://cdn.directus.io/docs/v9/cloud/teams/teams-20220322A/create-a-team-20220329A.webp)

To create a Team, follow the steps below.

1. Open the Team Menu in the Dashboard Header and click **"Create a Team <span mi icon prmry>add</span>"**.\
   The Create Team Page will open.
2. Enter a Team Name and Team Slug, then click **"Save"**.

:::tip Team Name and Team Slug

The Team Name is a text name assigned to a Team, used in the Cloud Dashboard. The Team slug lies within the full URL
`https://directus.cloud/TEAM-SLUG/projects`. These are purely organizational, allowing you to easily remember the Team
and link to specific Cloud Dashboards. They do not impact Cloud Projects or billing and can be
[updated at any time](#update-team-settings).

:::

## Update Team Settings

![Managing a Team](https://cdn.directus.io/docs/v9/cloud/teams/teams-20220322A/managing-a-team-20220225A.webp)

To update Team Settings, follow the steps below.

1. Open the Team Menu in the Dashboard Header and select the desired Team.
2. Click **"Settings"** to enter the Team Settings Page.
3. Toggle <span mi icon prmry>edit</span> to allow edits.
4. Edit Team Name and Team Slug as desired.
5. Click the **"Save"** button.

## View Team Activity

![View Team Activity](https://cdn.directus.io/docs/v9/cloud/teams/teams-20220322A/view-team-activity-20220322A.webp)

The Team Activity Page displays created and destroyed Projects, billing information changes, Team Members added or
removed, Team Name and Team Slug changes, as well as any other major Team-oriented activities. To view Team Activity,
follow the steps below.

1. Open the Team Menu in the Dashboard Header and select the desired Team.
2. Click **"Activity"**.

## View Billing Details

![View Billing Details](https://cdn.directus.io/docs/v9/cloud/teams/teams-20220322A/view-billing-details-20220322A.webp)

Please follow these steps to see billing details such as credit available to Team Projects, total active subscriptions,
and invoice receipts. [Learn More](/cloud/glossary/#billing)

1. Open the Team Menu in the Dashboard Header and select the desired Team.
2. Click **"Billing"** to enter the Billing Details Page.

## Manage Billing

![Manage Billing](https://cdn.directus.io/docs/v9/cloud/teams/teams-20220322A/manage-billing-20220322A.webp)

### Team Billing

Teams are free to create. They are simply used to give Team Members access to the same Projects, Project invoices, and
payment methods. Each Team has its own separate billing. Each Project within a Team is
[calculated](/cloud/glossary/#how-bills-are-calculated) and [invoiced separately every month](#billing-cycles).

Team Members are SuperAdmins. As such, they have full access to manage billing information and payment methods,
including information provided by other Team Members. Team Members should be highly trusted individuals.

All bills will first be invoiced to the default payment method. You may notice that it is possible to add additional
payment methods, and it may be a good idea to do so, as keeping multiple payment methods on file provides a fail-safe to
help make sure your Project stays running. In the event that there is an issue processing the default payment method,
the other payment methods on file will be attempted. If the bill is not paid, the Nodes are paused, halting web-traffic,
until a successful payment is made. If the paused Project is never repaid, it will eventually be deleted along with all
its data and assets! For details on unpaid Projects and refunds see,
[Cloud Policies](https://directus.io/cloud-policies/)

:::tip Team Metered Usage

You may notice credit on top of the [Billing Page](#view-billing-details). In the _rare event_ your Team receives credit
from the Directus Team, this credit balance will decrease the amount due on the next invoice(s) until all credit is used
up. Then the default payment method will be used.

:::

### Billing Cycles

Bills are invoiced on a calendar monthly basis, so each new billing period begins after exactly one month. When a
Project is destroyed, the bill is processed immediately. As mentioned in the previous section, bills are invoiced
per-Project. So, if a Team has 4 Standard Projects, it will be charged 4 times each month.
[Learn More](/cloud/glossary/#billing)

Follow the steps below to change a default payment method, add or remove additional payment methods, or change other
billing details.

1. Open the Team Menu in the Dashboard Header and select the desired Team.
2. Click **"Billing"** to enter the Billing Details Page.
3. Click **"Manage Billing"** to enter the Stripe payments gateway.
4. Adjust payment methods and details as needed.
5. Click **"Return to Directus Cloud"**.

:::tip What's a calendar monthly basis?

This is the period from a day of one month to the corresponding day of the next month, if such exists. If not, it runs
to the last day of the next month _(e.g. January 3 to February 3 or from January 31 to February 29)_.

:::

:::tip Stripe Payment

To handle billing, Directus Cloud uses Stripe, a secure, industry-leading, dynamic, international billing service.

:::

## Invite Team Members

![Inviting a Team Member](https://cdn.directus.io/docs/v9/cloud/teams/teams-20220322A/inviting-a-team-member-20220225A.webp)

All Team Members can invite new Members via email. Each invitee will be emailed a link to accept invitation and join the
Team. To invite Team Members, follow the steps below.

1. Open the Team Menu in the Dashboard Header and select the desired Team.
2. Click **"Members"** to enter the Members Page.
3. Scroll down to the Invite New Members section.
4. Enter one or more email(s), comma separated.
5. Click **"Send Invites"**.

:::tip

Clicking the emailed invitation link does not automatically create an Account for you. Invitees will need to
[create an Account](/cloud/accounts/#create-account-and-login) before accepting invitation to join a Team.

:::

## Manage Team Members

![Removing a Team member](https://cdn.directus.io/docs/v9/cloud/teams/teams-20220322A/leaving-a-team-20220225A.webp)

All Team Members have the ability to remove other Members or invites from a Team. To remove Members or leave a Team
yourself, follow the steps below.

1. Open the Team Menu in the Dashboard Header and select the desired Team.
2. Click **"Members"** to enter the Members Page.
3. Click <span mi icon>exit_to_app</span> or <span mi icon>close</span> button on the desired Member.
4. Click **"Confirm"**.

:::warning

If an Account leaves or is removed from a Team, it will be fully "locked out" of the Team until re-invited by another
Member.

:::

## Destroy a Team

![Destroying a Team](https://cdn.directus.io/docs/v9/cloud/teams/teams-20220322A/destroy-a-team-20220225A.webp)

To destroy a Team, follow the steps below.

1. Open the Team Menu in the Dashboard Header and and select the desired Team.
2. Click **"Settings"** to enter the Team Settings Page.
3. Scroll down to the "Destroy this Team" section.
4. Toggle <span mi icon dngr>local_fire_department</span> and an input box will appear.
5. Type the Team Name into the input box.
6. Click **"Destroy Team"**.

::: danger

Destroying a Team completely removes all its data from Directus Cloud. This action is permanent and irreversible.
Proceed with caution!

:::

::: tip Teams with Active Projects

To delete a Team, you must first delete any active Projects within it.

:::
