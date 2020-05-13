<template>
	<private-view :title="$t('activity_log')">
		<template #title-outer:prepend>
			<v-button class="header-icon" rounded icon secondary disabled>
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

.header-icon.secondary {
	--v-button-background-color: var(--background-normal);
	--v-button-color-disabled: var(--foreground-normal);
	--v-button-color-activated: var(--foreground-normal);
}

.layout {
	--layout-offset-top: 64px;
}
</style>
