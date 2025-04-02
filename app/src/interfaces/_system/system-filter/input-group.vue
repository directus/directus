<script setup lang="ts">
import { useFakeVersionField } from '@/composables/use-fake-version-field';
import { useFieldsStore } from '@/stores/fields';
import { useRelationsStore } from '@/stores/relations';
import { FieldFilter } from '@directus/types';
import { clone, get } from 'lodash';
import { computed, nextTick, ref, toRef } from 'vue';
import { useI18n } from 'vue-i18n';
import InputComponent from './input-component.vue';
import { fieldToFilter, getComparator, getField } from './utils';
import { useCollection } from '@directus/composables';

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

const field = computed(() => getField(props.field));
const isVersionField = computed(() => field.value === '$version');

const { info: collectionInfo } = useCollection(computed(() => props.collection));
const versioningEnabled = computed(() => !!collectionInfo.value?.meta?.versioning && isVersionField.value);
const { fakeVersionField } = useFakeVersionField(toRef(props, 'collection'), versioningEnabled, isVersionField);

const fieldInfo = computed(() => {
	if (isVersionField.value) {
		return fakeVersionField.value;
	}

	const fieldInfo = fieldsStore.getField(props.collection, field.value);

	// Alias uses the foreign key type
	if (fieldInfo?.type === 'alias') {
		const relations = relationsStore.getRelationsForField(props.collection, field.value);

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
			value = (newVal as string[]).filter((val) => val !== null && val !== '').map((val) => val.trim());
		} else {
			value = newVal;
		}

		emit('update:field', fieldToFilter(fieldPath, comparator.value, value));
	},
});

const choices = computed(() => fieldInfo.value?.meta?.options?.choices ?? []);
const inputRefs = ref<any[]>([]);

function setValueAt(index: number, newVal: any) {
	const newArray = Array.isArray(value.value) ? clone(value.value) : new Array(index + 1);
	newArray[index] = newVal;
	value.value = newArray;
}

function focusInputAtIndex(index: number) {
	nextTick(() => {
		if (inputRefs.value.length > index && inputRefs.value[index]) {
			inputRefs.value[index].focus();
		}
	});
}

function handleCommaKeyPressed(index: number) {
	if (Array.isArray(value.value) && value.value.length > index + 1) {
		focusInputAtIndex(index + 1);
	}
}

function handleCommaValuePasted(newValue: string) {
	const newValueArray = [
		...(value.value as string[]),
		...newValue.split(',').filter((val) => val !== null && val !== ''),
	];

	value.value = newValueArray;
	focusInputAtIndex(newValueArray.length - 1);
}
</script>

<template>
	<template v-if="['_eq', '_neq', '_lt', '_gt', '_lte', '_gte'].includes(comparator)">
		<input-component
			:is="interfaceType"
			:choices="choices"
			:type="fieldInfo?.type ?? 'unknown'"
			:value="value"
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
				'_istarts_with',
				'_nstarts_with',
				'_nistarts_with',
				'_ends_with',
				'_iends_with',
				'_nends_with',
				'_niends_with',
				'_regex',
			].includes(comparator)
		"
	>
		<input-component
			is="interface-input"
			:choices="choices"
			:type="fieldInfo?.type ?? 'unknown'"
			:value="value"
			@input="value = $event"
		/>
	</template>

	<div v-else-if="['_in', '_nin'].includes(comparator)" class="list">
		<div v-for="(val, index) in value" :key="index" class="value">
			<input-component
				:is="interfaceType"
				:ref="(el) => (inputRefs[index] = el)"
				:type="fieldInfo?.type ?? 'unknown'"
				:value="val"
				:focus="false"
				:choices="choices"
				comma-allowed
				@input="setValueAt(index, $event)"
				@comma-key-pressed="handleCommaKeyPressed(index)"
				@comma-value-pasted="handleCommaValuePasted($event)"
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

<style lang="scss" scoped>
.value {
	display: flex;
	align-items: center;

	.v-icon {
		margin-right: 8px;
		margin-left: 12px;
		color: var(--theme--form--field--input--foreground-subdued);
		cursor: pointer;

		&:hover {
			color: var(--theme--danger);
		}
	}
}

.list {
	display: flex;

	.value:not(:last-child)::after {
		margin-right: 6px;
		content: ',';
	}
}

.and {
	margin: 0 8px;
}
</style>
