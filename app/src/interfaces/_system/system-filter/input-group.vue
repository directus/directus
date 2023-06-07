<template>
	<template v-if="['_eq', '_neq', '_lt', '_gt', '_lte', '_gte'].includes(comparator)">
		<input-component
			:is="interfaceType"
			:choices="choices"
			:type="fieldInfo?.type ?? 'unknown'"
			:value="value as (string | number)"
			@input="value = $event"
		/>
	</template>
	<template
		v-else-if="
			[
				'_contains',
				'_ncontains',
				'_icontains',
				'_starts_with',
				'_nstarts_with',
				'_ends_with',
				'_nends_with',
				'_regex',
			].includes(comparator)
		"
	>
		<input-component
			is="interface-input"
			:choices="choices"
			:type="fieldInfo?.type ?? 'unknown'"
			:value="value as (string | number)"
			@input="value = $event"
		/>
	</template>

	<div
		v-else-if="['_in', '_nin'].includes(comparator)"
		class="list"
		:class="{ moveComma: interfaceType === 'interface-input' }"
	>
		<div v-for="(val, index) in value" :key="index" class="value">
			<input-component
				:is="interfaceType"
				:type="fieldInfo?.type ?? 'unknown'"
				:value="val"
				:focus="false"
				:choices="choices"
				@input="setListValue(index, $event)"
			/>
		</div>
	</div>

	<template v-else-if="['_between', '_nbetween'].includes(comparator)">
		<input-component
			:is="interfaceType"
			:choices="choices"
			:type="fieldInfo?.type ?? 'unknown'"
			:value="(value as (string | number)[])[0] ?? ''"
			@input="setValueAt(0, $event)"
		/>
		<div class="and">{{ t('interfaces.filter.and') }}</div>
		<input-component
			:is="interfaceType"
			:choices="choices"
			:type="fieldInfo?.type ?? 'unknown'"
			:value="(value as (string | number)[])[1] ?? ''"
			@input="setValueAt(1, $event)"
		/>
	</template>
</template>

<script setup lang="ts">
import { useFieldsStore } from '@/stores/fields';
import { useRelationsStore } from '@/stores/relations';
import { FieldFilter } from '@directus/types';
import { clone, get } from 'lodash';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import InputComponent from './input-component.vue';
import { fieldToFilter, getComparator, getField } from './utils';

const props = defineProps<{
	field: FieldFilter;
	collection: string;
}>();

const emit = defineEmits<{
	(e: 'update:field', value: FieldFilter): void;
}>();

const fieldsStore = useFieldsStore();
const relationsStore = useRelationsStore();
const { t } = useI18n();

const fieldInfo = computed(() => {
	const fieldInfo = fieldsStore.getField(props.collection, getField(props.field));

	// Alias uses the foreign key type
	if (fieldInfo?.type === 'alias') {
		const relations = relationsStore.getRelationsForField(props.collection, getField(props.field));

		if (relations[0]) {
			return fieldsStore.getField(relations[0].collection, relations[0].field);
		}
	}

	return fieldInfo;
});

const comparator = computed(() => {
	return getComparator(props.field);
});

const interfaceType = computed(() => {
	if (fieldInfo.value?.meta?.options?.choices) return 'select';

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
		text: 'input-multiline',
		time: 'datetime',
		timestamp: 'datetime',
		uuid: 'input',
		csv: 'input',
		hash: 'input-hash',
		geometry: 'map',
	};

	return 'interface-' + types[fieldInfo.value?.type || 'string'];
});

const value = computed<unknown | unknown[]>({
	get() {
		const fieldPath = getField(props.field);

		const value = get(props.field, `${fieldPath}.${comparator.value}`);

		if (['_in', '_nin'].includes(comparator.value)) {
			return [...(value as string[]).filter((val) => val !== null && val !== ''), null];
		} else {
			return value;
		}
	},
	set(newVal) {
		const fieldPath = getField(props.field);

		let value;

		if (['_in', '_nin'].includes(comparator.value)) {
			value = (newVal as string[])
				.flatMap((val) => (typeof val === 'string' ? val.split(',').map((v) => v.trim()) : ''))
				.filter((val) => val !== null && val !== '');
		} else {
			value = newVal;
		}

		emit('update:field', fieldToFilter(fieldPath, comparator.value, value));
	},
});

const choices = computed(() => fieldInfo.value?.meta?.options?.choices ?? []);

function setValueAt(index: number, newVal: any) {
	let newArray = Array.isArray(value.value) ? clone(value.value) : new Array(index + 1);
	newArray[index] = newVal;
	value.value = newArray;
}

function setListValue(index: number, newVal: any) {
	if (typeof newVal === 'string' && newVal.includes(',')) {
		const parts = newVal.split(',');

		for (let i = 0; i < parts.length; i++) {
			setValueAt(index + i, parts[i]);
		}
	} else {
		setValueAt(index, newVal);
	}
}
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
