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
			<docs-navigation :path="route.path" />
		</template>

		<div class="docs-content selectable">
			<markdown>{{ markdownWithoutTitle }}</markdown>
		</div>

		<template #sidebar>
			<sidebar-detail icon="info_outline" :title="t('information')" close>
				<div class="page-description" v-html="md(t('page_help_docs_global'))" />
			</sidebar-detail>
		</template>
	</private-view>
</template>

<script lang="ts">
import { useI18n } from 'vue-i18n';
import { defineComponent, defineAsyncComponent, ref, computed, watch } from 'vue';
import { useRoute, RouteLocation } from 'vue-router';
import DocsNavigation from '../components/navigation.vue';
import { md } from '@/utils/md';

const Markdown = defineAsyncComponent(() => import('../components/markdown.vue'));

async function getMarkdownForRoute(route: RouteLocation): Promise<string> {
	const importDocs = route.meta.import as () => Promise<{ default: string }>;

	const mdModule = await importDocs();
	return mdModule.default;
}

export default defineComponent({
	name: 'StaticDocs',
	components: { DocsNavigation, Markdown },
	setup() {
		const { t } = useI18n();

		const route = useRoute();

		const markdown = ref('');
		const title = computed(() => {
			const lines = markdown.value.split('\n');

			for (let i = 0; i < lines.length; i++) {
				if (lines[i].startsWith('# ')) {
					return lines[i].substring(2).trim();
				}
			}

			return null;
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

		watch(
			() => route.path,
			async () => {
				markdown.value = await getMarkdownForRoute(route);
			},
			{ immediate: true, flush: 'post' }
		);

		return { t, route, markdown, title, markdownWithoutTitle, md };
	},
});
</script>

<style lang="scss" scoped>
.docs-content {
	padding: 0 var(--content-padding) var(--content-padding-bottom);
}
</style>
