<script setup lang="ts">
import { TooltipArrow, TooltipContent, TooltipPortal, TooltipRoot, TooltipTrigger } from 'reka-ui';
import type { TooltipAlign, TooltipSide } from '@/composables/use-global-tooltip';

interface Props {
	side?: TooltipSide;
	align?: TooltipAlign;
}

withDefaults(defineProps<Props>(), {
	side: 'top',
	align: 'center',
});
</script>

<template>
	<TooltipRoot :delay-duration="500">
		<TooltipTrigger as-child>
			<slot name="trigger" />
		</TooltipTrigger>
		<TooltipPortal>
			<TooltipContent :side="side" :align="align" :side-offset="8" class="tooltip">
				<slot />
				<TooltipArrow />
			</TooltipContent>
		</TooltipPortal>
	</TooltipRoot>
</template>
