<template>
	<v-dialog v-model="internalActive" :persistent="persistent" placement="right" @esc="cancelable && $emit('cancel')">
		<template #activator="{ on }">
			<slot name="activator" v-bind="{ on }" />
		</template>

		<article class="v-drawer">
			<v-button
				v-if="cancelable"
				v-tooltip.bottom="t('cancel')"
				class="cancel"
				icon
				rounded
				secondary
				@click="$emit('cancel')"
			>
				<v-icon name="close" />
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

				<main ref="mainEl" class="main">
					<header-bar
						:title="title"
						primary-action-icon="close"
						:small="smallHeader"
						:shadow="headerShadow"
						@primary="$emit('cancel')"
					>
						<template #title><slot name="title" /></template>
						<template #headline>
							<slot name="subtitle">
								<p v-if="subtitle" class="subtitle">{{ subtitle }}</p>
							</slot>
						</template>

						<template #title-outer:prepend>
							<slot name="title-outer:prepend">
								<v-button class="header-icon" rounded icon secondary disabled>
									<v-icon :name="icon" />
								</v-button>
							</slot>
						</template>

						<template #actions:prepend><slot name="actions:prepend" /></template>
						<template #actions><slot name="actions" /></template>

						<template #title:append><slot name="header:append" /></template>
					</header-bar>

					<v-detail v-if="$slots.sidebar" class="mobile-sidebar" :label="sidebarLabel">
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

<script setup lang="ts">
import { i18n } from '@/lang';
import HeaderBar from '@/views/private/components/header-bar.vue';
import { computed, provide, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import VResizeable from './v-resizeable.vue';

export interface Props {
	title: string;
	subtitle?: string | null;
	modelValue?: boolean;
	persistent?: boolean;
	icon?: string;
	sidebarResizeable?: boolean;
	sidebarLabel?: string;
	cancelable?: boolean;
	headerShadow?: boolean;
	smallHeader?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
	subtitle: null,
	modelValue: undefined,
	persistent: false,
	icon: 'box',
	sidebarLabel: i18n.global.t('sidebar'),
	cancelable: true,
	headerShadow: true,
	smallHeader: false,
});

const emit = defineEmits(['cancel', 'update:modelValue']);

const { t } = useI18n();

const localActive = ref(false);

const mainEl = ref<Element>();

provide('main-element', mainEl);

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
</script>

<style>
body {
	--v-drawer-max-width: 856px;
}
</style>

<style lang="scss" scoped>
.v-drawer {
	position: relative;
	display: flex;
	flex-direction: column;
	width: 100%;
	max-width: var(--v-drawer-max-width);
	height: 100%;
	background-color: var(--background-page);

	.cancel {
		display: none;
		position: absolute;
		top: 32px;
		left: -76px;

		@media (min-width: 960px) {
			display: inline-flex;
		}
	}

	.spacer {
		flex-grow: 1;
	}

	.header-icon {
		--v-button-background-color: var(--background-normal);
		--v-button-background-color-active: var(--background-normal);
		--v-button-background-color-hover: var(--background-normal-alt);
		--v-button-color-disabled: var(--foreground-normal);
	}

	.content {
		--border-radius: 6px;
		--input-height: 60px;
		--input-padding: 16px; /* (60 - 4 - 24) / 2 */
		--form-vertical-gap: 52px;

		position: relative;
		display: flex;
		flex-grow: 1;
		overflow: hidden;

		/* Page Content Spacing (Could be converted to Project Setting toggle) */
		font-size: 15px;
		line-height: 24px;

		.sidebar {
			--v-list-item-background-color-hover: var(--background-normal-alt);
			--v-list-item-background-color-active: var(--background-normal-alt);

			display: none;

			@media (min-width: 960px) {
				position: relative;
				display: block;
				flex-shrink: 0;
				width: 220px;
				height: 100%;
				background-color: var(--background-normal);
			}

			.sidebar-content {
				height: 100%;
				overflow-x: hidden;
				overflow-y: auto;
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
			--content-padding: 16px;
			--content-padding-bottom: 32px;

			position: relative;
			flex-grow: 1;
			overflow: auto;

			@media (min-width: 600px) {
				--content-padding: 32px;
				--content-padding-bottom: 132px;
			}
		}
	}

	@media (min-width: 960px) {
		width: calc(100% - 64px);
	}
}

.mobile-sidebar {
	position: relative;
	z-index: 2;
	margin: var(--content-padding);

	nav {
		background-color: var(--background-subdued);
		border-radius: var(--border-radius);
	}

	@media (min-width: 960px) {
		display: none;
	}
}
</style>
