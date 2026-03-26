<script setup lang="ts">
import { AccordionContent, AccordionHeader, AccordionItem, AccordionTrigger } from 'reka-ui';
import { computed, watch } from 'vue';
import { useSidebarStore } from '../private-view/stores/sidebar';
import VBadge from '@/components/v-badge.vue';
import VIcon from '@/components/v-icon/v-icon.vue';

const props = defineProps<{
	id: string;
	title: string;
	icon: string;
	badge?: boolean | string | number;
}>();

const sidebarStore = useSidebarStore();

const emit = defineEmits<{
	toggle: [open: boolean];
}>();

const active = computed(() => sidebarStore.activeAccordionItem === props.id);

watch(
	() => sidebarStore.activeAccordionItem,
	(newActive, oldActive) => {
		if (newActive === props.id && newActive !== oldActive) {
			emit('toggle', true);
		} else if (oldActive === props.id && newActive !== props.id) {
			emit('toggle', false);
		}
	},
);
</script>

<template>
	<AccordionItem class="accordion-item" :class="{ active }" :value="id">
		<AccordionHeader>
			<AccordionTrigger
				v-tooltip.left="sidebarStore.collapsed && title"
				class="accordion-trigger"
				:class="{ collapsed: sidebarStore.collapsed }"
			>
				<VBadge :dot="badge === true" bordered :value="badge" :disabled="!badge">
					<VIcon class="accordion-trigger-icon" :name="icon" />
				</VBadge>
				<span class="accordion-trigger-title">{{ title }}</span>
				<VIcon class="accordion-trigger-chevron" name="chevron_left" />
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
@use '@/styles/mixins';

.accordion-item {
	border-block: var(--theme--sidebar--section--border-width) solid var(--theme--sidebar--section--border-color);
	transition: var(--fast) var(--transition);
	transition-property: border-width, border-color;

	&:first-child {
		border-block-start: none;
	}

	&.active {
		border-width: var(--theme--sidebar--section--active--border-width);
		border-color: var(--theme--sidebar--section--active--border-color);
	}
}

.accordion-trigger {
	--focus-ring-offset: var(--focus-ring-offset-invert);
	--v-badge-offset-x: 0.875rem;
	--v-badge-offset-y: 0.25rem;
	--v-badge-border-color: var(--theme--sidebar--section--toggle--background);
	--v-badge-background-color: var(--theme--primary);
	--v-badge-color: var(--theme--background-normal);

	@include mixins.sidebar-section-trigger(
		$chevron-selector: '.accordion-trigger-chevron',
		$active-parent-selector: '.accordion-item.active'
	);

	block-size: var(--sidebar-section-trigger-height);
	inline-size: 100%;

	&.collapsed {
		padding-inline-start: calc(var(--sidebar-collapsed-width) / 2 - var(--sidebar-section-trigger-icon-size) / 2);
	}
}

.accordion-trigger-icon {
	@include mixins.sidebar-section-trigger-icon;

	--v-icon-size: var(--sidebar-section-trigger-icon-size);
}

.accordion-trigger-title {
	@include mixins.sidebar-section-trigger-title;

	transition: opacity var(--fast) var(--transition);

	.collapsed & {
		opacity: 0;
	}
}

.accordion-trigger-chevron {
	@include mixins.sidebar-section-trigger-chevron;

	transition-property: transform, opacity, color;

	.collapsed & {
		opacity: 0;
	}
}

.accordion-trigger[data-state='open'] {
	.accordion-trigger-chevron {
		transform: rotate(-90deg);
	}
}

.accordion-content {
	overflow-y: auto;

	:deep(.type-label) {
		margin-block-end: 0.25rem;
		font-size: 0.8125rem;
	}
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
	padding: 0.75rem var(--sidebar-section-content-padding) 1.75rem;
}
</style>
