<template>
	<!-- <v-skeleton-loader v-if="loading || templateDataLoading" class="title-loader" type="text" /> -->
	<h1 class="type-title">
		{{ collectionInfo.name }}
	</h1>
	<v-select
		:model-value="firstValue"
		item-text="code"
		item-value="code"
		:filled="true"
		:items="languages"
		@update:modelValue="firstValue = $event"
	>
		<template #prepend>
			<v-icon class="translate" name="translate" lefs />
		</template>
	</v-select>
	<v-button @click="sideBySide = !sideBySide" />
	<v-select
		v-if="sideBySide"
		:model-value="secondValue"
		item-text="code"
		item-value="code"
		:filled="true"
		:items="languages"
		@update:modelValue="secondValue = $event"
	>
		<template #prepend>
			<v-icon class="translate" name="translate" lefs />
		</template>
	</v-select>
	<!-- <v-form /> pass a list of strings to display in fields -->
</template>

<script>
import { defineComponent, ref } from 'vue';
import useCollection from '@/composables/use-collection';

export default defineComponent({
	name: 'ITranslations',
	components: {},
	props: {
		collection: {
			type: String,
			default: 'translations',
		},
		languages: {
			type: Array,
			default: function () {
				return [];
			},
		},
		previewItems: {
			type: Array,
			default: function () {
				return [];
			},
		},
		template: {
			type: String,
			default: 'languages',
		},
	},
	setup(props) {
		let sideBySide = ref(false);
		const { info: collectionInfo } = useCollection(props.collection);
		let firstValue = ref('en-US');
		let secondValue = ref('en-US');

		return {
			collectionInfo,
			sideBySide,
			firstValue,
			secondValue,
		};
	},
});
</script>
<style lang="sass">
$select-selections-padding: 400px
$select-selections-margin: 355px

.flex
	display: flex
	flex-direction: row
</style>
