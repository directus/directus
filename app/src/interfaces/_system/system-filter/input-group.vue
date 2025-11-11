<script setup lang="ts">
import { useFakeVersionField } from '@/composables/use-fake-version-field';
import { useFieldsStore } from '@/stores/fields';
import { useRelationsStore } from '@/stores/relations';
import { useCollection } from '@directus/composables';
import { FieldFilter } from '@directus/types';
import { clone, get } from 'lodash';
import { computed, nextTick, onBeforeMount, ref, toRef } from 'vue';
import InputComponent from './input-component.vue';
import { fieldToFilter, getComparator, getField } from './utils';

// Workaround because you cannot cast directly to union types inside
// the template block without running into eslint/prettier issues
type ScalarValue = string | boolean | number | null;

const props = defineProps<{
	field: FieldFilter;
	collection: string;
	variableInputEnabled?: boolean;
}>();

const emit = defineEmits<{
	(e: 'update:field', value: FieldFilter): void;
}>();

const fieldsStore = useFieldsStore();
const relationsStore = useRelationsStore();

const fieldPath = computed(() => getField(props.field));
const isVersionField = computed(() => fieldPath.value === '$version');

const { info: collectionInfo } = useCollection(computed(() => props.collection));
const versioningEnabled = computed(() => !!collectionInfo.value?.meta?.versioning && isVersionField.value);
const { fakeVersionField } = useFakeVersionField(toRef(props, 'collection'), versioningEnabled, isVersionField);

const fieldInfo = computed(() => {
	if (isVersionField.value) {
		return fakeVersionField.value;
	}

	const fieldInfo = fieldsStore.getField(props.collection, fieldPath.value);

	// Alias uses the foreign key type
	if (fieldInfo?.type === 'alias') {
		const relations = relationsStore.getRelationsForField(props.collection, fieldPath.value);

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

const fieldValue = computed(() => {
	return get(props.field, `${fieldPath.value}.${comparator.value}`);
});

const {
	isVariableInputActive,
	isVariableInputComparator,
	variableInputDisplay,
	onToggleVariableInput,
	onVariableInput,
} = useVariableInput();

const value = computed<unknown | unknown[]>({
	get() {
		if (!isVariableInputActive.value && ['_in', '_nin'].includes(comparator.value)) {
			return [...(fieldValue.value as (string | number | null)[]).filter((val) => val !== null && val !== ''), null];
		}

		return fieldValue.value;
	},
	set(newVal) {
		let value;

		if (!isVariableInputActive.value && ['_in', '_nin'].includes(comparator.value)) {
			value = (newVal as (string | number | null)[])
				.filter((val) => val !== null && val !== '')
				.map((val) => (typeof val === 'string' ? val.trim() : val));
		} else {
			value = newVal;
		}

		emit('update:field', fieldToFilter(fieldPath.value, comparator.value, value));
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
		...(value.value as (string | number)[]),
		...newValue.split(',').filter((val) => val !== null && val !== ''),
	];

	value.value = newValueArray;
	focusInputAtIndex(newValueArray.length - 1);
}

function useVariableInput() {
	const arrayComparators = ['_in', '_nin', '_between', '_nbetween'];
	const variableInputComparators = ['_in', '_nin'];
	const isVariableInputActive = ref(false);
	const variableInputDisplay = computed(inputDisplay);
	const isArrayComparator = computed(() => props.variableInputEnabled && arrayComparators.includes(comparator.value));

	const isVariableInputComparator = computed(
		() => props.variableInputEnabled && variableInputComparators.includes(comparator.value),
	);

	onBeforeMount(determineVariableInput);

	return {
		isVariableInputActive,
		isVariableInputComparator,
		onToggleVariableInput,
		onVariableInput,
		variableInputDisplay,
	};

	function determineVariableInput() {
		if (!isVariableInputComparator.value) return;
		isVariableInputActive.value = !Array.isArray(fieldValue.value);
	}

	function onToggleVariableInput() {
		const showVariableInput = !isVariableInputActive.value;

		if (showVariableInput) {
			// Note: first toggle, then set value

			isVariableInputActive.value = showVariableInput;

			if (isArrayComparator.value && Array.isArray(value.value)) {
				value.value = value.value.join(',');
			}
		} else {
			// Note: first set value, then toggle

			if (isArrayComparator.value) {
				if (typeof value.value === 'string') {
					value.value = (value.value as string).split(',');
				} else if (value.value === null) {
					value.value = [];
				} else {
					value.value = [value.value];
				}
			}

			isVariableInputActive.value = showVariableInput;
		}
	}

	function onVariableInput(newValue: unknown) {
		if (newValue === null) {
			value.value = '';
			return;
		}

		newValue = String(newValue).replace(/{{/g, '').replace(/}}/g, '');
		value.value = `{{${newValue}}}`;
	}

	function inputDisplay() {
		if (isVariableInputActive.value && typeof value.value === 'string') {
			return value.value.replace(/{{/g, '').replace(/}}/g, '');
		}

		return '';
	}
}
</script>

<template>
	<v-icon
		v-if="isVariableInputComparator"
		v-tooltip="$t('toggle_variable_input')"
		class="variable-input-toggle"
		:class="{ active: isVariableInputActive }"
		name="data_object"
		small
		clickable
		@click="onToggleVariableInput"
	/>

	<template v-if="isVariableInputActive">
		<span class="variable-input-braces">{{ '\{\{' }}</span>

		<input-component
			is="interface-input"
			class="variable-input"
			type="unknown"
			:value="variableInputDisplay"
			@input="onVariableInput"
		/>

		<span class="variable-input-braces">{{ '\}\}' }}</span>
	</template>

	<template v-else>
		<template v-if="['_eq', '_neq', '_lt', '_gt', '_lte', '_gte'].includes(comparator)">
			<input-component
				:is="interfaceType"
				:choices="choices"
				:type="fieldInfo?.type ?? 'unknown'"
				:value="value as ScalarValue"
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
				:value="value as ScalarValue"
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
			<div class="and">{{ $$t('interfaces.filter.and') }}</div>
			<input-component
				:is="interfaceType"
				:choices="choices"
				:type="fieldInfo?.type ?? 'unknown'"
				:value="(value as (string | number)[])[1] ?? ''"
				@input="setValueAt(1, $event)"
			/>
		</template>
	</template>
</template>

<style lang="scss" scoped>
.variable-input-toggle {
	--v-icon-color: var(--theme--foreground-subdued);
	--v-icon-color-hover: var(--theme--foreground);

	margin-inline-end: 4px;

	.comparator + & {
		margin-inline-start: -4px;
	}

	&.v-icon {
		inline-size: 24px !important;
		block-size: 24px !important;
		border-radius: 50%;
		display: flex;
		justify-content: center;
		align-items: center;
	}

	&.active {
		--v-icon-color: var(--theme--primary);
		--v-icon-color-hover: var(--theme--primary-accent);

		background-color: var(--theme--primary-background);
	}
}

.variable-input {
	color: var(--theme--secondary);
	padding-inline: 0;
}

.variable-input-braces {
	font-family: var(--theme--fonts--monospace--font-family);
	color: var(--theme--form--field--input--foreground-subdued);
	margin-inline-start: 2px;

	.variable-input + & {
		margin-inline-start: 0;
	}
}

.value {
	display: flex;
	align-items: center;

	.v-icon {
		margin-inline: 12px 8px;
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
		margin-inline-end: 6px;
		content: ',';
	}
}

.and {
	margin: 0 8px;
}
</style>
