<template>
	<v-notice v-if="!choices" type="warning">
		{{ t('choices_option_configured_incorrectly') }}
	</v-notice>
	<v-select
		v-else
		multiple
		:model-value="value"
		:items="choices"
		:disabled="disabled"
		:show-deselect="allowNone"
		:placeholder="placeholder"
		:allow-other="allowOther"
		:close-on-content-click="false"
		:multiple-preview-threshold="previewThreshold"
		@update:model-value="updateValue($event)"
	>
		<template v-if="icon" #prepend>
			<v-icon :name="icon" />
		</template>
	</v-select>
</template>

<script setup lang="ts">
import { sortBy } from 'lodash';
import { useI18n } from 'vue-i18n';

type Option = {
	text: string;
	value: string | number | boolean;
};

const props = withDefaults(
	defineProps<{
		value?: string[];
		disabled?: boolean;
		choices?: Option[];
		icon?: string;

		allowNone?: boolean;
		placeholder?: string;
		allowOther?: boolean;
		previewThreshold?: number;
	}>(),
	{
		previewThreshold: 3,
	}
);

const emit = defineEmits(['input']);

const { t } = useI18n();

function updateValue(value: string[]) {
	const sortedValue = sortBy(value, (val) => {
		const sortIndex = props.choices!.findIndex((choice) => val === choice.value);
		return sortIndex !== -1 ? sortIndex : value.length;
	});

	emit('input', sortedValue);
}
</script>
