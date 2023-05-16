<template>
	<v-notice v-if="usesCustomComponent === false && optionsFields.length === 0">
		{{ t('no_options_available') }}
	</v-notice>

	<v-form
		v-else-if="usesCustomComponent === false"
		v-model="optionsValues"
		class="extension-options"
		:fields="optionsFields"
		:initial-values="disabled ? optionsValues : null"
		:disabled="disabled"
		:raw-editor-enabled="rawEditorEnabled"
		primary-key="+"
	/>

	<v-error-boundary v-else :name="`${type}-options-${extensionInfo!.id}`">
		<component
			:is="`${type}-options-${extensionInfo!.id}`"
			:value="optionsValues"
			:collection="collection"
			:field="field"
			@input="optionsValues = $event"
		/>
		<template #fallback>
			<v-notice type="warning">{{ t('unexpected_error') }}</v-notice>
		</template>
	</v-error-boundary>
</template>

<script setup lang="ts">
import { useExtension } from '@/composables/use-extension';
import { isVueComponent } from '@directus/utils';
import { storeToRefs } from 'pinia';
import { computed, toRefs } from 'vue';
import { useI18n } from 'vue-i18n';
import { useFieldDetailStore } from '../store';

const props = withDefaults(
	defineProps<{
		type: 'interface' | 'display' | 'panel' | 'operation';
		extension?: string;
		showAdvanced?: boolean;
		options?: Record<string, any>;
		modelValue?: Record<string, any>;
		disabled?: boolean;
		rawEditorEnabled?: boolean;
	}>(),
	{
		modelValue: () => ({}),
	}
);

const emit = defineEmits(['update:modelValue']);

const { t } = useI18n();

const fieldDetailStore = useFieldDetailStore();

const { collection, field } = storeToRefs(fieldDetailStore);
const { extension, type } = toRefs(props);

const extensionInfo = useExtension(type, extension);

const usesCustomComponent = computed(() => {
	if (!extensionInfo.value) return false;

	return isVueComponent(extensionInfo.value.options);
});

const optionsFields = computed(() => {
	if (usesCustomComponent.value === true) return [];

	let optionsObjectOrArray;

	if (props.options) {
		optionsObjectOrArray = props.options;
	} else {
		if (!extensionInfo.value) return [];
		if (!extensionInfo.value?.options) return [];
		optionsObjectOrArray = extensionInfo.value.options;
	}

	if (!optionsObjectOrArray) return [];

	if (Array.isArray(optionsObjectOrArray)) return optionsObjectOrArray;

	if (props.showAdvanced) {
		return [...optionsObjectOrArray.standard, ...optionsObjectOrArray.advanced];
	}

	return optionsObjectOrArray.standard;
});

const optionsValues = computed({
	get() {
		return props.modelValue;
	},
	set(values: Record<string, any>) {
		emit('update:modelValue', values);
	},
});
</script>
