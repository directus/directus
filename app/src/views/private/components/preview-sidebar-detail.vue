<template>
	<sidebar-detail :icon="enabled ? 'sync' : 'sync_disabled'" :title="t('live_preview')" :badge="enabled">
		<div class="fields">
			<div class="field full">
				<p class="type-label">Show Preview</p>
				<v-checkbox v-model="enabledWritable" block :label="enabledWritable? 'Enabled' : 'Disabled'" />
			</div>
			<div class="field full">
				<p class="type-label">Preview Size</p>
				<v-select v-model="sizeWritable" :items="sizeChoices" />
			</div>
		</div>
	</sidebar-detail>
</template>

<script setup lang="ts">
import { useSync } from '@directus/shared/composables';
import { useI18n } from 'vue-i18n';

interface Props {
	enabled?: boolean;
	size?: string
}

const props = withDefaults(defineProps<Props>(), {
	enabled: false,
	size: 'full',
});

const emit = defineEmits(['update:enabled', 'update:size']);

const enabledWritable = useSync(props, 'enabled', emit);
const sizeWritable = useSync(props, 'size', emit);

const sizeChoices = [
	{
		text: 'Full',
		value: 'full',
	},
	{
		text: 'Small',
		value: 'small',
	},
	{
		text: 'Medium',
		value: 'medium',
	},
	{
		text: 'Large',
		value: 'large',
	}
]

const { t } = useI18n();
</script>

<style lang="scss" scoped>
@import '@/styles/mixins/form-grid';

.fields {
	--form-vertical-gap: 24px;

	@include form-grid;

	.type-label {
		font-size: 1rem;
	}
}

.v-checkbox {
	margin-top: 8px;
}
</style>
