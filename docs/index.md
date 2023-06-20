---
layout: home
---

<script setup>
  import CodeToggler from "./.vitepress/components/home/CodeToggler.vue"
  import Footer from "./.vitepress/components/home/Footer.vue"
  import SelfHosting from "./.vitepress/components/home/SelfHosting.vue"
  import Article from "./.vitepress/components/home/Article.vue"
  import Github from "./.vitepress/components/home/icons/Github.vue"
  import Divider from "./.vitepress/components/Divider.vue"
  import { data as articles } from "./index.data.js"
</script>

<section class="hero">
  <div class="section-container section-padding--hero flex">
    <div class="hero-content">
      <p class="hero-badge">Resource Hub</p>
      <h1 class="m-20 ">Directus Documentation</h1>
      <p class="m-20 hero-paragraph">Explore our resources and powerful data engine to build your projects confidently.
</p> <div class="hero-buttons"> <a class="primary-btn" href="#">Get Started</a>
<a class="secondary-btn inline-flex" href="#" target="_blank">GitHub<Github style="margin-left: 6px;"/></a
        > </div> </div> <CodeToggler class="hero-toggler" />

  </div>
</section>

<section class="section-container section-padding--lg">
  <Tabs class="white-bg" :tabs="['Developer Reference', 'User Guide']">
    <template #developer-reference>
     <Card
        title="Database APIs"
        text="Use our dynamic REST and GraphQL APIs to access and efficiently manage your data."
        url="https://www.google.com/"
        icon="api"
      />
    <Card
        title="Data Model"
        text="Structure and organize items in your collection, while also establishing relationships between them."
        url="https://www.google.com/"
        icon="database"
      />
       <Card
        title="Authentication"
        text="Use our powerful and simple authentication features in your own applications."
        url="https://www.google.com/"
        icon="lock"
      />
       <Card
        title="Extensions"
        text="Build, modify or expand any feature needed for your project with our flexible extensions."
        url="https://www.google.com/"
        icon="extension"
      />
      <Card
        title="Real Time"
        text="Access real-time data in your project with WebSockets, backed by your database."
        url="https://www.google.com/"
        icon="bolt"
      />
       <Card
        title="Flows"
        text="Create custom, event-driven data processing and task automation workflows."
        url="https://www.google.com/"
        icon="flowsheet"
      />
    </template>
    <template #user-guide>
      <Card
        title="Content Module"
        text="Empower your entire team to interact with and manage items in your collection."
        url="https://www.google.com/"
        icon="deployed_code"
      />
      <Card
        title="User Management"
        text="Learn about adding users, granular roles, and access permissions to your projects."
        url="https://www.google.com/"
        icon="group"
      />
       <Card
        title="File Storage"
        text="Store and retrieve files, use storage adapters, and learn about media transformations."
        url="https://www.google.com/"
        icon="folder_copy"
      />
       <Card
        title="Insights Dashboard"
        text="Build custom analytics dashboards directly from your data to gain meaningful business insights. "
        url="https://www.google.com/"
        icon="insights"
      />
       <Card
        title="Translation"
        text="Easily manage multilingual content, making your projects accessible and user-friendly for a global audience."
        url="https://www.google.com/"
        icon="g_translate"
      />
       <Card
        title="Directus Cloud"
        text="Explore key aspects of Directus Cloud including the dashboard, projects, and members."
        url="https://www.google.com/"
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
      <Article title="Build a Static Website with Nuxt.js" tag="Nuxt.js" desc="Learn how to build a website using Directus as a CMS and Nuxt 3." img="/assets/baas.png" url='#' />
      <Article title="Set up Live Preview in a Next.js project" tag="Next.js" desc="By adding a preview URL, you can instantly see live changes made to your collection." img="/assets/headless-cms.png" url='#' />
      <Article title="Build a Multi-User Chat With React.js" tag="React.js" desc="Deep dive into how to use Directus websockets to build an interactive chat application." img="/assets/internal-tools.png" url='#' />
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
      <SelfHosting class="m-20" title="Get Started with Docker" desc="Get up and running with our Docker Guide." img="/assets/docker.png" url='#' />
      <SelfHosting class="m-20" title="Config Options" desc="A reference of all possible settings in your project." img="/assets/cli.png" url='#' />
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
      <a class="outline-btn" href="#">Join the Community</a>
      <a class="secondary-btn inline-flex " href="#" target="_blank">GitHub<Github style="margin-left: 6px;"/></a
        >
    </div>

  </div>
  <div class="grid-3">
   <Card
    h="3"
    title="Request a Feature"
    text="Propose new features to improve Directus. Find out how we use GitHub Discussions to organize requests."
    url="https://www.google.com/"
    icon="post_add"
    />
    <Card
    h="3"
    title="Contribute via code"
    text="Make a significant impact with code contributions. Read our Pull Request process and find out about our CLA."
    url="https://www.google.com/"
    icon="code"
    />
    <Card
    h="3"
    title="Sponsorship & Advocacy"
    text="Sponsor our project, increase its visibility and find out how to share the word with others!"
    url="https://www.google.com/"
    icon="handshake"
    />
   
  </div>
