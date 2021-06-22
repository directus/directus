<template>
	<div class="filter-input">
		<div class="between" v-if="['between', 'nbetween'].includes(operator)">
			<div class="field">
				<component
					:is="interfaceComponent"
					:type="type"
					:value="csvValue[0]"
					:placeholder="t('lower_limit')"
					autofocus
					@input="setCSV(0, $event)"
				/>
			</div>
			<div class="field">
				<component
					:is="interfaceComponent"
					:type="type"
					:value="csvValue[1]"
					:placeholder="t('upper_limit')"
					autofocus
					@input="setCSV(1, $event)"
				/>
			</div>
		</div>
		<div class="list" v-else-if="['in', 'nin'].includes(operator)">
			<div class="field" v-for="(val, index) in csvValue" :key="index">
				<component
					:is="interfaceComponent"
					:type="type"
					:value="val"
					:placeholder="t('enter_a_value')"
					:disabled="disabled"
					autofocus
					@input="setCSV(index, $event)"
				/>
				<small @click="removeCSV(val)" class="remove">
					{{ t('remove') }}
				</small>
			</div>

			<v-button outlined full-width dashed @click="addCSV" :disabled="disabled">
				<v-icon name="add" />
				{{ t('add_new') }}
			</v-button>
		</div>
		<template v-else-if="['empty', 'nempty'].includes(operator) === false">
			<component
				:is="interfaceComponent"
				:type="type"
				:value="internalValue"
				:placeholder="t('enter_a_value')"
				:disabled="disabled"
				autofocus
				@input="internalValue = $event"
			/>
		</template>
	</div>
</template>

<script lang="ts">
import { useI18n } from 'vue-i18n';
import { defineComponent, PropType, computed } from 'vue';
import { FilterOperator } from '@directus/shared/types';
import { types } from '@/types';
import { getDefaultInterfaceForType } from '@/utils/get-default-interface-for-type';

export default defineComponent({
	emits: ['update:modelValue'],
	props: {
		modelValue: {
			type: [String, Number, Boolean],
			required: true,
		},
		type: {
			type: String as PropType<typeof types[number]>,
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

		const interfaceComponent = computed(() => `interface-${getDefaultInterfaceForType(props.type)}`);

		return { t, internalValue, csvValue, setCSV, removeCSV, addCSV, interfaceComponent };

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

.list .field {
	margin-bottom: 12px;
}

.list .field .remove {
	display: flex;
	align-items: center;
	float: right;
	width: max-content;
	margin-bottom: 12px;
	color: var(--foreground-subdued);
	cursor: pointer;
}

.list .field .remove:hover {
	color: var(--danger);
}

.between .field:first-child {
	margin-bottom: 12px;
}
</style>
