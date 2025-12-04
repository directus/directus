<script setup lang="ts">
import VBadge from '@/components/v-badge.vue';
import VIcon from '@/components/v-icon/v-icon.vue';
import { AccordionContent, AccordionHeader, AccordionItem, AccordionTrigger } from 'reka-ui';
import { watch } from 'vue';
import { useSidebarStore } from '../private-view/stores/sidebar';

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
	<AccordionItem class="accordion-item" :value="id">
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
.accordion-item {
	display: contents;

	:deep(.type-label) {
		margin-block-end: 4px;
		font-size: 1rem;
	}
}

.accordion-trigger {
	--focus-ring-offset: var(--focus-ring-offset-invert);
	--v-badge-offset-x: 15px;
	--v-badge-offset-y: 4px;
	--v-badge-border-color: var(--theme--sidebar--section--toggle--background);
	--v-badge-background-color: var(--theme--primary);
	--v-badge-color: var(--theme--background-normal);

	display: flex;
	align-items: center;
	block-size: calc(60px + var(--theme--sidebar--section--toggle--border-width));
	inline-size: 100%;
	background-color: var(--theme--sidebar--section--toggle--background);
	border-block-end: var(--theme--sidebar--section--toggle--border-width) solid
		var(--theme--sidebar--section--toggle--border-color);
	color: var(--theme--sidebar--section--toggle--foreground);
	padding-inline: 18px 9px;
}

.accordion-trigger-icon {
	margin-inline-end: 12px;
}

.accordion-trigger-title {
	flex-grow: 1;
	text-align: start;
	transition: opacity var(--fast) var(--transition);

	.collapsed & {
		opacity: 0;
	}
}

.accordion-trigger-chevron {
	color: var(--theme--foreground-subdued);
	transform: rotate(0deg);
	transition: var(--fast) var(--transition);
	transition-property: transform, opacity;

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
