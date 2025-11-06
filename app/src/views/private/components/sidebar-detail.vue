<script setup lang="ts">
import { useGroupable } from '@directus/composables';
import { useSidebarStore } from '../private-view/stores/sidebar';

const props = defineProps<{
	icon: string;
	title: string;
	badge?: boolean | string | number;
	close?: boolean;
}>();

const emit = defineEmits<{
	toggle: [open: boolean];
}>();

const { active, toggle } = useGroupable({
	value: props.title,
	group: 'sidebar-detail',
});

const sidebarStore = useSidebarStore();

function onClick() {
	emit('toggle', !active.value);
	sidebarStore.expand();
	toggle();
}
</script>

<template>
	<div class="sidebar-detail" :class="{ open: !sidebarStore.collapsed }">
		<button v-if="close" v-show="!sidebarStore.collapsed" class="close" @click="sidebarStore.collapse">
			<v-icon name="close" />
		</button>
		<button v-tooltip.left="sidebarStore.collapsed && title" class="toggle" :class="{ open: active }" @click="onClick">
			<div class="icon">
				<v-badge :dot="badge === true" bordered :value="badge" :disabled="!badge">
					<v-icon :name="icon" />
				</v-badge>
			</div>
			<div v-show="!sidebarStore.collapsed" class="title">
				{{ title }}
			</div>
			<div v-if="!close" class="icon">
				<v-icon class="expand-icon" :name="active ? 'expand_less' : 'expand_more'" />
			</div>
		</button>
		<transition-expand class="scroll-container">
			<div v-show="active">
				<div class="content">
					<slot />
				</div>
			</div>
		</transition-expand>
	</div>
</template>

<style lang="scss" scoped>
.sidebar-detail {
	--v-badge-offset-x: 3px;
	--v-badge-offset-y: 4px;
	--v-badge-border-color: var(--theme--sidebar--section--toggle--background);
	--v-badge-background-color: var(--theme--primary);
	--v-badge-color: var(--theme--background-normal);

	display: contents;

	:deep(.type-label) {
		margin-block-end: 4px;
		font-size: 1rem;
	}

	.toggle {
		--focus-ring-offset: var(--focus-ring-offset-inset);

		position: relative;
		display: flex;
		flex-shrink: 0;
		justify-content: space-between;
		inline-size: 100%;
		block-size: calc(60px + var(--theme--sidebar--section--toggle--border-width));
		color: var(--theme--sidebar--section--toggle--foreground);
		background-color: var(--theme--sidebar--section--toggle--background);
		border-block-end: var(--theme--sidebar--section--toggle--border-width) solid
			var(--theme--sidebar--section--toggle--border-color);

		.icon {
			--v-icon-color: var(--theme--sidebar--section--toggle--icon--foreground);

			display: flex;
			align-items: center;
			justify-content: center;
			inline-size: 60px;
			block-size: 100%;
		}

		&:hover {
			color: var(--theme--sidebar--section--toggle--foreground-hover);
			background-color: var(--theme--sidebar--section--toggle--background-hover);

			.icon {
				--v-icon-color: var(--theme--sidebar--section--toggle--icon--foreground-hover);
			}
		}

		&.open {
			color: var(--theme--sidebar--section--toggle--foreground-active);
			background-color: var(--theme--sidebar--section--toggle--background-active);

			.icon {
				--v-icon-color: var(--theme--sidebar--section--toggle--icon--foreground-active);
			}
		}
	}

	.close {
		--focus-ring-offset: var(--focus-ring-offset-inset);

		position: absolute;
		inset-block-start: 0;
		inset-inline-end: 0;
		z-index: 50;
		display: flex;
		align-items: center;
		justify-content: center;
		inline-size: 60px;
		block-size: 60px;
		color: var(--theme--foreground);
		transition:
			opacity var(--fast) var(--transition),
			color var(--fast) var(--transition);

		.v-icon {
			pointer-events: none;
		}

		&:hover {
			color: var(--sidebar-detail-color-active);
		}
	}

	&.open {
		.toggle {
			.close {
				opacity: 1;
				pointer-events: auto;
			}
		}
	}

	.title {
		position: absolute;
		inset-block-start: 50%;
		inset-inline-start: 52px;
		overflow: hidden;
		white-space: nowrap;
		transform: translateY(-50%);
		font-family: var(--theme--sidebar--section--toggle--font-family);
	}

	.scroll-container {
		overflow: hidden auto;
	}

	.content {
		padding: 12px;
		border-block-end: var(--theme--sidebar--section--toggle--border-width) solid
			var(--theme--sidebar--section--toggle--border-color);

		:deep(.page-description) {
			margin-block-end: 8px;
			color: var(--theme--sidebar--foreground);
		}

		:deep(.page-description a) {
			color: var(--theme--primary);
		}
	}

	.expand-icon {
		color: var(--theme--foreground-subdued);
	}
}
</style>
