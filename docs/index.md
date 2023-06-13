---
layout: home
---

<script setup>
  import CodeToggler from "./.vitepress/components/home/CodeToggler.vue"
  import UseCase from "./.vitepress/components/home/UseCase.vue"
  import Footer from "./.vitepress/components/home/Footer.vue"
  import SelfHosting from "./.vitepress/components/home/SelfHosting.vue"
  import Article from "./.vitepress/components/home/Article.vue"
  import Github from "./.vitepress/components/home/icons/Github.vue"
</script>

<div class="hero hero-container flex">
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

<Tabs :tabs="['Developer Reference', 'User Guide']">
	<template #developer-reference>
		<Card
			title="Authentication"
			text="Directus provides powerful authentication capabilities to effortlessly implement a robust authentication system."
			url="https://www.google.com/"
		/>
		<Card
			title="GraphQL"
			text="Directus provides powerful authentication capabilities to effortlessly implement a robust authentication system."
			url="https://www.google.com/"
		/>
		<Card
			title="APIs"
			text="Directus provides powerful authentication capabilities to effortlessly implement a robust authentication system."
			url="https://www.google.com/"
		/>
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

 <div class="hero-container gray-bg ">
      <div class="header centered-text vp-doc ">
        <h2>Check our Use Cases</h2>
        <p class="m-20">
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

<div class="hero-container flex">
<div class="header vp-doc max-width">
  <h2>Directus <br/>Self Hosting</h2>
  <p class="m-20">Self-hosting empowers customization and scalability, allowing you to tailor Directus to meet specific requirements.</p>
</div>
<div class="grid-2 m-20">
<SelfHosting class="m-20" title="Docker Guide" desc="Get up and running with our Docker Guide." img="/assets/docker.png" url='#' />
<SelfHosting class="m-20" title="CLI" desc="Get up and running with our CLI Guide." img="/assets/cli.png" url='#' />
</div>
</div>

<hr  />

  <div class="hero-container ">
      <div class="header vp-doc">
        <h2>Featured Articles</h2>
      </div>
      <div class="m-20 grid-4">
      <Article title="Directus Spotlight: Permissions and Access Control" tag="Product" img="/assets/directus-spotlight.png" url='#' author="Rijk van Zanten" date="Aug 2, 2022"  />
      <Article title="Directus Spotlight: Permissions and Access Control" tag="Product" img="/assets/directus-spotlight.png" url='#' author="Rijk van Zanten" date="Aug 2, 2022"  />
      <Article title="Directus Spotlight: Permissions and Access Control" tag="Product" img="/assets/directus-spotlight.png" url='#' author="Rijk van Zanten" date="Aug 2, 2022"  />
      <Article title="Directus Spotlight: Permissions and Access Control" tag="Product" img="/assets/directus-spotlight.png" url='#' author="Rijk van Zanten" date="Aug 2, 2022"  />
      </div>
      </div>

<hr  />

  <div class="hero-container">
      <div class="header centered-text vp-doc">
        <h2>Contributing to Directus</h2>
        <p class="m-20">
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
      </div>
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
 color: black;
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
.hero-container {
  padding: 60px 120px;
}
.gray-bg {
  background: #f0f4f9;
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


.max-width {
  max-width: 480px;
}
@media only screen and (max-width: 768px) {
  .flex {
    flex-direction: column;
  }
  .hero-container {
    padding: 48px;
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
}

</style>
