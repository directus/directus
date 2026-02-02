<script setup lang="ts">
import { computed } from 'vue';
import SidebarDetail from './sidebar-detail.vue';
import VIcon from '@/components/v-icon/v-icon.vue';
import VSelect from '@/components/v-select/v-select.vue';
import { useExtension } from '@/composables/use-extension';
import { useExtensions } from '@/extensions';

const props = defineProps<{
	modelValue: string | null;
}>();

const emit = defineEmits<{
	'update:modelValue': [value: string];
}>();

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
	<SidebarDetail id="layout" icon="layers" :title="$t('layout_options')">
		<div class="layout-options">
			<div class="field">
				<div class="type-label">{{ $t('layout') }}</div>
				<VSelect v-model="layout" :items="layouts" item-text="name" item-value="id" item-icon="icon">
					<template v-if="currentLayout!.icon" #prepend>
						<VIcon :name="currentLayout!.icon" />
					</template>
				</VSelect>
			</div>

			<slot />
		</div>
	</SidebarDetail>
</template>

<style lang="scss" scoped>
@use '@/styles/mixins';

:deep(.layout-options) {
	--theme--form--row-gap: 20px;

	margin-block-end: 4px;

	@include mixins.form-grid;
}
</style>
