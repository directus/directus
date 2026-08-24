<script setup lang="ts">
import { useBreakpoints } from '@vueuse/core';
import { computed, provide, ref, useId, useTemplateRef } from 'vue';
import { type ApplyShortcut } from './v-dialog.vue';
import VDetail from '@/components/v-detail.vue';
import VDialog from '@/components/v-dialog.vue';
import VDrawerHeader from '@/components/v-drawer-header.vue';
import VOverlay from '@/components/v-overlay.vue';
import { BREAKPOINTS } from '@/constants';

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
	/** @deprecated Use the `title` prop instead */
	subtitle?: string | null;
}

defineSlots<{
	activator(props: { on: () => void }): any;
	'title-outer:prepend'(): any;
	title(): any;
	'title-outer:append'(): any;
	'actions:prepend'(): any;
	actions(): any;
	'actions:primary'(): any;
	sidebar(): any;
	default(): any;
	/** @deprecated Use the default `actions` slot for secondary actions, or `actions:primary` for primary CTAs. */
	'actions:append'(): any;
	/** @deprecated The `subtitle` slot is deprecated. */
	subtitle(): any;
	/** @deprecated The `header:append` slot is deprecated. */
	'header:append'(): any;
}>();

const props = withDefaults(defineProps<Props>(), {
	modelValue: undefined,
	persistent: false,
	icon: 'box',
	cancelable: true,
});

const emit = defineEmits(['cancel', 'apply', 'update:modelValue']);

const localActive = ref(false);

const { mobileSidebarOpen, mobileOutletId, desktopOutletId, teleportTarget } = useSidebar();

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

function useSidebar() {
	const mobileSidebarOpen = ref(false);
	const breakpoints = useBreakpoints(BREAKPOINTS);
	const isMobile = breakpoints.smallerOrEqual('lg');
	const sidebarId = useId();
	const mobileOutletId = `v-drawer-sidebar-mobile-${sidebarId}`;
	const desktopOutletId = `v-drawer-sidebar-desktop-${sidebarId}`;

	const teleportTarget = computed(() =>
		isMobile.value && mobileSidebarOpen.value ? `#${mobileOutletId}` : `#${desktopOutletId}`,
	);

	return {
		mobileSidebarOpen,
		mobileOutletId,
		desktopOutletId,
		teleportTarget,
	};
}
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

				<template v-if="!!$slots.subtitle || subtitle" #title:prepend>
					<slot name="subtitle">{{ subtitle }}</slot>
				</template>
				<template #title><slot name="title" /></template>
				<template v-if="!!$slots['header:append']" #title:append>
					<slot name="header:append" />
				</template>

				<template #title-outer:append>
					<slot name="title-outer:append" />
				</template>

				<template #actions:prepend><slot name="actions:prepend" /></template>
				<template #actions>
					<slot name="actions" />
					<slot name="actions:append" />
				</template>
				<template #actions:primary><slot name="actions:primary" /></template>
			</VDrawerHeader>

			<div v-if="$slots.sidebar" class="mobile-sidebar">
				<VDetail v-model="mobileSidebarOpen" :label="sidebarLabel || $t('sidebar')">
					<nav class="sidebar-content" @click="mobileSidebarOpen = false">
						<div :id="mobileOutletId" />
					</nav>
				</VDetail>
			</div>

			<Teleport v-if="$slots.sidebar" defer :to="teleportTarget">
				<slot name="sidebar" />
			</Teleport>

			<div class="content">
				<nav v-if="$slots.sidebar" class="sidebar">
					<div :id="desktopOutletId" class="sidebar-content" />
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
