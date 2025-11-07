<script setup lang="ts">
import VIcon from '@/components/v-icon/v-icon.vue';
import { AccordionContent, AccordionHeader, AccordionItem, AccordionTrigger } from 'reka-ui';

withDefaults(defineProps<{ id: string; title: string; icon: string, placement?: 'start' | 'end' }>(), {
	placement: 'start',
});
</script>

<template>
	<AccordionItem class="accordion-item" :class="placement" :value="id">
		<AccordionHeader>
			<AccordionTrigger class="accordion-trigger">
				<VIcon class="accordion-trigger-icon" :name="icon" />
				<span>{{ title }}</span>
			</AccordionTrigger>
		</AccordionHeader>
		<AccordionContent class="accordion-content">
			<div class="accordion-content-container">
				<slot />
			</div>
		</AccordionContent>
	</AccordionItem>
</template>

<style lang="scss" scoped>
.accordion-item {
	display: contents;
}

.accordion-trigger {
	display: flex;
	align-items: center;
	block-size: calc(60px + var(--theme--sidebar--section--toggle--border-width));
	inline-size: 100%;
	background-color: var(--theme--sidebar--section--toggle--background);
	border-block-end: var(--theme--sidebar--section--toggle--border-width) solid
		var(--theme--sidebar--section--toggle--border-color);
	color: var(--theme--sidebar--section--toggle--foreground);
	padding-inline: 12px;
}

.accordion-trigger-icon {
	margin-inline-end: 12px;
}

.accordion-content {
	overflow-y: auto;
}

.accordion-content[data-state='open'] {
	animation: slide-down var(--medium) var(--transition);
}

.accordion-content[data-state='closed'] {
	animation: slide-up var(--medium) var(--transition);
}

@keyframes slide-down {
	from {
		block-size: 0;
	}
	to {
		block-size: var(--reka-accordion-content-height);
	}
}

@keyframes slide-up {
	from {
		block-size: var(--reka-accordion-content-height);
	}
	to {
		block-size: 0;
	}
}

.accordion-content-container {
	padding: 12px;
}
</style>
