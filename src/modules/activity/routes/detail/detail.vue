<template>
	<private-view :title="$t('editing', { collection: $t('activity') })">
		<template #title-outer:prepend>
			<v-button rounded icon secondary exact :to="breadcrumb[0].to">
				<v-icon name="arrow_back" />
			</v-button>
		</template>

		<template #headline>
			<v-breadcrumb :items="breadcrumb" />
		</template>

		<template #navigation>
			<activity-navigation />
		</template>

		<v-form collection="directus_activity" :loading="loading" :initial-values="item" />
	</private-view>
</template>

<script lang="ts">
import { defineComponent, computed, toRefs, ref } from '@vue/composition-api';
import useProjectsStore from '@/stores/projects';
import ActivityNavigation from '../../components/navigation/';
import { i18n } from '@/lang';
import useItem from '@/compositions/use-item';
import SaveOptions from '@/views/private/components/save-options';

type Values = {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
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
		};

		function useBreadcrumb() {
			const breadcrumb = computed(() => [
				{
					name: i18n.t('activity'),
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

.v-form {
	padding: var(--content-padding);
}
</style>
