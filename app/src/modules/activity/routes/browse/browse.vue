<template>
	<private-view :title="$t('activity_log')">
		<template #title-outer:prepend>
			<v-button class="header-icon" rounded icon secondary disabled>
				<v-icon name="notifications" />
			</v-button>
		</template>

		<div class="content">
			<v-notice>
				Pre-Release: Feature not yet available
			</v-notice>
		</div>

		<template #drawer>
			<drawer-detail icon="info_outline" :title="$t('information')" close>
				<div class="format-markdown" v-html="marked($t('page_help_activity_browse'))" />
			</drawer-detail>
			<portal-target name="drawer" />
			<drawer-detail icon="help_outline" :title="$t('help_and_docs')">
				<div class="format-markdown" v-html="marked($t('page_help_collections_overview'))" />
			</drawer-detail>
		</template>
	</private-view>
</template>

<script lang="ts">
import { defineComponent, computed, ref } from '@vue/composition-api';
import ActivityNavigation from '../../components/navigation/';
import { i18n } from '@/lang';
import { LayoutComponent } from '@/layouts/types';
import usePreset from '@/composables/use-collection-preset';
import marked from 'marked';

type Item = {
	[field: string]: any;
};

export default defineComponent({
	name: 'activity-browse',
	components: { ActivityNavigation },
	props: {},
	setup() {
		const layout = ref<LayoutComponent | null>(null);

		const { viewOptions, viewQuery } = usePreset(ref('directus_activity'));
		const { breadcrumb } = useBreadcrumb();

		return {
			breadcrumb,
			layout,
			viewOptions,
			viewQuery,
			marked,
		};

		function useBreadcrumb() {
			const breadcrumb = computed(() => {
				return [
					{
						name: i18n.tc('collection', 2),
						to: `/collections`,
					},
				];
			});

			return { breadcrumb };
		}
	},
});
</script>

<style lang="scss" scoped>
.content {
	padding: var(--content-padding);
}
</style>
