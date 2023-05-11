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
		:style="{ width }"
		placeholder="--"
		@input="emitValue(($event.target as HTMLInputElement).value)"
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
			:style="{ width }"
			placeholder="--"
			@input="emitValue(($event.target as HTMLInputElement).value)"
		/>
		<v-menu
			ref="dateTimeMenu"
			:close-on-content-click="false"
			:show-arrow="true"
			placement="bottom-start"
			seamless
			full-height
		>
			<template #activator="{ toggle }">
				<v-icon class="preview" name="event" small @click="toggle" />
			</template>
			<div class="date-input">
				<v-date-picker
					:type="type"
					:model-value="value"
					@update:model-value="emitValue"
					@close="dateTimeMenu?.deactivate"
				/>
			</div>
		</v-menu>
	</template>
	<v-menu v-else :close-on-content-click="false" :show-arrow="true" placement="bottom-start">
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

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
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

const inputEl = ref<HTMLElement>();
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

const width = computed(() => {
	return (props.value?.toString().length || 2) + 1 + 'ch';
});

const inputPattern = computed(() => {
	switch (props.type) {
		case 'integer':
		case 'bigInteger':
			return '[+-]?[0-9]+';
		case 'decimal':
		case 'float':
			return '[+-]?[0-9]+\\.?[0-9]*';
		case 'uuid':
			return '[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}';
		default:
			return '';
	}
});

onMounted(() => {
	if (props.focus) inputEl.value?.focus();
});

function emitValue(val: string) {
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
</script>

<style lang="scss" scoped>
.preview {
	display: flex;
	justify-content: center;
	color: var(--primary);
	font-family: var(--family-monospace);
	white-space: nowrap;
	text-overflow: ellipsis;
	cursor: pointer;

	&:empty {
		&::after {
			color: var(--foreground-subdued);
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
	color: var(--primary);
	font-family: var(--family-monospace);
	line-height: 1em;
	background-color: var(--background-page);
	border: none;

	&::placeholder {
		color: var(--foreground-subdued);
		font-weight: 500;
		font-family: var(--family-monospace);
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
