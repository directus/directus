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
				<v-overlay v-if="$slots.sidebar" absolute :active="sidebarActive" @click="sidebarActive = false" />
				<nav
					v-if="$slots.sidebar"
					class="sidebar"
					:class="{ active: sidebarActive }"
					@click="sidebarActive = false"
				>
					<slot name="sidebar" />
				</nav>
				<main ref="mainEl" class="main">
					<header-bar :title="title">
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

					<slot />
				</main>
			</div>
		</article>
	</v-dialog>
</template>

<script lang="ts">
import { defineComponent, ref, computed, provide } from '@vue/composition-api';
import HeaderBar from '@/views/private/components/header-bar/header-bar.vue';

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
	},
	setup(props, { emit, listeners }) {
		const sidebarActive = ref(false);
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

		return { sidebarActive, _active, mainEl, showCancel };
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
		position: relative;
		display: flex;
		flex-grow: 1;
		overflow: hidden;

		.sidebar {
			position: absolute;
			top: 0;
			left: 0;
			z-index: 2;
			flex-basis: 220px;
			flex-shrink: 0;
			width: 220px;
			height: 100%;
			background-color: var(--background-normal);
			transform: translateX(-100%);
			transition: transform var(--slow) var(--transition-out);

			&.active {
				transform: translateX(0);
				transition-timing-function: var(--transition-in);
			}

			@include breakpoint(medium) {
				position: relative;
				height: auto;
				transform: translateX(0);
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

			@include breakpoint(medium) {
				--content-padding: 32px;
			}
		}
	}

	@include breakpoint(medium) {
		width: calc(100% - 64px);
	}
}
</style>
