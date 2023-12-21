---
layout: home
---

<script setup lang="ts">
import { data } from '@/data/blog.data.js';
import Pattern from '@/components/home/Pattern.vue';
import Footer from '@/components/home/Footer.vue';
import Github from '@/components/home/icons/Github.vue';
import Badge from '@/components/Badge.vue';
</script>

<section :class="[$style.hero, $style.paddingBox]">
	<div :class="$style.heroPattern">
		 <Pattern />
	</div>
	<div :class="[$style.sectionContainer, $style.sectionContainerHero, $style.flex]">
		<div :class="[$style.heroContent, $style.sectionPaddingHero]">
			<Badge>Resource Hub</Badge>
			<h1>Directus Documentation</h1>
			<p>Explore our resources and powerful data engine to build your projects confidently.</p>
			<div :class="[$style.heroButtons, $style.buttonGroup]">
				<Button href="/getting-started/quickstart">Get Started</Button>
				<Button secondary :icon="Github" href="https://github.com/directus/directus/" external>GitHub</Button>
			</div>
		</div>
		<div :class="$style.heroToggler">

<SnippetToggler :choices="['REST', 'GraphQL', 'SDK']" group="api" alwaysDark maintainHeight>
<template #rest>

```js
GET /items/articles/4
	?fields[]=id
	&fields[]=status
	&fields[]=title
	&fields[]=category
	&fields[]=image.id
	&fields[]=image.name
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
await directus.request(
  readItem('articles', 4, {
    fields: [
      'id',
      'status',
      'title',
      'category,',
      { image: ['id', 'name'] }
    ]
  })
);
```

</template>
</SnippetToggler>
		</div>
	</div>

</section>

<section :class="[$style.sectionPaddingLg, $style.paddingBox]">
	<Tabs :class="[$style.sectionContainer, $style.whiteBg]" :tabs="['Developer Reference', 'User Guide']">
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

<div :class="$style.paddingBox">
	<div :class="$style.sectionContainer">
		<Divider />
	</div>
</div>

<section :class="[$style.sectionPaddingMd, $style.paddingBox]">
	<div :class="[$style.sectionContainer]">
		<div :class="$style.header">
			<h2>Latest From The Blog</h2>
			<p>
				Project tutorials, tips & tricks, and best practices from the Directus team and community.
			</p>
		</div>
		<div :class="[$style.grid4, $style.m60]">
			<Article
				v-for="article in data.blog.articles.slice(0,4)"
				:key="article.id"
				:title="article.title"
				:desc="article.description"
				:url="`/blog/${article.id}`"
				:img="`https://marketing.directus.app/assets/${article.image}?key=card`"
				:showMeta="false"
			/>
		</div>
		<div :class="$style.header">
			<Button href="/blog/">View All Posts</Button>
		</div>
	</div>
</section>

<section :class="[$style.grayBg, $style.paddingBox]">
	<div :class="[$style.sectionContainer, $style.sectionPaddingMd]">
		<div :class="$style.header">
			<h2>Framework Guides</h2>
			<p>
				Combine Directus with your favorite framework to create dynamic and efficient web applications.
			</p>
		</div>
		<div :class="[$style.grid3, $style.m60]">
			<Article
				title="Build a Static Website with Nuxt.js"
				desc="Learn how to build a website using Directus as a CMS and Nuxt 3."
				img="/assets/nuxt-guide.png"
				url="/guides/headless-cms/build-static-website/nuxt-3"
			/>
			<Article
				title="Set up Live Preview in a Next.js project"
				desc="By adding a preview URL, you can instantly see live changes made to your collection."
				img="/assets/next-guide.png"
				url="/guides/headless-cms/live-preview/nextjs"
			/>
			<Article
				title="Build a Multi-User Chat With React.js"
				desc="Deep dive into how to use Directus websockets to build an interactive chat application."
				img="/assets/react-guide.png"
				url="/guides/real-time/chat/react"
			/>
		</div>
		<div :class="$style.header">
			<Button href="/guides">View All Guides</Button>
		</div>
	</div>
</section>

<section :class="[$style.sectionPaddingMd, $style.paddingBox]">
	<div :class="[$style.sectionContainer, $style.sectionContainerSelfHosted]">
		<div :class="[$style.header, $style.headerSelfHosted]">
			<h2 :class="$style.headingSelfHosted">
				Self Hosted
				<span style="white-space: nowrap">Directus</span>
			</h2>
			<p>
				Learn how to run Directus on your own machine, customize settings, and deploy with confidence.
			</p>
		</div>
		<div :class="[$style.grid2, $style.m60]">
			<Article
				title="Get Started with Docker"
				desc="Get up and running with our Docker Guide."
				img="/assets/docker.png"
				url="/self-hosted/quickstart"
			/>
			<Article
    			title="Config Options"
    			desc="A reference of all possible settings in your project."
    			img="/assets/config-options.png"
    			url="/self-hosted/config-options"
    		/>
    	</div>
    </div>
</section>

<div :class="$style.paddingBox">
	<div :class="$style.sectionContainer">
		<Divider />
	</div>
</div>

<section :class="[$style.sectionContainer, $style.sectionPaddingMd, $style.paddingBox]">
	<div :class="$style.header">
		<h2>Contributing to Directus</h2>
		<p>
			There are many ways in which you can contribute to the health and growth of the Directus project.
		</p>
		<div :class="$style.buttonGroup">
			<Button href="https://discord.com/invite/directus" external>Join the Community</Button>
			<Button secondary :icon="Github" href="https://github.com/directus/directus/" external>GitHub</Button>
		</div>
	</div>
	<div :class="[$style.grid3, $style.m60]">
		<Card
			h="3"
			title="Request a Feature"
			text="Propose new features to improve Directus. Find out how we use GitHub Discussions to organize requests."
			url="/contributing/feature-request-process"
			icon="post_add"
		/>
		<Card
			h="3"
			title="Contribute via Code"
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

<style module>
@import './home.css';
</style>
