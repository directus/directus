<template>
	<v-dialog v-model="_active" @esc="$emit('cancel')" :persistent="persistent" placement="right">
		<template #activator="{ on }">
			<slot name="activator" v-bind="{ on }" />
		</template>

		<article class="v-drawer">
			<v-button
				v-if="showCancel"
				class="cancel"
				@click="$emit('cancel')"
				icon
				rounded
				secondary
				v-tooltip.bottom="$t('cancel')"
			>
				<v-icon name="close" />
			</v-button>

			<div class="content">
				<v-overlay v-if="$slots.sidebar" absolute @click="sidebarActive = false" />
				<nav v-if="$slots.sidebar" class="sidebar">
					<slot name="sidebar" />
				</nav>
				<main ref="mainEl" class="main">
					<header-bar :title="title" @primary="$emit('cancel')" primary-action-icon="close">
						<template #title><slot name="title" /></template>
						<template #headline>
							<slot name="subtitle">
								<p v-if="subtitle" class="subtitle">{{ subtitle }}</p>
							</slot>
						</template>

						<template #title-outer:prepend>
							<v-button class="header-icon" rounded icon secondary disabled>
								<v-icon :name="icon" />
							</v-button>
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

<script lang="ts">
import { defineComponent, ref, computed, provide } from '@vue/composition-api';
import HeaderBar from '@/views/private/components/header-bar/header-bar.vue';
import i18n from '@/lang';

export default defineComponent({
	components: {
		HeaderBar,
	},
	model: {
		prop: 'active',
		event: 'toggle',
	},
	props: {
		title: {
			type: String,
			required: true,
		},
		subtitle: {
			type: String,
			default: null,
		},
		active: {
			type: Boolean,
			default: undefined,
		},
		persistent: {
			type: Boolean,
			default: false,
		},
		icon: {
			type: String,
			default: 'box',
		},
		sidebarLabel: {
			type: String,
			default: i18n.t('sidebar'),
		},
	},
	setup(props, { emit, listeners }) {
		const localActive = ref(false);

		const mainEl = ref<Element>();

		provide('main-element', mainEl);

		const _active = computed({
			get() {
				return props.active === undefined ? localActive.value : props.active;
			},
			set(newActive: boolean) {
				localActive.value = newActive;
				emit('toggle', newActive);
			},
		});

		const showCancel = computed(() => {
			return listeners.hasOwnProperty('cancel');
		});

		return { _active, mainEl, showCancel };
	},
});
</script>

<style>
body {
	--v-drawer-max-width: 856px;
}
</style>

<style lang="scss" scoped>
@import '@/styles/mixins/breakpoint';

.v-drawer {
	position: relative;
	display: flex;
	flex-direction: column;
	width: 100%;
	max-width: var(--v-drawer-max-width);
	height: 100%;
	background-color: var(--background-page);

	.cancel {
		position: absolute;
		top: 32px;
		left: -76px;
	}

	.spacer {
		flex-grow: 1;
	}

	.header-icon {
		--v-button-background-color: var(--background-normal);
		--v-button-background-color-activated: var(--background-normal);
		--v-button-background-color-hover: var(--background-normal-alt);
		--v-button-color-disabled: var(--foreground-normal);
	}

	.content {
		--border-radius: 6px;
		--input-height: 60px;
		--input-padding: 16px; // (60 - 4 - 24) / 2
		--form-vertical-gap: 52px;

		position: relative;
		display: flex;
		flex-grow: 1;
		overflow: hidden;

		// Page Content Spacing (Could be converted to Project Setting toggle)
		font-size: 15px;
		line-height: 24px;

		.sidebar {
			--v-list-item-background-color-hover: var(--background-normal-alt);
			--v-list-item-background-color-active: var(--background-normal-alt);

			display: none;

			@include breakpoint(medium) {
				position: relative;
				z-index: 2;
				display: block;
				flex-basis: 220px;
				flex-shrink: 0;
				width: 220px;
				height: 100%;
				height: auto;
				background-color: var(--background-normal);
			}
		}

		.v-overlay {
			--v-overlay-z-index: 1;

			@include breakpoint(medium) {
				--v-overlay-z-index: none;

				display: none;
			}
		}

		.main {
			--content-padding: 16px;
			--content-padding-bottom: 32px;

			flex-grow: 1;
			overflow: auto;

			@include breakpoint(small) {
				--content-padding: 32px;
				--content-padding-bottom: 132px;
			}
		}
	}

	@include breakpoint(medium) {
		width: calc(100% - 64px);
	}
}

.mobile-sidebar {
	margin: var(--content-padding);

	nav {
		background-color: var(--background-subdued);
		border-radius: var(--border-radius);
	}

	@include breakpoint(medium) {
		display: none;
	}
}
</style>
