---
layout: home
---

<script setup>
  import CodeToggler from "./.vitepress/components/home/CodeToggler.vue"
  import UseCase from "./.vitepress/components/home/UseCase.vue"
  import Footer from "./.vitepress/components/home/Footer.vue"
  import SelfHosting from "./.vitepress/components/home/SelfHosting.vue"
  import Article from "./.vitepress/components/home/Article.vue"
  import Articles from "./.vitepress/components/home/Article.vue"
  import Github from "./.vitepress/components/home/icons/Github.vue"
  import Divider from "./.vitepress/components/Divider.vue"
  import { data as articles } from "./index.data.js"
</script>

<section class="hero">
  <div class="section-container section-padding--hero flex">
    <div class="hero-content">
      <h1 class="m-20 ">Directus Documentation</h1>
      <p class="m-20">
        Navigate your way through our resources to build your projects with our robust data engine.
      </p>
      <div class="hero-buttons">
        <a class="primary-btn" href="#">Get Started</a>
        <a class="secondary-btn inline-flex" href="#" target="_blank">GitHub<Github/></a
        >
      </div>
    </div>
    <CodeToggler class="hero-toggler" />
  </div>
</section>

<section class="section-container section-padding--lg">
  <Tabs class="white-bg" :tabs="['Developer Reference', 'User Guide']">
    <template #developer-reference>
      <Card
        title="Authentication"
        text="Directus provides powerful authentication capabilities to effortlessly implement a robust authentication system."
        url="https://www.google.com/"
        icon="check"
      />
      <Card
        title="GraphQL"
        text="Directus provides powerful authentication capabilities to effortlessly implement a robust authentication system."
        url="https://www.google.com/"
        icon="full_stacked_bar_chart"
      />
      <Card
        title="APIs"
        text="Directus provides powerful authentication capabilities to effortlessly implement a robust authentication system."
        url="https://www.google.com/"
        icon="api"
      />
      <Card
        title="Extensions"
        text="Directus provides powerful authentication capabilities to effortlessly implement a robust authentication system."
        url="https://www.google.com/"
        icon="extension"
      />
      <Card
        title="Real Time"
        text="Directus provides powerful authentication capabilities to effortlessly implement a robust authentication system."
        url="https://www.google.com/"
        icon="insights"
      />
      <Card
        title="Self Hosting"
        text="Directus provides powerful authentication capabilities to effortlessly implement a robust authentication system."
        url="https://www.google.com/"
        icon="view_module"
      />
    </template>
    <template #user-guide>
      <Card
        title="Extensions"
        text="Directus provides powerful authentication capabilities to effortlessly implement a robust authentication system."
        url="https://www.google.com/"
      />
      <Card
        title="Real Time"
        text="Directus provides powerful authentication capabilities to effortlessly implement a robust authentication system."
        url="https://www.google.com/"
      />
      <Card
        title="Self Hosting"
        text="Directus provides powerful authentication capabilities to effortlessly implement a robust authentication system."
        url="https://www.google.com/"
      />
    </template>
  </Tabs>
</section>

<section class="gray-bg">
  <div class="section-container section-padding--md">
    <div class="header centered-text vp-doc">
      <h2>Check our Use Cases</h2>
      <p class="m-20 text-muted">
        Directus combines BaaS, Headless CMS, and internal tools for seamless
        backend management, content distribution, and workflow optimization.
      </p>
    </div>
    <div class="grid-3">
      <UseCase title="Backend-As-A-Service" tag="Backend" desc="Quickly build digital
      projects with our feature-rich toolkit that configures your backend logic." img="/assets/baas.png" url='#' />
      <UseCase title="Headless CMS" tag="CMS" desc="Manage content, users, and assets with no limitations or barriers." img="/assets/headless-cms.png" url='#' />
      <UseCase title="Internal Tools" tag="Tools" desc="Build workflows, dashboards and  customized internal apps faster." img="/assets/internal-tools.png" url='#' />
    </div>
  </div>
</section>

<section class="section-padding--md">
  <div class="section-container flex">
    <div class="header vp-doc max-width">
      <h2 class="sh-heading">Directus <span style="white-space:nowrap;">Self Hosting</span></h2>
      <p class="m-20 text-muted">
        Self-hosting empowers customization and scalability, allowing you to tailor Directus to meet specific requirements.
      </p>
    </div>
    <div class="grid-2 m-20">
      <SelfHosting class="m-20" title="Docker Guide" desc="Get up and running with our Docker Guide." img="/assets/docker.png" url='#' />
      <SelfHosting class="m-20" title="CLI" desc="Get up and running with our CLI Guide." img="/assets/cli.png" url='#' />
    </div>
  </div>
</section>

<div class="section-container">
  <Divider />
</div>

<section class="section-container section-padding--md">
  <div class="header vp-doc">
    <h2>Featured Articles</h2>
  </div>

  <div class="article-grid section-padding--md">
    <Article v-for="article in articles.data" :title="article.title" :tag="article.category" :img="article.image" :url='article.slug' :author="article.author" :date="new Date(article.publish_date).toDateString()"  />
  </div>
</section>

<div class="section-container">
  <Divider />
</div>

<section class="section-container section-padding--md">
  <div class="header centered-text vp-doc">
    <h2>Contributing to Directus</h2>
    <p class="m-20 text-muted">
      Directus combines BaaS, Headless CMS, and internal tools for seamless
      backend management, content distribution, and workflow optimization.
    </p>
    <div class="max-btn-width">
      <a class="outline-btn" href="#">Contact Us</a>
      <a class="secondary-btn inline-flex " href="#" target="_blank">GitHub<Github/></a
        >
    </div>
  </div>
  <div class="grid-3">
    <Card
    h="3"
    title="Report a Bug"
    text="Directus provides powerful authentication capabilities to effortlessly implement a robust authentication system."
    url="https://www.google.com/"
    icon="bug_report"
    />
    <Card
    h="3"
    title="Create a PR"
    text="Directus provides powerful authentication capabilities to effortlessly implement a robust authentication system."
    url="https://www.google.com/"
    icon="domain_verification"
    />
    <Card
    h="3"
    title="Request a Feature"
    text="Directus provides powerful authentication capabilities to effortlessly implement a robust authentication system."
    url="https://www.google.com/"
    icon="post_add"
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
  background: #011026;
  background: linear-gradient(172deg,#64f 20%,#f9d 300%);
  color: white;
}

.hero-badge {
  background: #FF99DD;
  border-radius: 6px;
  display: inline-block;
  font-size: 13px;
  font-weight: 600;
  padding: 4px;
}

.hero-content {
  max-width: 580px;
}
.hero-content h1 {
  font-size: 60px;
  font-weight: 900;
  line-height: 1;

}
.hero-content p {
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
	font-weight: 500;
	margin-top: 20px;
	padding: 12px;
}

.primary-btn {
  background: #fff;
  border-radius: 24px;
  color: #64f;
  font-size: 16px;
  padding: 8px 16px;
}
.primary-btn:hover {
  background-color: #f0f4f9;
  transition: 0.4s;
}
.secondary-btn {
  padding: 16px;
  margin-left: 20px;
}

.secondary-btn:hover {
  text-decoration: underline;
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
  background: var(--vp-sidebar-bg-color);
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
  max-width: 480px;
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
