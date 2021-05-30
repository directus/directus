<template>
	<div class="filter-input">
		<template v-if="['between', 'nbetween'].includes(operator)">
			<v-input
				:type="type"
				:model-value="csvValue[0]"
				@update:model-value="setCSV(0, $event)"
				:disabled="disabled"
				:placeholder="t('lower_limit')"
				autofocus
			>
				<template #append>
					<v-icon name="vertical_align_top" />
				</template>
			</v-input>
			<v-input
				:type="type"
				:model-value="csvValue[1]"
				@update:model-value="setCSV(1, $event)"
				:disabled="disabled"
				:placeholder="t('upper_limit')"
			>
				<template #append>
					<v-icon name="vertical_align_bottom" />
				</template>
			</v-input>
		</template>
		<template v-else-if="['in', 'nin'].includes(operator)">
			<v-input
				v-for="(val, index) in csvValue"
				:key="index"
				:model-value="val"
				:type="type"
				@update:model-value="setCSV(index, $event)"
				:disabled="disabled"
				:placeholder="t('enter_a_value')"
				autofocus
			>
				<template v-if="csvValue.length > 1" #append>
					<v-icon name="close" @click="removeCSV(val)" />
				</template>
			</v-input>
			<v-button outlined full-width dashed @click="addCSV" :disabled="disabled">
				<v-icon name="add" />
				{{ t('add_new') }}
			</v-button>
		</template>
		<template v-else-if="['empty', 'nempty'].includes(operator) === false">
			<v-checkbox block :label="t('active')" v-if="type === 'checkbox'" v-model="internalValue" :disabled="disabled" />
			<v-input
				:disabled="disabled"
				v-else
				autofocus
				v-model="internalValue"
				:nullable="false"
				:type="type"
				:placeholder="t('enter_a_value')"
			/>
		</template>
	</div>
</template>

<script lang="ts">
import { useI18n } from 'vue-i18n';
import { defineComponent, PropType, computed } from 'vue';
import { FilterOperator } from '@/types';

export default defineComponent({
	emits: ['update:modelValue'],
	props: {
		modelValue: {
			type: [String, Number, Boolean],
			required: true,
		},
		type: {
			type: String as PropType<'text' | 'checkbox' | 'number' | 'datetime' | 'unknown'>,
			required: true,
		},
		operator: {
			type: String as PropType<FilterOperator>,
			required: true,
		},
		disabled: {
			type: Boolean,
			default: false,
		},
	},
	setup(props, { emit }) {
		const { t } = useI18n();

		const internalValue = computed<string | string[] | boolean | number>({
			get() {
				return props.modelValue;
			},
			set(newValue) {
				emit('update:modelValue', newValue);
			},
		});

		const csvValue = computed({
			get() {
				return typeof props.modelValue === 'string' ? props.modelValue.split(',') : [];
			},
			set(newVal: string[]) {
				internalValue.value = newVal.join(',');
			},
		});

		return { t, internalValue, csvValue, setCSV, removeCSV, addCSV };

		function setCSV(index: number, value: string) {
			const newValue = Object.assign([], csvValue.value, { [index]: value });
			csvValue.value = newValue;
		}

		function removeCSV(val: string) {
			csvValue.value = csvValue.value.filter((value) => value !== val);
		}

		function addCSV() {
			csvValue.value = [...csvValue.value, ''];
		}
	},
});
</script>

<style lang="scss" scoped>
.v-input + .v-input,
.v-input + .v-button {
	margin-top: 8px;
}

.v-input .v-icon {
	--v-icon-color: var(--foreground-subdued);
}
</style>
