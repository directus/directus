# Projects

> Cloud Projects are on-demand instances of Directus contained within a parent Team. There 3 basic service tiers;
> Community, Standard and Enterprise. Keep in mind all three tiers come with everything in Directus Core.

[[toc]]

In additon to simply listing all Projects within a Team, the Projects Page serves as the entry-point to creating,
editing and deleting Projects as well as monitoring overall server performance and accessing the Project itself.

## Create a Project

Only Standard and Community Projects can be spun-up from the Directus Dashboard. The process for both is almost
identical and the only difference is that Community Projects just have fewer configuration options.

![Creating a Standard Project](https://cdn.directus.io/docs/v9/cloud/projects/projects-20220225A/create-standard-project-20220228A.webp)

1. Sign in to the Cloud Dashboard.
2. Navigate to the Projects Page.
3. Click **"Create Project"**.
4. Set a Project Name.
5. Select the Tier: Community or Standard.

#### For Standard Projects:

6. Set the following as desired.
   - [Project URL]() - Custom _(if it's available of course)_.
   - [Datacenter]() – Options are `United States, East` or `Europe, Frankfurt`.
   - [Node Type]() – Choose General Purpose or Performance Tier.
   - [Load Balancing]() – Choose from 1-6 active nodes.
   - [Auto-Scaling]() – Choose from 0-6 standby nodes.
7. Click **"Proceed to Checkout"**. You will be taken to a checkout page.
8. Enter payment information and hit **"Subscribe"**.

#### For Community Projects:

6. Scroll to the bottom and Choose:
   - **"Empty Project"** to spinup a blank Project with no data.
   - **"Demo Project"** to spinup a Project with dummy data to get a concrete example of how Directus works and some of
     the things it can do.

:::tip Community Tier

- **Project Name** – Custom.
- **URL** – Randomized.
- **Datacenter** – United States (East).
- **Node Type** – Smaller non-production servers.
- **Load Balancing** – 1 Auto-Sleep Node.
- **Auto-Scaling** – No Standby Nodes.

:::

:::tip Enterprise Tier

Please [contact us]() if you need more power, customization, or scale.

:::

::: tip Can I Upgrade or Downgrade Projects?

Switching from Community to Standard will be a feature in the future. Projects can always be upgraded to Enterprise.

:::

## Edit a Project

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

## Monitor a Project

Graphs on the Project Monitor Page display traffic and performance information and help inform configuration decisions.

<video alt="Create Account and Login" loop muted controls autoplay>
  <source src="" type="video/mp4">
</video>

### Combined Node Usage

### Horizontal Scaling

### API Requests

### API Bandwidth

## Access Project

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
