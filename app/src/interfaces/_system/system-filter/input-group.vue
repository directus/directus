<template>
	<template
		v-if="
			[
				'_eq',
				'_neq',
				'_lt',
				'_gt',
				'_lte',
				'_gte',
				'_contains',
				'_ncontains',
				'_starts_with',
				'_nstarts_with',
				'_ends_with',
				'_nends_with',
			].includes(field.comparator)
		"
	>
		<input-component
			:is="interfaceType"
			:type="fieldInfo.type"
			:value="value"
			@input="value = $event"
		></input-component>
	</template>
	<div
		v-else-if="['_in', '_nin'].includes(field.comparator)"
		class="list"
		:class="{ moveComma: interfaceType === 'interface-input' }"
	>
		<div v-for="(val, index) in value" :key="index" class="value">
			<input-component
				:is="interfaceType"
				:type="fieldInfo.type"
				:value="val"
				@input="setValueAt(index, $event)"
			></input-component>
		</div>
	</div>
	<template v-else-if="['_between', '_nbetween'].includes(field.comparator)" class="between">
		<input-component
			:is="interfaceType"
			:type="fieldInfo.type"
			:value="value[0]"
			@input="setValueAt(0, $event)"
		></input-component>
		<div class="and">{{ t('interfaces.filter.and') }}</div>
		<input-component
			:is="interfaceType"
			:type="fieldInfo.type"
			:value="value[1]"
			@input="setValueAt(1, $event)"
		></input-component>
	</template>
</template>

<script lang="ts">
import { FilterField } from './system-filter.vue';
import { computed, defineComponent, PropType } from 'vue';
import { useFieldsStore } from '@/stores';
import { useI18n } from 'vue-i18n';
import { clone } from 'lodash';
import InputComponent from './input-component.vue';

export default defineComponent({
	components: { InputComponent },
	props: {
		field: {
			type: Object as PropType<FilterField>,
			required: true,
		},
		collection: {
			type: String,
			required: true,
		},
	},
	emits: ['update:field'],
	setup(props, { emit }) {
		const fieldsStore = useFieldsStore();
		const { t } = useI18n();

		const fieldInfo = computed(() => {
			return fieldsStore.getField(props.collection, props.field.name);
		});

		const interfaceType = computed(() => {
			const types: Record<string, string> = {
				bigInteger: 'input',
				binary: 'input',
				boolean: 'boolean',
				date: 'datetime',
				dateTime: 'datetime',
				decimal: 'input',
				float: 'input',
				integer: 'input',
				json: 'input-code',
				string: 'input',
				text: 'input',
				time: 'datetime',
				timestamp: 'datetime',
				uuid: 'input',
				csv: 'input',
				hash: 'input-hash',
				geometry: 'map',
			};

			return 'interface-' + types[fieldInfo.value?.type || 'string'];
		});

		const value = computed<any | any[]>({
			get() {
				if (['_in', '_nin'].includes(props.field.comparator)) {
					return [...(props.field.value as string[]).filter((val) => val !== null && val !== ''), null];
				} else {
					return props.field.value;
				}
			},
			set(newVal) {
				const newField = clone(props.field);

				if (['_in', '_nin'].includes(props.field.comparator)) {
					newField.value = (newVal as string[]).filter((val) => val !== null && val !== '');
				} else {
					newField.value = newVal;
				}
				emit('update:field', newField);
			},
		});

		function setValueAt(index: number, newVal: any) {
			let newArray = Array.isArray(value.value) ? clone(value.value) : new Array(index + 1);
			newArray[index] = newVal;
			value.value = newArray;
		}

		return { t, fieldInfo, interfaceType, value, setValueAt };
	},
});
</script>

<style lang="scss" scoped>
.value {
	display: flex;
	align-items: center;

	.v-icon {
		margin-right: 8px;
		margin-left: 12px;
		color: var(--foreground-subdued);
		cursor: pointer;

		&:hover {
			color: var(--danger);
		}
	}
}

.list {
	display: flex;

	.value:not(:last-child)::after {
		margin-right: 6px;
		content: ',';
	}

	&.moveComma .value:not(:last-child)::after {
		margin: 0 8px 0 -6px;
	}
}

.and {
	margin: 0px 8px;
}
</style>
