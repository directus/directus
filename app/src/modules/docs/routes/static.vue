<template>
	<private-view :title="title">
		<template #title-outer:prepend>
			<v-button rounded disabled icon>
				<v-icon name="info" />
			</v-button>
		</template>

		<template #title>
			<h1 class="type-title">{{ title }}</h1>
			<v-chip v-if="modularExtension" disabled small>Modular Extension</v-chip>
		</template>

		<template #navigation>
			<docs-navigation :path="route.path" />
		</template>

		<div class="docs-content selectable">
			<markdown>{{ markdownWithoutTitle }}</markdown>
		</div>

		<template #sidebar>
			<sidebar-detail icon="info_outline" :title="t('information')" close>
				<div v-md="t('page_help_docs_global')" class="page-description" />
			</sidebar-detail>
		</template>
	</private-view>
</template>

<script lang="ts">
import { useI18n } from 'vue-i18n';
import { defineComponent, defineAsyncComponent, ref, computed, watch } from 'vue';
import { useRoute, RouteLocation } from 'vue-router';
import DocsNavigation from '../components/navigation.vue';

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
			const line = lines.find((line) => line.startsWith('# '));

			if (line === undefined) return null;

			return line.substring(2).replaceAll('<small></small>', '').trim();
		});

		const modularExtension = computed(() => {
			const lines = markdown.value.split('\n');
			const line = lines.find((line) => line.startsWith('# '));
			return line?.includes('<small></small>') || false;
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

		return { t, route, markdown, title, markdownWithoutTitle, modularExtension };
	},
});
</script>

<style lang="scss" scoped>
.docs-content {
	padding: 0 var(--content-padding) var(--content-padding-bottom);
}

.v-chip {
	--v-chip-background-color: var(--v-chip-background-color-hover);
	--v-chip-color: var(--v-chip-color-hover);

	margin-left: 12px;
	cursor: default !important;
}
</style>
