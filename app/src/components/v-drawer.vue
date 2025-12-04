<script setup lang="ts">
import VDrawerHeader from '@/components/v-drawer-header.vue';
import { translateShortcut } from '@/utils/translate-shortcut';
import { useScroll } from '@vueuse/core';
import { computed, provide, ref, useTemplateRef } from 'vue';
import { type ApplyShortcut } from './v-dialog.vue';
import VResizeable from './v-resizeable.vue';

export interface Props {
	title: string;
	subtitle?: string | null;
	modelValue?: boolean;
	persistent?: boolean;
	icon?: string;
	/**
	 * Color of the icon displayed in the drawer header.
	 */
	iconColor?: string;
	sidebarResizeable?: boolean;
	sidebarLabel?: string;
	cancelable?: boolean;
	applyShortcut?: ApplyShortcut;
}

const props = withDefaults(defineProps<Props>(), {
	subtitle: null,
	modelValue: undefined,
	persistent: false,
	icon: 'box',
	cancelable: true,
});

const emit = defineEmits(['cancel', 'apply', 'update:modelValue']);

const localActive = ref(false);

const scrollContainer = useTemplateRef('scroll-container');

provide('main-element', scrollContainer);

const sidebarWidth = 220;
// Half of the space of the drawer (856 / 2 = 428)
const sidebarMaxWidth = 428;

const internalActive = computed({
	get() {
		return props.modelValue === undefined ? localActive.value : props.modelValue;
	},
	set(newActive: boolean) {
		localActive.value = newActive;
		emit('update:modelValue', newActive);
	},
});

const { y } = useScroll(scrollContainer);

const showHeaderShadow = computed(() => y.value > 0);
</script>

<template>
	<v-dialog
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
			<v-button
				v-if="cancelable"
				v-tooltip.bottom="`${$t('cancel')} (${translateShortcut(['esc'])})`"
				class="cancel"
				icon
				rounded
				secondary
				small
				@click="$emit('cancel')"
			>
				<v-icon name="close" small />
			</v-button>

			<div class="content">
				<v-overlay v-if="$slots.sidebar" absolute />

				<v-resizeable
					v-if="$slots.sidebar"
					:disabled="!sidebarResizeable"
					:width="sidebarWidth"
					:max-width="sidebarMaxWidth"
				>
					<nav class="sidebar">
						<div class="sidebar-content">
							<slot name="sidebar" />
						</div>
					</nav>
				</v-resizeable>

				<main ref="scroll-container" :class="{ main: true, 'small-search-input': $slots.sidebar }">
					<v-drawer-header :title :shadow="showHeaderShadow" :icon :icon-color @cancel="$emit('cancel')">
						<template #title><slot name="title" /></template>
						<template #headline>
							<slot name="subtitle">
								<p v-if="subtitle" class="subtitle">{{ subtitle }}</p>
							</slot>
						</template>

						<template #title-outer:prepend>
							<slot name="title-outer:prepend" />
						</template>

						<template #actions:prepend><slot name="actions:prepend" /></template>
						<template #actions><slot name="actions" /></template>

						<template #title:append><slot name="header:append" /></template>
					</v-drawer-header>

					<v-detail v-if="$slots.sidebar" class="mobile-sidebar" :label="sidebarLabel || $t('sidebar')">
						<nav>
							<slot name="sidebar" />
						</nav>
					</v-detail>

					<slot />
				</main>
			</div>
		</article>
	</v-dialog>
</template>

<style lang="scss" scoped>
.v-drawer {
	position: relative;
	display: flex;
	flex-direction: column;
	inline-size: 100%;
	max-inline-size: 856px;
	block-size: 100%;
	background-color: var(--theme--background);

	.cancel {
		--focus-ring-color: var(--theme--primary-subdued);

		display: none;
		position: absolute;
		inset-block-start: 22px;
		inset-inline-start: -56px;

		@media (min-width: 960px) {
			display: inline-flex;
		}
	}

	.spacer {
		flex-grow: 1;
	}

	.header-icon {
		--v-button-background-color: var(--theme--background-normal);
		--v-button-background-color-active: var(--theme--background-normal);
		--v-button-background-color-hover: var(--theme--background-normal);
		--v-button-color-disabled: var(--theme--foreground);
	}

	.content {
		--theme--form--row-gap: 52px;

		container-type: size;
		position: relative;
		display: flex;
		flex-grow: 1;
		overflow: hidden;

		/* Page Content Spacing (Could be converted to Project Setting toggle) */
		font-size: 15px;
		line-height: 24px;

		.sidebar {
			--v-list-item-background-color-hover: var(--theme--background-accent);
			--v-list-item-background-color-active: var(--theme--background-accent);

			display: none;

			@media (min-width: 960px) {
				position: relative;
				display: block;
				flex-shrink: 0;
				inline-size: 220px;
				block-size: 100%;
				background: var(--theme--navigation--background);
				border-inline-end: var(--theme--navigation--border-width) solid var(--theme--navigation--border-color);
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

		.v-overlay {
			--v-overlay-z-index: 1;

			@media (min-width: 960px) {
				--v-overlay-z-index: none;

				display: none;
			}
		}

		.main {
			--content-padding: 20px;
			--content-padding-bottom: 32px;

			position: relative;
			flex-grow: 1;
			overflow: auto;
			scroll-padding-block-start: 100px;

			@media (width > 640px) {
				--content-padding-bottom: 132px;
			}
		}

		.main.small-search-input:deep(.search-input.filter-active) {
			inline-size: 300px !important;
		}
	}

	@media (min-width: 960px) {
		inline-size: calc(100% - 64px);
	}
}

.mobile-sidebar {
	position: relative;
	z-index: 2;
	margin: var(--content-padding);

	nav {
		background-color: var(--theme--background-subdued);
		border-radius: var(--theme--border-radius);
	}

	@media (min-width: 960px) {
		display: none;
	}
}
</style>
