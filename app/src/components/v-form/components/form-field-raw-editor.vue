<script setup lang="ts">
import VButton from '@/components/v-button.vue';
import VCardActions from '@/components/v-card-actions.vue';
import VCardText from '@/components/v-card-text.vue';
import VCardTitle from '@/components/v-card-title.vue';
import VCard from '@/components/v-card.vue';
import VDialog from '@/components/v-dialog.vue';
import InterfaceSystemRawEditor from '@/interfaces/_system/system-raw-editor/system-raw-editor.vue';
import InterfaceInputCode from '@/interfaces/input-code/input-code.vue';
import { getJSType } from '@/utils/get-js-type';
import { getStringifiedValue } from '@/utils/get-stringified-value';
import type { Field } from '@directus/types';
import { isValidJSON, parseJSON } from '@directus/utils';
import { isNil } from 'lodash';
import { computed, ref, watch } from 'vue';
import type { FormField } from '../types';

const props = withDefaults(
	defineProps<{
		field: FormField;
		showModal?: boolean;
		disabled?: boolean;
		currentValue?: unknown;
	}>(),
	{
		showModal: false,
		disabled: false,
		currentValue: undefined,
	},
);

const emit = defineEmits(['cancel', 'setRawValue']);
const internalValue = ref();

const type = computed(() => {
	return getJSType(props.field as Field);
});

watch(
	() => props.showModal,
	(isActive) => {
		if (isActive) {
			if (isNil(props.currentValue)) {
				return;
			}

			internalValue.value = getStringifiedValue(props.currentValue, type.value === 'object');
		}
	},
);

const setRawValue = () => {
	switch (type.value) {
		case 'string':
			emit('setRawValue', internalValue.value);
			break;
		case 'number':
			emit('setRawValue', Number(internalValue.value));
			break;
		case 'boolean':
			emit('setRawValue', internalValue.value === 'true');
			break;
		case 'object':
			emit('setRawValue', isValidJSON(internalValue.value) ? parseJSON(internalValue.value) : internalValue.value);
			break;
		default:
			emit('setRawValue', internalValue.value);
			break;
	}
};
</script>

<template>
	<VDialog :model-value="showModal" persistent @esc="$emit('cancel')" @apply="setRawValue">
		<VCard>
			<VCardTitle>{{ disabled ? $t('view_raw_value') : $t('edit_raw_value') }}</VCardTitle>
			<VCardText>
				<InterfaceInputCode
					v-if="type === 'object'"
					:value="internalValue"
					:disabled="disabled"
					:line-number="false"
					:alt-options="{ gutters: false }"
					:placeholder="$t('enter_raw_value')"
					language="json"
					@input="internalValue = $event"
				/>
				<InterfaceSystemRawEditor
					v-else
					:value="internalValue"
					:type="type === 'string' ? 'text' : type"
					:disabled="disabled"
					language="plaintext"
					:placeholder="$t('enter_raw_value')"
					@input="internalValue = $event"
				/>
			</VCardText>
			<VCardActions>
				<VButton secondary @click="$emit('cancel')">{{ $t('cancel') }}</VButton>
				<VButton @click.prevent="setRawValue">{{ $t('done') }}</VButton>
			</VCardActions>
		</VCard>
	</VDialog>
</template>

<style lang="scss" scoped>
.v-card-text {
	.input-code {
		:deep(.CodeMirror),
		:deep(.CodeMirror-scroll) {
			max-block-size: var(--input-height-xlarge);
		}
	}
}
</style>
