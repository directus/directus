---
layout: home
---

<script setup>
  import Footer from "./.vitepress/components/home/Footer.vue"
  import SelfHosting from "./.vitepress/components/home/SelfHosting.vue"
  import Article from "./.vitepress/components/home/Article.vue"
  import Github from "./.vitepress/components/home/icons/Github.vue"
  import Divider from "./.vitepress/components/Divider.vue"
  import SnippetToggler from "./.vitepress/components/SnippetToggler.vue"
  import Pattern from "./.vitepress/components/Pattern.vue"
  import { data as articles } from "./index.data.js"
</script>

<section class="hero padding-box">
  <div class="section-container section-padding--hero flex">
    <div class="hero-content">
      <p class="hero-badge">Resource Hub</p>
      <h1 class="m-20 ">Directus Documentation</h1>
      <p class="m-20">
       Explore our resources and powerful data engine to build your projects confidently.
      </p>
      <div class="hero-buttons">
        <a class="primary-btn" href="/getting-started/quickstart">Get Started</a>
        <a class="secondary-btn inline-flex"
        href="https://github.com/directus/directus/" target="_blank">GitHub<Github style="margin-left: 6px;"/></a
        >
      </div>
    </div>
    <div class="hero-toggler">

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" label="API">
<template #rest>

```js
GET /items/products/4
	?fields[]=id,status,title,category,image.id,image.name
```

</template>

<template #graphql>

```graphql
query {
	articles_by_id(id: 4) {
		id
		status
		title
		category
		image {
			id
			name
		}
	}
}
```

</template>

<template #sdk>

```js
await directus.items('articles').readOne(4, {
	fields: [
		'id',
		'status',
		'title',
		'category',
		'image.id',
		'image.name'
	],
});
```

</template>
</SnippetToggler>
  </div>
  <div class="hero-pattern">
    <Pattern />
  </div>

</div>
</section>

<section class="section-container section-padding--lg">
  <Tabs class="white-bg" :tabs="['Developer Reference', 'User Guide']">
    <template #developer-reference>
     <Card
        title="Database APIs"
        text="Use our dynamic REST and GraphQL APIs to access and efficiently manage your data."
        url="/reference/introduction"
        icon="api"
      />
    <Card
        title="Data Model"
        text="Structure and organize items in your collection, while also establishing relationships between them."
        url="/app/data-model"
        icon="database"
      />
       <Card
        title="Authentication"
        text="Use our powerful and simple authentication features in your own applications."
        url="/reference/authentication"
        icon="lock"
      />
       <Card
        title="Extensions"
        text="Build, modify or expand any feature needed for your project with our flexible extensions."
        url="/extensions/introduction"
        icon="extension"
      />
      <Card
        title="Realtime"
        text="Access real-time data in your project with WebSockets, backed by your database."
        url="/guides/real-time/getting-started/"
        icon="bolt"
      />
       <Card
        title="Flows"
        text="Create custom, event-driven data processing and task automation workflows."
        url="/app/flows"
        icon="flowsheet"
      />
    </template>
    <template #user-guide>
      <Card
        title="Content Module"
        text="Empower your entire team to interact with and manage items in your collection."
        url="/user-guide/content-module/content"
        icon="deployed_code"
      />
      <Card
        title="User Management"
        text="Learn about adding users, granular roles, and access permissions to your projects."
        url="/user-guide/user-management/users-roles-permissions"
        icon="group"
      />
       <Card
        title="File Storage"
        text="Store and retrieve files, use storage adapters, and learn about media transformations."
        url="/user-guide/file-library/files"
        icon="folder_copy"
      />
       <Card
        title="Insights Dashboard"
        text="Build custom analytics dashboards directly from your data to gain meaningful business insights. "
        url="/user-guide/insights/dashboards"
        icon="insights"
      />
       <Card
        title="Translation"
        text="Easily manage multilingual content, making your projects accessible and user-friendly for a global audience."
        url="/user-guide/content-module/translation-strings"
        icon="g_translate"
      />
       <Card
        title="Directus Cloud"
        text="Explore key aspects of Directus Cloud including the dashboard, projects, and members."
        url="/user-guide/cloud/overview"
        icon="cloud"
      />
    </template>
  </Tabs>
</section>

<section class="gray-bg">
  <div class="section-container section-padding--md">
    <div class="header centered-text vp-doc">
      <h2>Framework Guides</h2>
      <p class="m-20 text-muted">
   Combine Directus with your favorite framework to create dynamic and efficient web applications
      </p>
    </div>
    <div class="grid-3">
      <Article title="Build a Static Website with Nuxt.js" tag="Nuxt.js" desc="Learn how to build a website using Directus as a CMS and Nuxt 3." img="/assets/nuxt-guide.png" url='/guides/headless-cms/build-static-website/nuxt-3' />
      <Article title="Set up Live Preview in a Next.js project" tag="Next.js" desc="By adding a preview URL, you can instantly see live changes made to your collection." img="/assets/next-guide1.png" url='/guides/headless-cms/live-preview/nextjs' />
      <Article title="Build a Multi-User Chat With React.js" tag="React.js" desc="Deep dive into how to use Directus websockets to build an interactive chat application." img="/assets/react-guide.png" url='/guides/real-time/chat/react' />
    </div>
  </div>
</section>

<section class="section-padding--md">
  <div class="section-container flex">
    <div class="header vp-doc max-width">
      <h2 class="sh-heading">Self Hosted <span style="white-space:nowrap;">Directus</span></h2>
      <p class="m-20 text-muted">
       Learn how to run Directus on your own machine, customize settings, and deploy with confidence.
      </p>
    </div>
    <div class="grid-2 m-20">
      <SelfHosting class="m-20" title="Get Started with Docker" desc="Get up and running with our Docker Guide." img="/assets/docker.png" url='/self-hosted/docker-guide' />
      <SelfHosting class="m-20" title="Config Options" desc="A reference of all possible settings in your project." img="/assets/config-options.png" url='/self-hosted/config-options' />
    </div>
  </div>
</section>

<div class="section-container">
  <Divider />
</div>

<section class="section-container section-padding--md">
  <div class="header centered-text vp-doc">
    <h2>Contributing to Directus</h2>
    <p class="m-20 text-muted">
     There are many ways in which you can contribute to the health and growth of the Directus project
    </p>
    <div>
      <a class="outline-btn" href="https://discord.com/invite/directus" target="_blank" rel="noreferrer noopener">Join the Community</a>
      <a class="secondary-btn inline-flex " href="https://github.com/directus/directus/" target="_blank" rel="noreferrer noopener">GitHub<Github style="margin-left: 6px;"/></a
        >
    </div>

  </div>
  <div class="grid-3">
   <Card
    h="3"
    title="Request a Feature"
    text="Propose new features to improve Directus. Find out how we use GitHub Discussions to organize requests."
    url="/contributing/feature-request-process"
    icon="post_add"
    />
    <Card
    h="3"
    title="Contribute via code"
    text="Make a significant impact with code contributions. Read our Pull Request process and find out about our CLA."
    url="/contributing/introduction"
    icon="code"
    />
    <Card
    h="3"
    title="Sponsorship & Advocacy"
    text="Sponsor our project, increase its visibility and find out how to share the word with others!"
    url="/contributing/sponsor"
    icon="handshake"
    />

  </div>
</section>

<Footer />

<style scoped>
	@import './home.css';
</style>
