<template>
	<v-dialog
		:model-value="modelValue"
		@update:model-value="$emit('update:modelValue', false)"
		@esc="$emit('update:modelValue', false)"
	>
		<v-card v-if="file">
			<v-card-title>{{ t('replace_file') }}</v-card-title>
			<v-card-text>
				<v-upload :preset="preset" :file-id="file.id" from-url @input="uploaded" />
			</v-card-text>
			<v-card-actions>
				<v-button secondary @click="$emit('update:modelValue', false)">{{ t('done') }}</v-button>
			</v-card-actions>
		</v-card>
	</v-dialog>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';

interface Props {
	modelValue?: boolean;
	file?: Record<string, any>;
	preset?: Record<string, any>;
}

withDefaults(defineProps<Props>(), {
	modelValue: false,
	file: () => ({}),
	preset: () => ({}),
});

const emit = defineEmits(['update:modelValue', 'replaced']);

const { t } = useI18n();

function uploaded() {
	emit('update:modelValue', false);
	emit('replaced');
}
</script>

<style lang="scss" scoped>
.add-new {
	--v-button-background-color: var(--primary-10);
	--v-button-color: var(--primary);
	--v-button-background-color-hover: var(--primary-25);
	--v-button-color-hover: var(--primary);
}
</style>
