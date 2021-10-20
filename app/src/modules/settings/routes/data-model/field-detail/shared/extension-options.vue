<template>
	<v-notice v-if="!extensionInfo.options || optionsFields.length === 0">
		{{ t('no_options_available') }}
	</v-notice>

	<v-form
		class="extension-options"
		v-else-if="usesCustomComponent === false"
		v-model="options"
		:fields="optionsFields"
		primary-key="+"
	/>

	<component
		:is="`interface-options-${extensionInfo.id}`"
		v-else
		:value="options"
		:collection="collection"
		:field-data="field"
		:relations="relations"
		:new-fields="fields"
		:new-collections="collections"
		@input="options = $event"
	/>
</template>

<script lang="ts">
import { defineComponent, PropType, computed } from 'vue';
import { getInterfaces } from '@/interfaces';
import { getDisplays } from '@/displays';
import { useFieldDetailStore } from '../store';
import { get, set } from 'lodash';
import { storeToRefs } from 'pinia';
import { useI18n } from 'vue-i18n';

export default defineComponent({
	props: {
		type: {
			type: String as PropType<'interface' | 'display'>,
			required: true,
		},
		extension: {
			type: String,
			required: true,
		},
	},
	setup(props) {
		const fieldDetail = useFieldDetailStore();

		const { t } = useI18n();

		const { collection, field, relations, fields, collections } = storeToRefs(fieldDetail);

		const { interfaces } = getInterfaces();
		const { displays } = getDisplays();

		const extensionInfo = computed(() => {
			if (props.type === 'interface') {
				return interfaces.value.find((inter) => inter.id === props.extension);
			}

			if (props.type === 'display') {
				return displays.value.find((display) => display.id === props.extension);
			}

			return null;
		});

		const usesCustomComponent = computed(() => {
			if (!extensionInfo.value) return false;

			return extensionInfo.value.options && 'render' in extensionInfo.value.options;
		});

		const optionsFields = computed(() => {
			if (!extensionInfo.value) return [];
			if (!extensionInfo.value.options) return [];
			if (usesCustomComponent.value === true) return [];

			if (typeof extensionInfo.value.options === 'function') {
				return (extensionInfo.value.options as Function)(fieldDetail);
			}

			return extensionInfo.value.options;
		});

		const options = computed({
			get() {
				const path = props.type === 'interface' ? 'field.meta.options' : 'field.meta.display_options';
				return get(fieldDetail, path);
			},
			set(val: any) {
				const path = props.type === 'interface' ? 'field.meta.options' : 'field.meta.display_options';
				fieldDetail.update(set({}, path, val));
			},
		});

		return {
			usesCustomComponent,
			extensionInfo,
			optionsFields,
			options,
			collection,
			field,
			relations,
			fields,
			collections,
			t,
		};
	},
});
</script>

<style lang="scss" scoped>
.extension-options {
	--form-vertical-gap: 20px;
}
</style>
