<template>
	<private-view :title="collectionInfo.name">
		<template #title-outer:prepend>
			<v-button class="header-icon" rounded disabled icon secondary>
				<v-icon name="list_alt" />
			</v-button>
		</template>

		<template #headline>
			<v-breadcrumb :items="breadcrumb" />
		</template>

		<template #navigation>
			<settings-navigation />
		</template>

		<div class="fields">
			<h2 class="title type-label">{{ $t('fields_and_layout') }}</h2>
			<fields-management :collection="collection" />
		</div>
	</private-view>
</template>

<script lang="ts">
import { defineComponent, computed, toRefs } from '@vue/composition-api';
import SettingsNavigation from '../../../components/navigation/';
import useCollection from '@/compositions/use-collection/';
import FieldsManagement from './components/fields-management';
import useProjectsStore from '@/stores/projects';
import { i18n } from '@/lang';

export default defineComponent({
	components: { SettingsNavigation, FieldsManagement },
	props: {
		collection: {
			type: String,
			required: true,
		},
	},
	setup(props) {
		const projectsStore = useProjectsStore();
		const { collection } = toRefs(props);
		const { info: collectionInfo, fields } = useCollection(collection);

		const breadcrumb = computed(() => {
			return [
				{
					name: i18n.t('settings_data_model'),
					to: `/${projectsStore.state.currentProjectKey}/settings/data-model`,
				},
			];
		});

		return { collectionInfo, fields, breadcrumb };
	},
});
</script>

<style lang="scss" scoped>
.title {
	margin-bottom: 12px;
}

.fields {
	max-width: 800px;
	padding: var(--content-padding);
}

.header-icon {
	--v-button-color-disabled: var(--warning);
	--v-button-background-color-disabled: var(--warning-alt);
}
</style>
