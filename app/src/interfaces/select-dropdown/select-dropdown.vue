<script setup lang="ts">
import { i18n } from '@/lang';
import { useI18n } from 'vue-i18n';

type Option = {
	text: string;
	value: string | number | boolean;
	children?: Option[];
};

withDefaults(
	defineProps<{
		value: string | number | null;
		disabled?: boolean;
		choices?: Option[];
		icon?: string;
		allowNone?: boolean;
		placeholder?: string;
		allowOther?: boolean;
	}>(),
	{
		placeholder: () => i18n.global.t('select_an_item'),
	}
);

defineEmits(['input']);

const { t } = useI18n();
</script>

<template>
	<v-notice v-if="!choices" type="warning">
		{{ t('choices_option_configured_incorrectly') }}
	</v-notice>
	<v-select
		v-else
		:model-value="value"
		:items="choices"
		:disabled="disabled"
		:show-deselect="allowNone"
		:placeholder="placeholder"
		:allow-other="allowOther"
		@update:model-value="$emit('input', $event)"
	>
		<template v-if="icon" #prepend>
			<v-icon :name="icon" />
		</template>
	</v-select>
</template>
