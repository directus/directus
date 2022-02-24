# Projects

> Cloud projects are on-demand instances of Directus contained within a parent Team.

[[toc]]

## Creating a Community Project

![Create Community Project](image.webp)

1. Sign in to the Cloud Dashboard.
2. Navigate to the Projects Page.
3. Click **"Create Project"**.
4. Set a Project Name.
5. Select the Community tier.
6. Click **"Create Project"**.

## Creating a Standard Project

![Create Standard Project](image.webp)

1. Sign in to the Cloud Dashboard.
2. Navigate to the Projects Page.
3. Click **"Create Project"**.
4. Set a Project Name.
5. Select the tier (Community or Standard).
6. Set the Project URL, Datacenter Region, Node Type, Load Balancing, Auto-Scaling as desired. _(Community Projects skip
   this step as these are pre-configured for you)_.
7. Community Projects clicks

## Enterprise Projects

For more information on Enterprise Project support, [contact Sales](https://directus.io/contact/).

## Managing a Project

![Managing a Project](image.webp)

1. Sign in to the Cloud Dashboard.
2. Open the Team Menu in the Dashboard Header.
3. Select the appropriate team from the dropdown.
4. Navigate to the Projects Page.
5. Click the Project you wish to manage. From this Project Dashboard page you can view Node Usage, horizontal scaling,
   requests and bandwidth. You may also change project details or upgrade the Project's plan. To make these:
6. Click **"Edit"**.

## Accessing a Project

![Accessing a Project](image.webp)

1. Sign in to the Cloud Dashboard.
2. Open the Team Menu in the Dashboard Header.
3. Select the appropriate team from the dropdown.
4. Navigate to the "Projects" page.
5. Click the <span mi icon>launch</span> for the desired project.
6. You will be directed to your Project

## Destroying a Project

![Destroying a Project](image.webp)

This action is permanent and irreversible. Destroying a Directus Cloud Project completely removes all its data, files,
and users from our platform. To destroy a Directus Cloud Project, follow these steps:

1. Sign in to the Cloud Dashboard.
2. Open the Team Menu in the Dashboard Header.
3. Select the appropriate team from the dropdown.
4. Navigate to the "Projects" page.
5. Click the project you wish to delete.
6. Click **"Edit"**.
7. Scroll to the bottom of the page and click <span mi icon danger>local_fire_department</span>.
8. Type in the project name.
9. Click **"Destroy Project"** button.

::: danger Proceed with extreme caution!

This action will break any external apps connecting to the project API or linking to project files. This action cannot
be undone. Directus Cloud is not responsible for data or files lost due to this action.

:::
