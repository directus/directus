<template>
	<v-dialog :active="active" @toggle="$emit('toggle', $event)" :persistent="persistent">
		<template #activator="{ on }">
			<slot name="activator" v-bind="{ on }" />
		</template>

		<article class="v-modal">
			<header class="header">
				<v-icon class="menu-toggle" name="menu" @click="sidebarActive = !sidebarActive" />
				<h2 class="title">{{ title }}</h2>
				<p v-if="subtitle" class="subtitle">{{ subtitle }}</p>
				<div class="spacer" />
				<v-icon name="" />
			</header>
			<div class="content">
				<v-overlay
					v-if="$slots.sidebar"
					absolute
					:active="sidebarActive"
					@click="sidebarActive = false"
				/>
				<nav
					v-if="$slots.sidebar"
					class="sidebar"
					:class="{ active: sidebarActive }"
					@click="sidebarActive = false"
				>
					<slot name="sidebar" />
				</nav>
				<main class="main">
					<slot />
				</main>
			</div>
			<footer class="footer" v-if="$slots.footer">
				<slot name="footer" v-bind="{ close: () => $emit('toggle', false) }" />
			</footer>
		</article>
	</v-dialog>
</template>

<script lang="ts">
import { defineComponent, ref } from '@vue/composition-api';

export default defineComponent({
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
			default: true,
		},
		persistent: {
			type: Boolean,
			default: false,
		},
	},
	setup() {
		const sidebarActive = ref(false);

		return { sidebarActive };
	},
});
</script>

<style lang="scss" scoped>
@import '@/styles/mixins/breakpoint';

.v-modal {
	display: flex;
	flex-direction: column;
	width: calc(100% - 16px);
	max-width: 916px;
	height: calc(100% - 16px);
	max-height: 760px;
	background-color: var(--background-page);
	border-radius: 4px;

	.spacer {
		flex-grow: 1;
	}

	.header {
		display: flex;
		flex-shrink: 0;
		align-items: center;
		height: 60px;
		padding: 0 16px;
		border-bottom: 2px solid var(--background-normal);

		.title {
			margin-right: 12px;
			font-size: 16px;
		}

		.subtitle {
			color: var(--foreground-subdued);
		}

		.menu-toggle {
			margin-right: 8px;

			@include breakpoint(medium) {
				display: none;
			}
		}

		@include breakpoint(medium) {
			padding: 0 24px;
		}
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
				transform: translateX(0);
			}
		}

		.v-overlay {
			--v-overlay-z-index: none;

			@include breakpoint(medium) {
				display: none;
			}
		}

		.main {
			flex-grow: 1;
			padding: 8px 16px;
			overflow: auto;

			@include breakpoint(medium) {
				padding: 32px;
			}
		}
	}

	.footer {
		display: flex;
		flex-shrink: 0;
		align-items: center;
		justify-content: flex-end;
		height: 60px;
		padding: 0 16px;
		border-top: 2px solid var(--background-normal);

		::v-deep > *:not(:last-child) {
			margin-right: 8px;
		}

		@include breakpoint(medium) {
			padding: 0 24px;
		}
	}

	@include breakpoint(medium) {
		width: calc(100% - 64px);
		height: calc(100% - 64px);
	}
}
</style>
