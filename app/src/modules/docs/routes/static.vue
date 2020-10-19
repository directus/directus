<template>
	<private-view :title="title" ref="view">
		<template #headline>Documentation</template>

		<template #title-outer:prepend>
			<v-button rounded disabled icon>
				<v-icon name="info" />
			</v-button>
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
import { defineComponent, ref, computed, inject, onUpdated } from '@vue/composition-api';
import DocsNavigation from '../components/navigation.vue';
import Markdown from '../components/markdown.vue';
import marked from 'marked';

async function getMarkdownForPath(path: string) {
	const pathParts = path.split('/');

	while (pathParts.includes('docs')) {
		pathParts.shift();
	}

	let docsPath = pathParts.join('/');

	// Home
	if (!docsPath) {
		docsPath = 'readme';
	}

	const mdModule = await import('raw-loader!@directus/docs/' + docsPath + '.md');

	return mdModule.default;
}

export default defineComponent({
	name: 'StaticDocs',
	components: { DocsNavigation, Markdown },
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
		const view = ref<Vue>();

		const title = computed(() => {
			const firstLine = markdown.value.split('\n').shift();
			return firstLine?.substring(2).trim();
		});

		const markdownWithoutTitle = computed(() => {
			const lines = markdown.value.split('\n');
			lines.shift();
			return lines.join('\n');
		});

		onUpdated(() => {
			view.value?.$data.contentEl?.scrollTo({ top: 0 });
		});

		return { markdown, title, markdownWithoutTitle, view, marked, path };
	},
});
</script>

<style lang="scss" scoped>
.docs-content {
	max-width: 740px;
	padding: 0 var(--content-padding) var(--content-padding-bottom);
}
</style>
