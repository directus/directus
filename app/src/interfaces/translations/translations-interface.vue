<template>
	<div class="primary">
		<v-select
			:model-value="firstValue"
			item-text="code"
			item-value="code"
			:filled="true"
			:items="languages"
			@update:modelValue="firstValue = $event"
		>
			<template #prepend>
				<v-icon class="translate" name="translate" />
			</template>
			<template #append>
				<v-icon v-tooltip="t(multilang)" :name="sideBySide ? 'remove' : 'add'" @click="sideBySide = !sideBySide" />
			</template>
		</v-select>
		<v-form :fields="fields" :color="'primary'" :badge="firstValue" />
	</div>
	<div v-if="sideBySide" class="secondary">
		<v-select
			:model-value="secondValue"
			item-text="code"
			item-value="code"
			:filled="true"
			:items="languages"
			@update:modelValue="secondValue = $event"
		>
			<template #prepend>
				<v-icon class="translate" name="translate" />
			</template>
		</v-select>
		<v-form :fields="fields" :badge="secondValue" />
	</div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import useCollection from '@/composables/use-collection';
import { useFieldsStore } from '@/stores/';
import { useI18n } from 'vue-i18n';

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
		const fieldsStore = useFieldsStore();
		let fields = fieldsStore.getFieldsForCollection(props.collection);
		const multilang = 'Multi-language Editing Mode';
		const { t } = useI18n();
		return {
			collectionInfo,
			sideBySide,
			firstValue,
			secondValue,
			fields,
			multilang,
			t,
		};
	},
});
</script>
<style lang="scss" scoped>
.primary :deep(.v-chip) {
	color: var(--primary);
	background-color: var(--primary-alt);
	border: 0px;
}

.secondary :deep(.v-chip) {
	color: var(--blue);
	background-color: var(--blue-alt);
	border: 0px;
}
</style>
