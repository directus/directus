<template>
	<private-view title="Updated: Item Display Template">
		<template #title-outer:prepend>
			<v-button class="header-icon" rounded icon secondary exact :to="breadcrumb[0].to">
				<v-icon name="arrow_back" />
			</v-button>
		</template>

		<template #headline>
			<v-breadcrumb :items="breadcrumb" />
		</template>

		<template #navigation>
			<activity-navigation />
		</template>

		<v-form collection="directus_activity" :loading="loading" :initial-values="item" :primary-key="primaryKey" />

		<template #drawer>
			<drawer-detail icon="info_outline" :title="$t('information')" close>
				<div class="format-markdown" v-html="marked($t('page_help_activity_detail'))" />
			</drawer-detail>
			<drawer-detail icon="help_outline" :title="$t('help_and_docs')">
				<div class="format-markdown" v-html="marked($t('page_help_collections_overview'))" />
			</drawer-detail>
		</template>
	</private-view>
</template>

<script lang="ts">
import { defineComponent, computed, toRefs, ref } from '@vue/composition-api';
import useProjectsStore from '@/stores/projects';
import ActivityNavigation from '../../components/navigation/';
import { i18n } from '@/lang';
import useItem from '@/composables/use-item';
import SaveOptions from '@/views/private/components/save-options';
import marked from 'marked';

type Values = {
	[field: string]: any;
};

export default defineComponent({
	name: 'activity-detail',
	components: { ActivityNavigation, SaveOptions },
	props: {
		primaryKey: {
			type: String,
			required: true,
		},
	},
	setup(props) {
		const projectsStore = useProjectsStore();
		const { currentProjectKey } = toRefs(projectsStore.state);
		const { primaryKey } = toRefs(props);
		const { breadcrumb } = useBreadcrumb();

		const { item, loading, error } = useItem(ref('directus_activity'), primaryKey);

		return {
			item,
			loading,
			error,
			breadcrumb,
			marked,
		};

		function useBreadcrumb() {
			const breadcrumb = computed(() => [
				{
					name: i18n.t('activity_log'),
					to: `/${currentProjectKey.value}/activity/`,
				},
			]);

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

.header-icon.secondary {
	--v-button-background-color: var(--background-normal);
	--v-button-color-disabled: var(--foreground-normal);
	--v-button-color-activated: var(--foreground-normal);
}

.v-form {
	padding: var(--content-padding);
}
</style>
