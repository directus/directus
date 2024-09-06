<script setup lang="ts">
import { computed, onMounted, onUpdated, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

type Choice = {
	text: string;
	value: string | number;
	children?: Choice[];
};

const props = withDefaults(
	defineProps<{
		is: string;
		type: string;
		value: string | number | Record<string, unknown> | boolean | null;
		focus?: boolean;
		choices?: Choice[];
	}>(),
	{
		focus: true,
		choices: () => [],
	},
);

const emit = defineEmits<{
	input: [value: string | number | Record<string, unknown> | boolean | null];
}>();

const { t } = useI18n();
const dateTimeMenu = ref();
const inputEl = ref<HTMLInputElement | null>(null);
const isInputValid = ref(true);
const inputBorderColor = computed(() => (isInputValid.value ? 'none' : 'var(--theme--danger)'));

const displayValue = computed(() => {
	if (props.value === null) return null;
	if (props.value === undefined) return null;

	if (typeof props.value === 'string' && props.value.length > 25) {
		return props.value.substring(0, 22) + '...';
	}

	return props.value;
});

const inputPattern = computed(() => {
	switch (props.type) {
		case 'integer':
		case 'bigInteger':
			return '^[+\\-]?[0-9]+$';
		case 'decimal':
		case 'float':
			return '^[+\\-]?[0-9]+\\.?[0-9]*$';
		case 'uuid':
			return '^[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}$';
		default:
			return undefined;
	}
});

onMounted(() => {
	if (props.focus) inputEl.value?.focus();
});

/*
 * Because there's currently (2024-01-09) no way to uniquely identify filters
 * we run into rendering issues when dragging and reordering input-groups/input-components.
 * By listening for the DOM changes via `onUpdated` we can keep this component updated
 * without having a `key` for each input-group in nodes.
 */
onUpdated(() => onEffect(props.value));

watch(
	() => props.value,
	(value) => onEffect(value),
	{ immediate: true },
);

function isValueValid(value: any): boolean {
	if (value === '' || typeof value !== 'string' || !inputPattern.value || new RegExp(inputPattern.value).test(value)) {
		return true;
	}

	if (
		typeof value === 'string' &&
		(['$NOW', '$CURRENT_USER', '$CURRENT_ROLE'].some((prefix) => value.startsWith(prefix)) ||
			/^{{\s*?\S+?\s*?}}$/.test(value))
	) {
		return true;
	}

	return false;
}

function onEffect(value: typeof props.value) {
	isInputValid.value = isValueValid(value);
}

function onInput(value: string | null) {
	isInputValid.value = isValueValid(value);

	if (isInputValid.value) {
		emit('input', value === '' ? null : value);
	}
}
</script>

<template>
	<v-icon
		v-if="type === 'boolean'"
		:name="value === null ? 'indeterminate_check_box' : value ? 'check_box' : 'check_box_outline_blank'"
		clickable
		class="preview"
		small
		@click="$emit('input', !value)"
	/>
	<input
		v-else-if="is === 'interface-input'"
		ref="inputEl"
		v-input-auto-width
		type="text"
		:pattern="inputPattern"
		:value="value"
		placeholder="--"
		@input="onInput(($event.target as HTMLInputElement).value)"
	/>
	<v-select
		v-else-if="is === 'select'"
		inline
		:items="choices"
		:model-value="value"
		:placeholder="t('select')"
		allow-other
		group-selectable
		@update:model-value="onInput($event)"
	/>
	<template v-else-if="is === 'interface-datetime'">
		<input
			ref="inputEl"
			v-input-auto-width
			type="text"
			:value="value"
			placeholder="--"
			@input="onInput(($event.target as HTMLInputElement).value)"
		/>
		<v-menu ref="dateTimeMenu" :close-on-content-click="false" show-arrow placement="bottom-start" seamless full-height>
			<template #activator="{ toggle }">
				<v-icon class="preview" name="event" small @click="toggle" />
			</template>
			<div class="date-input">
				<v-date-picker
					:type="type"
					:model-value="value"
					@update:model-value="onInput"
					@close="dateTimeMenu?.deactivate"
				/>
			</div>
		</v-menu>
	</template>
	<v-menu v-else :close-on-content-click="false" show-arrow placement="bottom-start">
		<template #activator="{ toggle }">
			<v-icon
				v-if="type.startsWith('geometry') || type === 'json'"
				class="preview"
				:name="type === 'json' ? 'integration_instructions' : 'map'"
				small
				@click="toggle"
			/>
			<div v-else class="preview" @click="toggle">{{ displayValue }}</div>
		</template>
		<div class="input" :class="type">
			<component :is="is" class="input-component" small :type="type" :value="value" @input="onInput($event)" />
		</div>
	</v-menu>
</template>

<style lang="scss" scoped>
.preview {
	display: flex;
	justify-content: center;
	color: var(--theme--primary);
	font-family: var(--theme--fonts--monospace--font-family);
	white-space: nowrap;
	text-overflow: ellipsis;
	cursor: pointer;

	&:empty {
		&::after {
			color: var(--theme--form--field--input--foreground-subdued);
			content: '--';
		}
	}
}

.input {
	padding: 8px 4px;

	&.date,
	&.timestamp,
	&.time,
	&.dateTime {
		min-width: 250px;
	}

	&.geometry,
	&.json {
		width: 500px;
	}
}

input {
	color: var(--theme--primary);
	font-family: var(--theme--fonts--monospace--font-family);
	line-height: 1em;
	background-color: var(--theme--form--field--input--background);
	border: none;
	max-width: 40ch;
	box-shadow: 0 4px 0 -2px v-bind(inputBorderColor);

	&::placeholder {
		color: var(--theme--form--field--input--foreground-subdued);
		font-weight: 500;
		font-family: var(--theme--fonts--monospace--font-family);
	}
}

.dialog {
	position: relative;
	min-width: 800px;
}

.date-input {
	min-width: 400px;
}
</style>
