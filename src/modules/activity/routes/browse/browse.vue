<template>
	<private-view :title="$t('activity')">
		<template #title-outer:prepend>
			<v-button rounded disabled icon secondary>
				<v-icon name="notifications" />
			</v-button>
		</template>

		<template #drawer><portal-target name="drawer" /></template>

		<template #navigation>
			<activity-navigation />
		</template>

		<layout-tabular
			class="layout"
			ref="layout"
			collection="directus_activity"
			:view-options.sync="viewOptions"
			:view-query.sync="viewQuery"
			:detail-route="'/{{project}}/activity/{{primaryKey}}'"
		/>
	</private-view>
</template>

<script lang="ts">
import { defineComponent, computed, ref } from '@vue/composition-api';
import ActivityNavigation from '../../components/navigation/';
import useProjectsStore from '@/stores/projects';
import { i18n } from '@/lang';
import { LayoutComponent } from '@/layouts/types';
import useCollectionPreset from '@/composables/use-collection-preset';

type Item = {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	[field: string]: any;
};

export default defineComponent({
	name: 'activity-browse',
	components: { ActivityNavigation },
	props: {},
	setup() {
		const layout = ref<LayoutComponent>(null);
		const projectsStore = useProjectsStore();

		const { viewOptions, viewQuery } = useCollectionPreset(ref('directus_activity'));
		const { breadcrumb } = useBreadcrumb();

		return {
			breadcrumb,
			layout,
			viewOptions,
			viewQuery,
		};

		function useBreadcrumb() {
			const breadcrumb = computed(() => {
				const currentProjectKey = projectsStore.state.currentProjectKey;

				return [
					{
						name: i18n.tc('collection', 2),
						to: `/${currentProjectKey}/collections`,
					},
				];
			});

			return { breadcrumb };
		}
	},
});
</script>

<style lang="scss" scoped>
.action-delete {
	--v-button-background-color: var(--danger);
	--v-button-background-color-hover: var(--danger-dark);
}

.action-batch {
	--v-button-background-color: var(--warning);
	--v-button-background-color-hover: var(--warning-150);
}

.layout {
	--layout-offset-top: 64px;
}
</style>
