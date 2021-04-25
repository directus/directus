<template>
	<private-view :title="title">
		<template #title-outer:prepend>
			<v-button rounded disabled icon>
				<v-icon name="info" />
			</v-button>
		</template>

		<template #title>
			<h1 v-html="title" class="type-title"></h1>
		</template>

		<template #navigation>
			<docs-navigation :path="path" />
		</template>

		<div class="docs-content selectable">
			<markdown>{{ markdownWithoutTitle }}</markdown>
		</div>

		<template #sidebar>
			<sidebar-detail icon="info_outline" :title="$t('information')" close>
				<div class="page-description" v-html="marked($t('page_help_docs_global'))" />
			</sidebar-detail>
		</template>
	</private-view>
</template>

<script lang="ts">
import { AsyncComponent } from 'vue';
import { defineComponent, ref, computed } from '@vue/composition-api';
import DocsNavigation from '../components/navigation.vue';
import marked from 'marked';

const Markdown = () => import(/* webpackChunkName: 'markdown', webpackPrefetch: true */ '../components/markdown.vue');

async function getMarkdownForPath(path: string) {
	const pathParts = path.split('/');

	while (pathParts.includes('docs')) {
		pathParts.shift();
	}

	let docsPath = pathParts.join('/');

	if (docsPath.endsWith('/')) {
		docsPath = docsPath.slice(0, -1);
	}

	const mdModule = await import('raw-loader!@directus/docs/' + docsPath + '.md');

	return mdModule.default;
}

export default defineComponent({
	name: 'StaticDocs',
	components: { DocsNavigation, Markdown: Markdown as AsyncComponent },
	async beforeRouteEnter(to, from, next) {
		const md = await getMarkdownForPath(to.path);

		next((vm: any) => {
			vm.markdown = md;
			vm.path = to.path;
		});
	},
	async beforeRouteUpdate(to, from, next) {
		this.markdown = await getMarkdownForPath(to.path);
		this.path = to.path;

		next();
	},
	setup() {
		const path = ref<string | null>(null);
		const markdown = ref('');
		const title = computed(() => {
			const lines = markdown.value.split('\n');

			for (let i = 0; i < lines.length; i++) {
				if (lines[i].startsWith('# ')) {
					return lines[i].substring(2).trim();
				}
			}
		});

		const markdownWithoutTitle = computed(() => {
			const lines = markdown.value.split('\n');

			for (let i = 0; i < lines.length; i++) {
				if (lines[i].startsWith('# ')) {
					lines.splice(i, 1);
					break;
				}
			}

			return lines.join('\n');
		});

		return { markdown, title, markdownWithoutTitle, marked, path };
	},
});
</script>

<style lang="scss" scoped>
.docs-content {
	padding: 0 var(--content-padding) var(--content-padding-bottom);
}
</style>
