<template>
	<div class="theme-container homepage" :class="pageClasses" @touchstart="onTouchStart" @touchend="onTouchEnd">
		<Navbar v-if="shouldShowNavbar" @toggle-sidebar="toggleSidebar" />

		<div class="sidebar-mask" @click="toggleSidebar(false)" />

		<Sidebar class="homepage-sidebar" :items="sidebarItems" @toggle-sidebar="toggleSidebar">
			<template #top>
				<slot name="sidebar-top" />
			</template>
			<template #bottom>
				<slot name="sidebar-bottom" />
			</template>
		</Sidebar>

		<div class="header">
			<div class="text">
				<div>
					<h1>Directus Documentation</h1>
					<h3>Comprehensive tutorials, references, example code, and more for Directus.</h3>
				</div>
			</div>
			<HeaderBackgroundLight class="header-background-light" />
			<HeaderBackgroundDark class="header-background-dark" />
		</div>

		<div class="panels">
			<a href="/getting-started/introduction/" class="panel">
				<svg width="60" height="60" fill="none" xmlns="http://www.w3.org/2000/svg">
					<circle cx="30" cy="30" r="30" fill="#6644ff" />
					<path
						d="M33 21.98v7.04h-9.84l-1.18 1.17v-8.2H33Zm.98-1.96H21a.96.96 0 0 0-.98.98v14.02L24 30.98h9.98a1 1 0 0 0 1.04-.98v-9a1 1 0 0 0-1.04-.98ZM39 24h-2.02v9H24v2.02c0 .51.47.98.98.98H36l3.98 3.98v-15A.99.99 0 0 0 39 24Z"
						fill="#fff"
					/>
				</svg>
				<h2>Getting Started</h2>
				<span>Installation, an overview of basic concepts, and understanding the Directus ecosystem.</span>
			</a>
			<a href="/app/overview/" class="panel">
				<svg width="60" height="60" fill="none" xmlns="http://www.w3.org/2000/svg">
					<circle cx="30" cy="30" r="30" fill="#6644ff" />
					<path
						d="M21.98 24h18v-2.02h-18c-1.07 0-1.96.94-1.96 2.02v11.02H18v3h14.02v-3H21.98V24Zm19.04 2.02h-6a1 1 0 0 0-1.04.98v9.98c0 .57.47 1.04 1.04 1.04h6c.51 0 .98-.47.98-1.04V27a.99.99 0 0 0-.98-.98Zm-1.04 9H36v-7.04h3.98v7.04Z"
						fill="#fff"
					/>
				</svg>
				<h2>The App Guide</h2>
				<span>A non-technical overview of the Directus no-code App and its various features.</span>
			</a>
			<a href="/configuration/project-settings/" class="panel">
				<svg width="60" height="60" fill="none" xmlns="http://www.w3.org/2000/svg">
					<circle cx="30" cy="30" r="30" fill="#6644ff" />
					<path
						d="M21 35.02v1.96h6v-1.96h-6Zm0-12v1.96h9.98v-1.96H21ZM30.98 39v-2.02H39v-1.96h-8.02V33h-1.96v6h1.96Zm-6-12v2.02H21v1.96h3.98V33H27v-6h-2.02ZM39 30.98v-1.96h-9.98v1.96H39ZM33 27h2.02v-2.02H39v-1.96h-3.98V21H33v6Z"
						fill="#fff"
					/>
				</svg>
				<h2>Configuration</h2>
				<span>Administrator guides for tailoring the Directus platform to fit your exact project needs.</span>
			</a>
			<a href="/reference/introduction/" class="panel">
				<svg width="60" height="60" fill="none" xmlns="http://www.w3.org/2000/svg">
					<circle cx="30" cy="30" r="30" fill="#6644ff" />
					<path
						d="M30 29.02c-1.08 0-2.02.89-2.02 1.96 0 1.13.94 2.02 2.02 2.02s2.02-.9 2.02-2.02c0-1.07-.94-1.96-2.02-1.96Zm6 1.96a6.01 6.01 0 1 0-9 5.2l.98-1.73A4.02 4.02 0 0 1 30 27c2.2 0 3.98 1.78 3.98 3.98 0 1.5-.8 2.77-1.96 3.47L33 36.2a5.99 5.99 0 0 0 3-5.2ZM30 21a10 10 0 0 0-5.02 18.66l.99-1.74a8.14 8.14 0 0 1-3.99-6.94A8 8 0 0 1 30 23.02a8 8 0 0 1 8.02 7.96 8.08 8.08 0 0 1-4.04 6.94l1.04 1.74A10 10 0 0 0 30 21Z"
						fill="#fff"
					/>
				</svg>
				<h2>API Reference</h2>
				<span>A toolkit for connecting your data, including the REST API, GraphQL, CLI, SDK, and more.</span>
			</a>
			<a href="/extensions/introduction/" class="panel">
				<svg width="60" height="60" fill="none" xmlns="http://www.w3.org/2000/svg">
					<circle cx="30" cy="30" r="30" fill="#6644ff" />
					<path
						d="M33.98 27v4.64l-3.46 3.52v1.82h-1.04v-1.82l-3.46-3.52V27h7.96Zm0-6h-1.96v3.98h-4.04V21h-1.96v3.98h-.05A2 2 0 0 0 24 27v5.48L27.52 36v3h4.96v-3L36 32.48V27c0-1.08-.9-2.02-2.02-2.02V21Z"
						fill="#fff"
					/>
				</svg>
				<h2>Extensions</h2>
				<span>Tutorials for creating your own custom extensions within the Directus ecosystem.</span>
			</a>
			<a href="/contributing/introduction/" class="panel">
				<svg width="60" height="60" fill="none" xmlns="http://www.w3.org/2000/svg">
					<circle cx="30" cy="30" r="30" fill="#6644ff" />
					<path
						d="M34.5 21c-1.73 0-3.42.8-4.5 2.1a5.89 5.89 0 0 0-4.5-2.1 5.43 5.43 0 0 0-5.48 5.48c0 3.8 3.37 6.9 8.53 11.58L30 39.33l1.45-1.31c5.16-4.65 8.53-7.74 8.53-11.54 0-3.04-2.39-5.48-5.48-5.48Zm-4.4 15.56-.1.1-.1-.1c-4.77-4.31-7.92-7.17-7.92-10.08 0-1.96 1.5-3.46 3.52-3.46 1.55 0 3.05.98 3.56 2.34h1.88a3.88 3.88 0 0 1 3.56-2.34c2.02 0 3.52 1.5 3.52 3.46 0 2.91-3.15 5.77-7.93 10.08Z"
						fill="#fff"
					/>
				</svg>
				<h2>Contributing</h2>
				<span>Ready to start working on Directus Core? These Wikis will provide the tools needed to contribute.</span>
			</a>
		</div>

		<div class="listings">
			<div class="listing">
				<h2>Popular Configuration Topics</h2>
				<ul>
					<li><a href="/reference/filter-rules/">Filter Rules</a></li>
					<li><a href="/self-hosted/config-options/">Environment Variables</a></li>
					<li><a href="/configuration/relationships/">Data Relationships</a></li>
					<li><a href="/self-hosted/config-options/#authentication">Single Sign-On (SSO)</a></li>
					<li><a href="/self-hosted/installation/docker/">Installing with Docker</a></li>
				</ul>
			</div>

			<div class="listing">
				<h2>Popular Data Access Topics</h2>
				<ul>
					<li><a href="/reference/authentication/">API: Authentication</a></li>
					<li><a href="/reference/items/">API: Accessing Items</a></li>
					<li><a href="/reference/query/#filter">API: Filter Parameter</a></li>
					<li><a href="/reference/query/#fields">API: Fields Parameter</a></li>
					<li><a href="/reference/introduction/#rest-vs-graphql">API: GraphQL API</a></li>
				</ul>
			</div>
		</div>
		<!-- Start of HubSpot Embed Code -->
		<script type="text/javascript" id="hs-script-loader" async defer src="//js-na1.hs-scripts.com/20534155.js"></script>
		<!-- End of HubSpot Embed Code -->
	</div>
