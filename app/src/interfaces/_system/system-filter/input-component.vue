<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
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
	{ focus: true, choices: () => [] }
);

const emit = defineEmits<{
	(e: 'input', value: string | number | Record<string, unknown> | boolean | null): void;
}>();

const inputEl = ref<HTMLInputElement>();
const { t } = useI18n();

const dateTimeMenu = ref();

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
			return '[+\\-]?[0-9]+';
		case 'decimal':
		case 'float':
			return '[+\\-]?[0-9]+\\.?[0-9]*';
		case 'uuid':
			return '[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}';
		default:
			return '';
	}
});

function getInputWidth(input: string | null) {
	// At minimum 3, at maximum 40
	return Math.min(Math.max(input?.length ?? 2, 2) + 1, 40) + 'ch';
}

watch(inputEl, () => {
	console.log('INPUT EL CHANGED');
	if (inputEl.value) inputEl.value.style.width = getInputWidth(inputEl.value.value);
});

onMounted(() => {
	console.log('WE MOUNTED:', inputEl.value?.value);
	if (props.focus) inputEl.value?.focus();
	if (inputEl.value) inputEl.value.style.width = getInputWidth(inputEl.value.value);
});

function emitValue(val: string | null) {
	if (val === '') {
		return emit('input', null);
	}

	if (
		typeof val === 'string' &&
		(['$NOW', '$CURRENT_USER', '$CURRENT_ROLE'].some((prefix) => val.startsWith(prefix)) ||
			/^{{\s*?\S+?\s*?}}$/.test(val))
	) {
		return emit('input', val);
	}

	if (typeof val !== 'string' || new RegExp(inputPattern.value).test(val)) {
		return emit('input', val);
	}
}

function onInput(val: string | null) {
	console.log('ON INPUT::::', typeof val, val);

	if (inputEl.value) {
		inputEl.value.style.width = getInputWidth(val);
	}

	emitValue(val);
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
		@update:model-value="emitValue($event)"
	/>
	<template v-else-if="is === 'interface-datetime'">
		<input
			ref="inputEl"
			type="text"
			:pattern="inputPattern"
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
			<component :is="is" class="input-component" small :type="type" :value="value" @input="emitValue($event)" />
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
