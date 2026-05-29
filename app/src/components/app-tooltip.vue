<script setup lang="ts">
import { TooltipArrow, TooltipContent, TooltipPortal, TooltipRoot, TooltipTrigger } from 'reka-ui';
import { onUnmounted, reactive } from 'vue';
import VKbd from '@/components/v-kbd.vue';
import { getGlobalTooltip, TOOLTIP_CONTENT_ID } from '@/directives/tooltip';

const tooltip = getGlobalTooltip();
const state = reactive({ ...tooltip.state });
const unwatch = tooltip.watch(() => Object.assign(state, tooltip.state));

onUnmounted(unwatch);
</script>

<template>
	<TooltipRoot :open="state.open" @update:open="(v) => !v && tooltip.closeTooltip()">
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
					<VKbd v-for="key in state.kbd" :key="key" :value="key" size="sm" variant="inverted" />
				</span>
				<TooltipArrow />
			</TooltipContent>
		</TooltipPortal>
	</TooltipRoot>
</template>