</template>

<script>
import Navbar from '@theme/components/Navbar.vue';
import Sidebar from "@theme/components/Sidebar.vue";
import HeaderBackgroundLight from '@theme/components/header-background/Light.vue';
import HeaderBackgroundDark from '@theme/components/header-background/Dark.vue';

export default {
	name: 'Layout',

	components: {
		Navbar,
		Sidebar,
		HeaderBackgroundLight,
		HeaderBackgroundDark,
	},

	data() {
		return {
			isSidebarOpen: false,
		};
	},

	computed: {
		shouldShowNavbar() {
			const { themeConfig } = this.$site;
			const { frontmatter } = this.$page;
			if (frontmatter.navbar === false || themeConfig.navbar === false) {
				return false;
			}
			return this.$title || themeConfig.logo || themeConfig.repo || themeConfig.nav || this.$themeLocaleConfig.nav;
		},

		shouldShowSidebar() {
			const { frontmatter } = this.$page;
			return (
				!frontmatter.home &&
				frontmatter.sidebar !== false &&
				this.sidebarItems.length
			);
		},

		sidebarItems() {
			return [];
		},

		pageClasses() {
			const userPageClass = this.$page.frontmatter.pageClass;
			return [
				{
					"no-navbar": !this.shouldShowNavbar,
					"sidebar-open": this.isSidebarOpen,
					"no-sidebar": !this.shouldShowSidebar,
				},
				userPageClass,
			];
		},
	},

	methods: {
		toggleSidebar(to) {
			this.isSidebarOpen = typeof to === "boolean" ? to : !this.isSidebarOpen;
			this.$emit("toggle-sidebar", this.isSidebarOpen);
		},

		// side swipe
		onTouchStart(e) {
			this.touchStart = {
				x: e.changedTouches[0].clientX,
				y: e.changedTouches[0].clientY,
			};
		},

		onTouchEnd(e) {
			const dx = e.changedTouches[0].clientX - this.touchStart.x;
			const dy = e.changedTouches[0].clientY - this.touchStart.y;
			if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 40) {
				if (dx > 0 && this.touchStart.x <= 80) {
					this.toggleSidebar(true);
				} else {
					this.toggleSidebar(false);
				}
			}
		},
	},
};
</script>

