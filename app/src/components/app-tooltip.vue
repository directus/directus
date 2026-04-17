<script setup lang="ts">
import { TooltipArrow, TooltipContent, TooltipPortal, TooltipRoot, TooltipTrigger } from 'reka-ui';
import VKbd from '@/components/v-kbd.vue';
import { TOOLTIP_CONTENT_ID, useGlobalTooltip } from '@/composables/use-global-tooltip';

const { state, closeTooltip } = useGlobalTooltip();
</script>

<template>
	<TooltipRoot :open="state.open" @update:open="(v) => !v && closeTooltip()">
		<TooltipTrigger as="span" :reference="state.virtualRef" aria-hidden="true" :tabindex="-1" style="display: none" />
		<TooltipPortal>
			<TooltipContent
				:id="TOOLTIP_CONTENT_ID"
				force-mount
				:side="state.side"
				:align="state.align"
				:side-offset="8"
				class="tooltip"
				:class="{ inverted: state.inverted, monospace: state.monospace }"
			>
				{{ state.content }}
				<span v-if="state.kbd" class="tooltip-kbd">
					<VKbd v-for="key in state.kbd" :key="key" :value="key" size="small" variant="inverted" />
				</span>
				<TooltipArrow />
			</TooltipContent>
		</TooltipPortal>
	</TooltipRoot>
</template>
