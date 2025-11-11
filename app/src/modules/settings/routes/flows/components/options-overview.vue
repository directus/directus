<script setup lang="ts">
import { useClipboard } from '@/composables/use-clipboard';
import { translate } from '@/utils/translate-object-values';
import { FlowRaw } from '@directus/types';

defineProps<{
	panel: Record<string, any>;
	currentOperation: any;
	flow: FlowRaw;
}>();


const { isCopySupported, copyToClipboard } = useClipboard();
</script>

<template>
	<div v-tooltip="panel.key" class="name">
		{{ panel.id === '$trigger' ? t(`triggers.${panel.type}.name`) : panel.name }}
	</div>
	<dl class="options-overview">
		<div
			v-for="{ label, text, copyable } of translate(currentOperation?.overview(panel.options ?? {}, { flow }))"
			:key="label"
		>
			<dt>{{ label }}</dt>
			<dd>{{ text }}</dd>
			<v-icon
				v-if="isCopySupported && copyable"
				v-tooltip="text"
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
		margin-block-end: 6px;
	}

	dt {
		flex-basis: 100%;
		margin-block-end: -2px;
	}

	dd {
		font-family: var(--theme--fonts--monospace--font-family);
		flex-basis: 0;
	}

	.clipboard-icon {
		--v-icon-color: var(--theme--foreground-subdued);
		--v-icon-color-hover: var(--theme--foreground);
		margin-inline-start: 4px;
	}
}
</style>
