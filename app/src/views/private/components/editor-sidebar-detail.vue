<script setup lang="ts">
import { useExtension } from '@/composables/use-extension';
import { useExtensions } from '@/extensions';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

const props = defineProps<{
	modelValue: string | null;
}>();

const emit = defineEmits<{
	'update:modelValue': [value: string | null];
}>();

const { t } = useI18n();

const { editors } = useExtensions();

const editor = computed({
	get() {
		return props.modelValue;
	},
	set(value) {
		emit('update:modelValue', value);
	},
});

const selectedEditor = useExtension('editor', editor);
const currentEditor = computed(() => selectedEditor.value);

// Add a "Default" option to allow clearing the custom editor
const editorOptions = computed(() => [{ id: null, name: t('default'), icon: 'edit' }, ...editors.value]);
</script>

<template>
	<sidebar-detail icon="edit" :title="t('editor')">
		<div class="editor-options">
			<div class="field">
				<div class="type-label">{{ t('editor') }}</div>
				<v-select v-model="editor" :items="editorOptions" item-text="name" item-value="id" item-icon="icon">
					<template v-if="currentEditor?.icon" #prepend>
						<v-icon :name="currentEditor.icon" />
					</template>
				</v-select>
			</div>

			<slot />
		</div>
	</sidebar-detail>
</template>

<style lang="scss" scoped>
.editor-options {
	--v-select-font-family: var(--theme--font-family-monospace);
	--v-input-font-family: var(--theme--font-family-monospace);

	.field {
		margin-block-end: 12px;
	}

	.type-label {
		margin-block-end: 4px;
	}
}
</style>
