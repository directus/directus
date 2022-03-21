# Projects

> Cloud Projects are on-demand instances of Directus. A Cloud Project is contained and managed by one Team. There are 3
> Project tiers: Community, Standard and Enterprise.

[[toc]]

## View Projects

All Team Projects are listed on the Projects page.

![View Projects](image.webp)

1. Login to the Cloud Dashboard.
2. Open the Team Menu in the Dashboard Header.
3. Click to select the Team you wish to view Projects for.
4. Navigate to the Projects Page.

## Create a Project

Only Standard and Community Projects can be spun-up from the Directus Dashboard. The process for both is almost
identical and the only difference is that Community Projects have fewer configuration options and an option to create a
Demo Project with dummy data to get a better feel for how Directus works.

![Creating a Standard Project](https://cdn.directus.io/docs/v9/cloud/projects/projects-20220225A/create-standard-project-20220228A.webp)

1. Login to the Cloud Dashboard.
2. Open the Team Menu in the Dashboard Header.
3. Click to select the Team you wish to create a Project for.
4. Click **"Create Project"**.
5. Set a Project Name.
6. Select the [Project](#projects) tier: Community or Standard.

**For a Standard Project:**\
7. Set the following as desired.

- [Project URL](/cloud/glossary/#project-url)
- [Datacenter](/cloud/glossary/#data-processing)
- [Node Type](/cloud/glossary/#nodes)
- [Load Balancing](/cloud/glossary/#nodes)
- [Auto-Scaling](/cloud/glossary/#nodes)

8. Click **"Proceed to Checkout"**. You will be taken to a checkout page.
9. Enter payment information and hit **"Subscribe"**.

**For a Community Project:**\
7. Scroll to the bottom of the screen and choose a Starting Template:

- **"Empty Project"** — Spins up a blank Project with no data.
- **"Demo Project"** — Spins up a Project with dummy data.

8. Click **"Create Project"**.

:::tip Enterprise Tier

Please [contact sales](https://directus.io/contact/) if you need more power, customization, or scale.

:::

## Manage a Project

On Standard Projects, it is possible to change the Project Name as well as reconfigure
[the Node Type, number of Active Nodes and number of Standby Nodes](/cloud/glossary/#nodes). On Community Projects, the
only option available is to edit the Project's Name.

<video alt="Edit a Project" loop muted controls autoplay>
  <source src="" type="video/mp4">
</video>

1. Login to the Cloud Dashboard.
2. Open the Team Menu in the Dashboard Header.
3. Select the appropriate Team from the dropdown.
4. Navigate to the Projects Page.
5. Click the Project to enter the Project Monitor Page.
6. Click **"Edit"** to enter the Project Details Page.
7. Make changes as desired.
8. Click **"Update Project"**.

## Monitor a Project

Graphs on the [Project Monitor Page](/cloud/glossary/#project-monitor-page) display traffic and performance information.

<video alt="Monitor a Project" loop muted controls autoplay>
  <source src="" type="video/mp4">
</video>

1. Login to the Cloud Dashboard.
2. Open the Team Menu in the Dashboard Header.
3. Select the appropriate Team from the dropdown.
4. Navigate to the Projects Page.
5. Click the Project to enter the Project Monitor Page.

## Access Project

![Accessing a Project](https://cdn.directus.io/docs/v9/cloud/projects/projects-20220225A/accessing-a-project-20220228A.webp)

To access the Project, follow these steps:

1. Sign in to the Cloud Dashboard.
2. Open the Team Menu in the Dashboard Header.
3. Select the appropriate Team from the dropdown.
4. Navigate to the Projects page.
5. Click the Project to enter the Project Monitor Page.
6. Click **"Open Project"**.

Your Project login page will open in a new tab.

## Resume Paused Project

![Resume Paused Project](image.webp)

To resume a [paused Project](/cloud/glossary/#paused-project), follow these steps:

1. Sign in to the Cloud Dashboard.
2. Open the Team Menu in the Dashboard Header.
3. Select the appropriate Team from the dropdown.
4. Navigate to the Projects page.
5. Click the _paused_ Project to enter the Project Monitor Page.
6. Click **"Resume Project"**.

## Destroy a Project

![Destroying a Project](https://cdn.directus.io/docs/v9/cloud/projects/projects-20220225A/destroy-project-20220225A.webp)

This action is permanent and irreversible. Destroying a Directus Cloud Project completely removes all its data, files,
and users from our platform. To destroy a Directus Cloud Project, follow these steps:

1. Login to the Cloud Dashboard.
2. Open the Team Menu in the Dashboard Header.
3. Select the appropriate team from the dropdown.
4. Navigate to the Projects page.
5. Click the Project you wish to delete.
6. Scroll to the bottom of the page and toggle <span mi icon dngr>local_fire_department</span>.
7. Type in the Project Name.
8. Click **"Destroy Project"**.

::: danger Proceed With Extreme Caution!

This action will break any external apps connecting to the Project API or linking to project files. This action cannot
be undone. **Directus Cloud is not responsible for data or files lost due to this action!**

:::
