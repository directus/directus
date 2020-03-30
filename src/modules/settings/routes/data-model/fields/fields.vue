<template>
	<private-view :title="collectionInfo.name">
		<template #navigation>
			<settings-navigation />
		</template>

		<div class="fields">
			<h2 class="title">{{ $t('fields_and_layout') }}</h2>
			<fields-management :collection="collection" />
		</div>
	</private-view>
</template>

<script lang="ts">
import { defineComponent } from '@vue/composition-api';
import SettingsNavigation from '../../../components/navigation/';
import useCollection from '@/compositions/use-collection/';
import FieldsManagement from './components/fields-management';

export default defineComponent({
	components: { SettingsNavigation, FieldsManagement },
	props: {
		collection: {
			type: String,
			required: true,
		},
	},
	setup(props) {
		const { info: collectionInfo, fields } = useCollection(props.collection);

		return { collectionInfo, fields };
	},
});
</script>

<style lang="scss" scoped>
@import '@/styles/mixins/type-styles';

.title {
	margin-bottom: 12px;
	@include type-heading-small;
}

.fields {
	max-width: 800px;
	padding: var(--private-view-content-padding);
}
</style>
