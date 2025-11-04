<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';

defineOptions({ inheritAttrs: false });

withDefaults(
	defineProps<{
		value?: string | null;
		autofocus?: boolean;
		autocomplete?: string | null;
		placeholder?: string;
		disabled?: boolean;
	}>(),
	{
		value: null,
		autofocus: false,
		autocomplete: 'new-password',
		disabled: false,
	},
);

const emit = defineEmits<{
	input: [value: string];
}>();

const { t } = useI18n();
const hidden = ref<boolean>(true);

function toggleHidePassword() {
	hidden.value = !hidden.value;
}
</script>

<template>
	<v-input
		:model-value="value"
		:type="hidden ? 'password' : 'text'"
		:autocomplete="autocomplete"
		:autofocus="autofocus"
		:placeholder="placeholder ?? t('password')"
		:disabled="disabled"
		@update:model-value="emit('input', $event)"
	>
		<template #append>
			<v-icon
				v-tooltip="hidden ? t('show_password') : t('hide_password')"
				:name="hidden ? 'visibility' : 'visibility_off'"
				clickable
				@click="toggleHidePassword"
			/>
		</template>
	</v-input>
</template>
