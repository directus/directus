<script setup lang="ts">
import { useGroupable } from '@directus/composables';
import { useAppStore } from '@directus/stores';
import { toRefs } from 'vue';

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

const appStore = useAppStore();
const { sidebarOpen } = toRefs(appStore);

function onClick() {
	emit('toggle', !active.value);
	toggle();
}
</script>

<template>
	<div class="sidebar-detail" :class="{ open: sidebarOpen }">
		<button v-tooltip.left="!sidebarOpen && title" class="toggle" :class="{ open: active }" @click="onClick">
			<div class="icon">
				<v-badge :dot="badge === true" bordered :value="badge" :disabled="!badge">
					<v-icon :name="icon" />
				</v-badge>
			</div>
			<div v-show="sidebarOpen" class="title">
				{{ title }}
			</div>
			<div v-if="!close" class="icon">
				<v-icon class="expand-icon" :name="active ? 'expand_less' : 'expand_more'" />
			</div>
		</button>
		<div v-if="close" v-show="sidebarOpen" class="close" @click="sidebarOpen = false">
			<v-icon name="close" />
		</div>
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
		margin-bottom: 4px;
		font-size: 1rem;
	}

	.toggle {
		position: relative;
		display: flex;
		flex-shrink: 0;
		justify-content: space-between;
		width: 100%;
		height: calc(60px + var(--theme--sidebar--section--toggle--border-width));
		color: var(--theme--sidebar--section--toggle--foreground);
		background-color: var(--theme--sidebar--section--toggle--background);
		border-bottom: var(--theme--sidebar--section--toggle--border-width) solid
			var(--theme--sidebar--section--toggle--border-color);

		.icon {
			--v-icon-color: var(--theme--sidebar--section--toggle--icon--foreground);

			display: flex;
			align-items: center;
			justify-content: center;
			width: 60px;
			height: 100%;
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
		position: absolute;
		top: 0;
		right: 0;
		z-index: 50;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 60px;
		height: 60px;
		color: var(--theme--foreground);
		cursor: pointer;
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
		top: 50%;
		left: 52px;
		overflow: hidden;
		white-space: nowrap;
		transform: translateY(-50%);
		font-family: var(--theme--sidebar--section--toggle--font-family);
	}

	.scroll-container {
		overflow-x: hidden;
		overflow-y: auto;
	}

	.content {
		padding: 16px;
		border-bottom: var(--theme--sidebar--section--toggle--border-width) solid
			var(--theme--sidebar--section--toggle--border-color);

		:deep(.page-description) {
			margin-bottom: 8px;
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
