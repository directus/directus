<script setup lang="ts">
import { useClipboard } from '@/composables/use-clipboard';
import { translate } from '@/utils/translate-object-values';
import { FlowRaw } from '@directus/types';
import { useI18n } from 'vue-i18n';

defineProps<{
	panel: Record<string, any>;
	currentOperation: any;
	flow: FlowRaw;
}>();

const { t } = useI18n();

const { isCopySupported, copyToClipboard } = useClipboard();
</script>

<template>
	<div v-tooltip="panel.key" class="name">
		{{ panel.id === '$trigger' ? t(`triggers.${panel.type}.name`) : panel.name }}
	</div>
	<dl class="options-overview selectable">
		<div
			v-for="{ label, text, copyable } of translate(currentOperation?.overview(panel.options ?? {}, { flow }))"
			:key="label"
		>
			<dt>{{ label }}</dt>
			<dd>{{ text }}</dd>
			<v-icon
				v-if="isCopySupported && copyable"
				name="content_copy"
				small
				clickable
				class="clipboard-icon"
				@click="copyToClipboard(text)"
			/>
		</div>
	</dl>
</template>

<style lang="scss" scoped>
.options-overview {
	> div {
		flex-wrap: wrap;
		align-items: center;
		margin-bottom: 6px;
	}

	dt {
		flex-basis: 100%;
		margin-bottom: -2px;
	}

	dd {
		font-family: var(--theme--fonts--monospace--font-family);
		flex-basis: 0;
	}

	.clipboard-icon {
		--v-icon-color: var(--theme--foreground-subdued);
		--v-icon-color-hover: var(--theme--foreground);
		margin-left: 4px;
	}
}
</style>
