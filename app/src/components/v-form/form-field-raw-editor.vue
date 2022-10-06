<template>
	<v-dialog :model-value="showModal" persistent @esc="$emit('cancel')">
		<v-card>
			<v-card-title>{{ disabled ? t('view_raw_value') : t('edit_raw_value') }}</v-card-title>
			<v-card-text>
				<interface-input-code
					:value="internalValue"
					:disabled="disabled"
					class="raw-value"
					:placeholder="t('enter_raw_value')"
					:language="type === 'object' ? 'json' : 'plaintext'"
					@input="internalValue = $event"
				/>
			</v-card-text>
			<v-card-actions>
				<v-button @click="submit">{{ t('done') }}</v-button>
			</v-card-actions>
		</v-card>
	</v-dialog>
</template>

<script setup lang="ts">
import { getJSType } from '@/utils/get-js-type';
import { Field } from '@directus/shared/types';
import { isNil } from 'lodash';
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

interface Props {
	field: Field;
	showModal: boolean;
	disabled: boolean;
	currentValue: unknown;
}

const props = withDefaults(defineProps<Props>(), {
	showModal: false,
	disabled: false,
	currentValue: undefined,
});

const emit = defineEmits(['cancel', 'submit']);

const { t } = useI18n();
const internalValue = ref();

const type = computed(() => {
	return getJSType(props.field);
});

watch(
	() => props.showModal,
	(isActive) => {
		if (isActive) {
			if (isNil(props.currentValue)) {
				return;
			}

			if (type.value === 'object') {
				internalValue.value = JSON.stringify(props.currentValue, null, '\t');
			} else {
				internalValue.value = String(props.currentValue);
			}
		}
	}
);

const submit = () => {
	switch (type.value) {
		case 'string':
			emit('submit', internalValue.value);
			break;
		case 'number':
			emit('submit', Number(internalValue.value));
			break;
		case 'boolean':
			emit('submit', internalValue.value === 'true');
			break;
		case 'object':
			emit('submit', JSON.parse(internalValue.value));
			break;
		default:
			emit('submit', internalValue.value);
			break;
	}
};
</script>
