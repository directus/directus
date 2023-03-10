<template>
	<sidebar-detail :icon="enabled ? 'sync' : 'sync_disabled'" :title="t('live_preview')" :badge="enabled">
		<div class="fields">
			<div class="field full">
				<p class="type-label">Show Preview</p>
				<v-checkbox v-model="enabledWritable" block :label="enabledWritable? 'Enabled' : 'Disabled'" />
			</div>
		</div>
	</sidebar-detail>
</template>

<script setup lang="ts">
import { useSync } from '@directus/shared/composables';
import { useI18n } from 'vue-i18n';

interface Props {
	enabled?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
	enabled: false,
});

const emit = defineEmits(['update:enabled']);

const enabledWritable = useSync(props, 'enabled', emit);

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
