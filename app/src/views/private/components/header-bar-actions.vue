<template>
	<div class="actions" :class="{ active }">
		<v-button class="expand" icon rounded secondary outlined @click="active = !active">
			<v-icon name="arrow_left" />
		</v-button>

		<div class="action-buttons">
			<v-button
				v-if="showSidebarToggle"
				class="sidebar-toggle"
				icon
				rounded
				secondary
				outlined
				@click="$emit('toggle:sidebar')"
			>
				<v-icon name="info" />
			</v-button>

			<slot />
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

defineProps<{
	showSidebarToggle?: boolean;
}>();

defineEmits<{
	(e: 'toggle:sidebar'): void;
}>();

const active = ref(false);
</script>

<style scoped>
.actions {
	position: relative;
	display: flex;
	background-color: transparent;
}

.actions .gradient-wrapper {
	display: contents;
}

.actions .expand {
	--v-icon-color: var(--foreground-normal);

	flex-shrink: 0;
	margin-right: 8px;
}

@media (min-width: 960px) {
	.actions .expand {
		display: none;
	}
}

.actions .action-buttons {
	display: flex;
	flex-shrink: 0;
}

.actions .action-buttons .v-button.secondary {
	--v-icon-color: var(--foreground-normal);
}

.actions .action-buttons > :deep(*:not(:last-child)) {
	display: none;
	margin-right: 8px;
}

.actions .action-buttons .sidebar-toggle {
	flex-shrink: 0;
}

@media (min-width: 960px) {
	.actions .action-buttons .sidebar-toggle {
		display: none !important;
	}
}

.actions.active {
	position: absolute;
	top: 0;
	right: 0;
	align-items: center;
	justify-content: flex-end;
	height: 100%;
	padding: inherit;
	padding-left: 8px;
	background-color: var(--background-page);
}

.actions.active .expand {
	transform: rotate(180deg);
}

.actions.active .action-buttons > :deep(*) {
	display: inherit;
}

@media (min-width: 960px) {
	.actions .action-buttons > :deep(*:not(.sidebar-toggle)) {
		display: inherit !important;
	}
}
</style>