<style lang="stylus">
.homepage {
	max-width: 1140px;
	margin: 90px auto 40px;
	padding: 40px;
	font-weight: 500;
}

.header {
	position: relative;
	width: 100%;
	min-height: 220px;
	overflow: hidden;
	background-color: var(--primary);
	border-radius: 4px;
}

.header svg {
	position: absolute;
	right: 0;
	bottom: 0;
	z-index: 1;
	opacity: 0.5;
}

.header .text {
	position: absolute;
	top: 40px;
	right: 40px;
	bottom: 40px;
	left: 40px;
	z-index: 2;
	display: flex;
	align-items: center;
	justify-content: flex-start;
	color: var(--background-page);
}

.header .text h1 {
	margin: 0 0 10px;
	line-height: 1;
}

.header .text h3 {
	margin: 0 !important;
	line-height: 1.3;
	border-bottom: none;
}

.panels {
	display: flex;
	flex-wrap: wrap;
	justify-content: space-between;
	margin: 60px auto 40px;
}

.panel {
	width: calc((100% - 60px - (40px * 6) - (2px * 6)) / 3);
	margin-bottom: 30px;
	padding: 30px 40px 40px;
	overflow: hidden;
	border: 2px solid var(--border-subdued);
	border-radius: 4px;
	cursor: pointer;
	transition: border 0.25s ease;
}

.panel:hover {
	border-color: var(--primary);
}

.panel svg {
	display: block;
	margin: 0;
}

.panel svg circle {
	fill: var(--primary);
}

.panel svg path {
	fill: var(--background-page);
}

.panel h2 {
	margin: 24px 0 4px !important;
	color: var(--foreground-normal-alt);
	font-weight: 800;
	line-height: 1.3;
	border-bottom: none;
}

.panel span {
	color: var(--foreground-subdued);
}

.panel u {
	display: block;
	margin-top: 20px;
	font-weight: 600;
	font-size: 14px;
	line-height: 25px;
	text-decoration: none;
}

.listings {
	display: flex;
	flex-wrap: wrap;
	justify-content: space-between;
	margin: 40px auto 0;
}

.listing {
	width: calc((100% - 30px) / 2);
	margin-bottom: 30px;
	font-size: 18px;
	line-height: 25px;
}

@media (max-width: 1000px) {
	.panel {
		width: calc((100% - 60px - (20px * 6) - (2px * 6)) / 3);
		padding: 20px;
	}
}

@media (max-width: 900px) {
	.listing {
		width: 100%;
	}

	.panel {
		width: calc((100% - 30px - (20px * 4) - (2px * 4)) / 2);
		padding: 20px;
	}
}

@media (max-width: 700px) {
	.header .text {
		top: 20px;
		right: 20px;
		bottom: 20px;
		left: 20px;
	}

	.header .text h1 {
		font-size: clamp(30px, 7vw, 42px);
	}

	.panel {
		width: 100%;
	}
}

.header-background-dark {
	display: none;
}

@media (prefers-color-scheme: dark) {
	.header-background-light {
		display: none;
	}

	.header-background-dark {
		display: block;
	}
}

@media (min-width: $MQMobile) {
  .homepage-sidebar {
	  display: none;
  }
}
</style>