</section>

<Footer />

<style>
.VPHome {
  max-width: unset;

}
.VPHome[data-v-ecbca2fe] {
 padding-bottom: 0;
}
.vp-doc h2 {
  border-top: 0;
  margin: 0;
  line-height: 1.2;
}
.vp-doc a {
  color: var(--vp-c-text-1);
}
.vp-doc a:hover {
  text-decoration: none;
}

a {
  cursor: pointer;
  font-size: 16px;
  text-decoration: none;
}

hr {
  border-color: #dadada57;
  margin: 0 120px;
}

:root {
  --vp-layout-max-width: 1280px;
}

.section-container {
  padding-inline: 24px;
  max-width: var(--vp-layout-max-width);
  margin-inline: auto;
}

.section-padding--md {
 padding-block: 60px;
}

.section-padding--lg {
  padding-block: 120px;
}

.section-padding--hero {
 padding-block: 120px;
}

.hero {
  background: #0E1C2F;
  color: white;
  margin-inline: 40px;
  border-radius: 12px;
}

.hero-badge {
  color: #FE97DC;
  font-size: 14px;
  font-weight: 700;
  text-transform: uppercase;
  
}

.hero-content {
  max-width: 580px;
}
.hero-content h1 {
  font-size: 60px;
  font-weight: 700;
  line-height: 1;

}
.hero-paragraph {
  font-size: 21px;
  line-height: 1.5;

}
.hero-buttons {
  margin: 48px 0;
  max-width: 300px;
  font-weight: 600;
}

.outline-btn {
	display: inline-block;
	border: 1px solid;
	border-color: var(--vp-c-divider);
	border-radius: 8px;
	color: var(--vp-c-text-1);
	font-weight: 600;
  font-size: 14px;
	margin-top: 10px;
	padding: 4px 12px;
}

.primary-btn {
  background: #fff;
  border-radius: 12px;
  color: #0E1C2F;
  font-size: 16px;
  padding: 12px 16px;
}
.primary-btn:hover {
  background-color: #f0f4f9;
  transition: 0.4s;
}
.secondary-btn {
  padding: 16px;
  margin-left: 32px;
  color: #D1D3D5;
}


.hero-toggler {
  background-color: #1F1938;
  border-radius: 8px;
  width: 100%;
  max-width: 590px;

}
.flex {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.inline-flex {
  display: inline-flex;
}

.white-bg {
  background: var(--vp-c-bg);
}
.gray-bg {
  background: var(--vp-c-bg-soft);
}

.text-muted {
   color: var(--vp-c-text-2);
}

.header h2 {
  font-size: 38px;
}
.header p {
  font-size: 20px;
  line-height: 1.5;
}
.centered-text {
  text-align: center;
  max-width: 680px;
  margin: 0 auto;
}

.divider {
  height: 1px;
  background: var(--vp-c-divider);
}

.m-20 {
    margin: 20px 0;
}
.m-10 {
    margin: 10px 0;
}
.m-6 {
    margin: 6px 0;
}
.max-btn-width {
  max-width: 260px;
  margin: 0 auto;
}
.grid-2 {
	display: grid;
	grid-template-columns: repeat(2, 1fr);
	gap: 24px;
}
.grid-3 {
	display: grid;
	grid-template-columns: repeat(3, 1fr);
	gap: 24px;
  margin: 60px 0;
}
.grid-4 {
  display: grid;
	grid-template-columns: repeat(4, 1fr);
	gap: 12px;
  margin: 60px 0;
}

.article-grid {
  display: grid;
	grid-template-columns: repeat(1, 1fr);
	gap: 40px;
}

.max-width {
  max-width: 420px;
}

@media only screen and (min-width: 768px) {
  .sh-heading {
    max-width: 10ch;
  }

  .article-grid {
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
  }
}

@media only screen and (max-width: 768px) {
  .flex {
    flex-direction: column;
    align-items: stretch;
  }

  .header h2 {
    font-size: 28px;
  }
  .header p {
    font-size: 18px;
  }
  
  .grid-2, .grid-3, .grid-4 {
    grid-template-columns: 1fr;
  }

  .hero-toggler {
    display: none;
  }
  .hero-content h1 {
  font-size: 48px;
  }

  .section-padding--hero {
    padding-block: 32px;
  }
}

</style>
