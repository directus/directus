<script setup lang="ts">
import { useExtension } from '@/composables/use-extension';
import { useExtensions } from '@/extensions';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

const props = defineProps<{
	modelValue: string | null;
}>();

const emit = defineEmits<{
	'update:modelValue': [value: string];
}>();

const { t } = useI18n();

const { layouts } = useExtensions();

const layout = computed({
	get() {
		return props.modelValue ?? 'tabular';
	},
	set(value) {
		emit('update:modelValue', value);
	},
});

const selectedLayout = useExtension('layout', layout);
const fallbackLayout = useExtension('layout', 'tabular');
const currentLayout = computed(() => selectedLayout.value ?? fallbackLayout.value);
</script>

<template>
	<sidebar-detail id="layout" icon="layers" :title="t('layout_options')">
		<div class="layout-options">
			<div class="field">
				<div class="type-label">{{ t('layout') }}</div>
				<v-select v-model="layout" :items="layouts" item-text="name" item-value="id" item-icon="icon">
					<template v-if="currentLayout!.icon" #prepend>
						<v-icon :name="currentLayout!.icon" />
					</template>
				</v-select>
			</div>

			<slot />
		</div>
	</sidebar-detail>
</template>

<style lang="scss" scoped>
@use '@/styles/mixins';

:deep(.layout-options) {
	--theme--form--row-gap: 20px;

	margin-block-end: 4px;

	@include mixins.form-grid;
}
</style>
