<script setup lang="ts">
import { computed, provide, ref, useTemplateRef } from 'vue';
import { type ApplyShortcut } from './v-dialog.vue';
import VDetail from '@/components/v-detail.vue';
import VDialog from '@/components/v-dialog.vue';
import VDrawerHeader from '@/components/v-drawer-header.vue';
import VOverlay from '@/components/v-overlay.vue';

export interface Props {
	title: string;
	modelValue?: boolean;
	persistent?: boolean;
	icon?: string;
	/**
	 * Color of the icon displayed in the drawer header.
	 */
	iconColor?: string;
	sidebarLabel?: string;
	cancelable?: boolean;
	applyShortcut?: ApplyShortcut;
}

const props = withDefaults(defineProps<Props>(), {
	modelValue: undefined,
	persistent: false,
	icon: 'box',
	cancelable: true,
});

const emit = defineEmits(['cancel', 'apply', 'update:modelValue']);

const localActive = ref(false);

const mobileSidebarOpen = ref(false);

const scrollContainer = useTemplateRef('scroll-container');

provide('main-element', scrollContainer);

const internalActive = computed({
	get() {
		return props.modelValue === undefined ? localActive.value : props.modelValue;
	},
	set(newActive: boolean) {
		localActive.value = newActive;
		emit('update:modelValue', newActive);
	},
});
</script>

<template>
	<VDialog
		v-model="internalActive"
		:persistent="persistent"
		placement="right"
		:apply-shortcut
		@apply="$emit('apply')"
		@esc="cancelable && $emit('cancel')"
	>
		<template #activator="{ on }">
			<slot name="activator" v-bind="{ on }" />
		</template>

		<article class="v-drawer">
			<VDrawerHeader :title :icon :icon-color :has-sidebar="!!$slots.sidebar" :cancelable @cancel="$emit('cancel')">
				<template #title-outer:prepend>
					<slot name="title-outer:prepend" />
				</template>
				<template #title><slot name="title" /></template>
				<template #title-outer:append>
					<slot name="title-outer:append" />
				</template>

				<template #actions:prepend><slot name="actions:prepend" /></template>
				<template #actions><slot name="actions" /></template>
				<template #actions:primary><slot name="actions:primary" /></template>
			</VDrawerHeader>

			<div v-if="$slots.sidebar" class="mobile-sidebar">
				<VDetail v-model="mobileSidebarOpen" :label="sidebarLabel || $t('sidebar')">
					<nav class="sidebar-content" @click="mobileSidebarOpen = false">
						<slot name="sidebar" />
					</nav>
				</VDetail>
			</div>

			<div class="content">
				<nav v-if="$slots.sidebar" class="sidebar">
					<div class="sidebar-content">
						<slot name="sidebar" />
					</div>
				</nav>

				<main
					ref="scroll-container"
					class="main"
					:class="{ 'has-sidebar': $slots.sidebar, 'sidebar-open': mobileSidebarOpen }"
				>
					<slot />
				</main>

				<VOverlay
					v-if="$slots.sidebar"
					absolute
					:active="mobileSidebarOpen"
					class="mobile-sidebar-overlay"
					@click="mobileSidebarOpen = false"
				/>
			</div>
		</article>
	</VDialog>
</template>

<style lang="scss" scoped>
@use '@/styles/mixins';

.v-drawer {
	position: relative;
	display: flex;
	flex-direction: column;
	inline-size: 100%;
	max-inline-size: calc(var(--content-padding) * 2 + var(--form-column-max-width) * 2 + var(--theme--form--column-gap));
	block-size: 100%;
	background-color: var(--theme--shell--background);

	@include mixins.breakpoint-up('lg') {
		inline-size: calc(100% - 3.625rem);
	}

	.header-icon {
		--v-button-background-color: var(--theme--background-normal);
		--v-button-background-color-active: var(--theme--background-normal);
		--v-button-background-color-hover: var(--theme--background-normal);
		--v-button-color-disabled: var(--theme--foreground);
	}

	.content {
		container-type: size;
		position: relative;
		display: flex;
		flex-grow: 1;
		overflow: hidden;

		/* Page Content Spacing (Could be converted to Project Setting toggle) */
		font-size: 0.875rem;
		line-height: 1.5714;

		.sidebar {
			--v-list-item-background-color-hover: var(--theme--background-accent);
			--v-list-item-background-color-active: var(--theme--background-accent);

			display: none;

			@include mixins.breakpoint-up('lg') {
				position: relative;
				display: block;
				flex-shrink: 0;
				inline-size: 12.375rem;
				block-size: 100%;

				/* background is set on .v-drawer, border is set on .main */
			}

			.sidebar-content {
				--v-list-item-color: var(--theme--navigation--list--foreground);
				--v-list-item-color-hover: var(--theme--navigation--list--foreground-hover);
				--v-list-item-color-active: var(--theme--navigation--list--foreground-active);
				--v-list-item-icon-color: var(--theme--navigation--list--icon--foreground);
				--v-list-item-icon-color-hover: var(--theme--navigation--list--icon--foreground-hover);
				--v-list-item-icon-color-active: var(--theme--navigation--list--icon--foreground-active);
				--v-list-item-background-color: var(--theme--navigation--list--background);
				--v-list-item-background-color-hover: var(--theme--navigation--list--background-hover);
				--v-list-item-background-color-active: var(--theme--navigation--list--background-active);
				--v-divider-color: var(--theme--navigation--list--divider--border-color);
				--v-divider-thickness: var(--theme--navigation--list--divider--border-width);

				block-size: 100%;
				overflow: hidden auto;
			}
		}

		.main {
			position: relative;
			flex-grow: 1;
			overflow: auto;
			scroll-padding-block-start: 5.625rem;
			background-color: var(--theme--background);
			border-block-start: var(--theme--shell--border-width) solid var(--theme--shell--border-color);

			&.has-sidebar {
				@include mixins.breakpoint-up('lg') {
					border-inline-start: var(--theme--shell--border-width) solid var(--theme--shell--border-color);
					border-start-start-radius: var(--theme--border-radius);
				}
			}

			&.sidebar-open {
				@include mixins.breakpoint-down('lg') {
					border-color: transparent;
				}
			}
		}
	}
}

.mobile-sidebar {
	display: none;
	padding-inline: var(--content-padding);
	padding-block: 0.625rem;
	background-color: var(--theme--shell--background);

	@include mixins.breakpoint-up('sm') {
		padding-inline: calc(var(--content-padding) - 1.5rem);
	}

	@include mixins.breakpoint-down('lg') {
		display: block;
	}

	.sidebar-content :deep(.v-list) {
		--v-list-padding: 0;
	}
}

.mobile-sidebar-overlay {
	--v-overlay-color: color-mix(in srgb, var(--overlay-color) 85%, transparent);

	@include mixins.breakpoint-up('lg') {
		display: none;
	}
}
</style>
