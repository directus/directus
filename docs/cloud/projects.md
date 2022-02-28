# Projects

> Cloud projects are on-demand instances of Directus contained within a parent Team.

![Projects](https://cdn.directus.io/docs/v9/cloud/projects/projects-20220225A/projects-20220225A.webp)

[[toc]]

## Creating a Community Project

![Creating a Community Project](https://cdn.directus.io/docs/v9/cloud/projects/projects-20220225A/create-community-project-20220228A.webp)

Learn more about Community Project in [Tiers and Billing](/cloud/tiers-and-billing/).

1. Sign in to the Cloud Dashboard.
2. Navigate to the Projects Page.
3. Click **"Create Project"**.
4. Set a Project Name.
5. Select the Community tier.
6. Scroll to the bottom and select a Standard or Demo project.
7. Click **"Create Project"**.

## Creating a Standard Project

![Creating a Standard Project](https://cdn.directus.io/docs/v9/cloud/projects/projects-20220225A/create-standard-project-20220228A.webp)

Learn more about Standard Project configuration options in [Tiers and Billing](/cloud/tiers-and-billing/).

1. Sign in to the Cloud Dashboard.
2. Navigate to the Projects Page.
3. Click **"Create Project"**.
4. Set a Project Name.
5. Select the Standard Tier.
6. Set the following as desired:
   - Project URL
   - Datacenter Region
   - Node Type
   - Load Balancing
   - Auto-Scaling
7. Click **"Proceed to Checkout"**. You will be taken to a checkout page.
8. Enter payment information and hit **"Subscribe"**.

## Enterprise Projects

For more information on Enterprise Project support, [contact Sales](https://directus.io/contact/).

## Managing a Project

![Project Details Page](https://cdn.directus.io/docs/v9/cloud/projects/projects-20220225A/project-detail-page-20220225A.webp)

1. Sign in to the Cloud Dashboard.
2. Open the Team Menu in the Dashboard Header.
3. Select the appropriate Team from the dropdown.
4. Navigate to the Projects Page.
5. Click the Project to enter this Project Details page. You can view Node Usage, horizontal scaling, requests and
   bandwidth.

You may also change project details or modify the Project's plan. To make changes:

6. Click **"Edit"**.
7. Make node changes as desired.
8. Click **"Update Project"**.

## Accessing a Project

![Accessing a Project](https://cdn.directus.io/docs/v9/cloud/projects/projects-20220225A/accessing-a-project-20220228A.webp)

1. Sign in to the Cloud Dashboard.
2. Open the Team Menu in the Dashboard Header.
3. Navigate to the Projects page.
4. Click **"Open Project"**.
5. Your Project will open in a new tab.

## Destroying a Project

![Destroying a Project](https://cdn.directus.io/docs/v9/cloud/projects/projects-20220225A/destroy-project-20220225A.webp)

This action is permanent and irreversible. Destroying a Directus Cloud Project completely removes all its data, files,
and users from our platform. To destroy a Directus Cloud Project, follow these steps:

1. Sign in to the Cloud Dashboard.
2. Open the Team Menu in the Dashboard Header.
3. Select the appropriate team from the dropdown.
4. Navigate to the Projects page.
5. Click the Project you wish to delete.
6. Scroll to the bottom of the page and toggle <span mi icon dngr>local_fire_department</span>.
7. Type in the project name.
8. Click the **"Destroy Project"** button.

::: danger Proceed with extreme caution!

This action will break any external apps connecting to the project API or linking to project files. This action cannot
be undone. **Directus Cloud is not responsible for data or files lost due to this action!**

:::
