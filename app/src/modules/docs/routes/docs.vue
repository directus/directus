<template>
	<private-view :title="notFound ? $t('page_not_found') : title">
		<template #headline>{{ $t('documentation') }}</template>

		<template #title-outer:prepend>
			<v-button rounded disabled icon>
				<v-icon :name="isAPIReference ? 'code' : section.icon || section.sectionIcon" />
			</v-button>
		</template>

		<template #navigation>
			<docs-navigation :section="section" />
		</template>

		<div v-if="notFound" class="not-found">
			<v-info :title="$t('page_not_found')" icon="not_interested">
				{{ $t('page_not_found_body') }}
			</v-info>
		</div>

		<markdown v-else>{{ mdString }}</markdown>
	</private-view>
</template>

<script lang="ts">
import { defineComponent, ref, computed, watch, PropType } from '@vue/composition-api';
import DocsNavigation from '../components/navigation.vue';
import { Section } from '../components/sections';
import Markdown from './markdown.vue';
import i18n from '@/lang';

declare module '*.md';

export default defineComponent({
	components: { DocsNavigation, Markdown },
	props: {
		section: {
			type: Object as PropType<Section>,
			default: null,
		},
	},
	setup(props) {
		const mdString = ref<string | null>(null);
		const loading = ref(true);
		const error = ref(null);

		const isAPIReference = computed(() => props.section && props.section.to.startsWith('/docs/api-reference'));
		const notFound = computed(() => {
			return props.section === null || error.value !== null;
		});

		const title = computed(() => {
			return isAPIReference.value ? i18n.t('api_reference') : props.section.sectionName;
		});

		watch(() => props.section, loadMD, { immediate: true });

		return { isAPIReference, notFound, title, mdString };

		async function loadMD() {
			loading.value = true;
			error.value = null;

			if (props.section === null) {
				mdString.value = null;
				return;
			}

			const loadString = props.section.to.replace('/docs', '');

			try {
				const md = await import(`raw-loader!@directus/docs${loadString}.md`);
				mdString.value = md.default;
			} catch (err) {
				mdString.value = null;
				error.value = err;
			} finally {
				loading.value = false;
			}
		}
	},
});
</script>
<style lang="scss" scoped>
.v-info {
	padding: 20vh 0;
}

.not-found {
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 20vh 0;
}
</style>
