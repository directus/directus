<template>
	<header class="header-bar" ref="headerEl" :class="{ collapsed: collapsed }">
		<v-button secondary class="nav-toggle" icon rounded @click="$emit('primary')" v-if="$listeners.primary">
			<v-icon :name="primaryActionIcon" />
		</v-button>

		<div class="title-outer-prepend" v-if="$scopedSlots['title-outer:prepend']">
			<slot name="title-outer:prepend" />
		</div>

		<div class="title-container" :class="{ full: !$scopedSlots['title-outer:append'] }">
			<div class="headline">
				<slot name="headline" />
			</div>

			<div class="title">
				<slot name="title">
					<slot name="title:prepend" />
					<h1 class="type-title">{{ title }}</h1>
					<slot name="title:append" />
				</slot>
			</div>

			<slot name="title-outer:append" />
		</div>

		<div class="spacer" />

		<slot name="actions:prepend" />

		<header-bar-actions :show-sidebar-toggle="showSidebarToggle" @toggle:sidebar="$emit('toggle:sidebar')">
			<slot name="actions" />
		</header-bar-actions>

		<slot name="actions:append" />
	</header>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, onUnmounted } from '@vue/composition-api';
import HeaderBarActions from '../header-bar-actions';

export default defineComponent({
	components: { HeaderBarActions },
	props: {
		title: {
			type: String,
			default: null,
		},
		showSidebarToggle: {
			type: Boolean,
			default: false,
		},
		primaryActionIcon: {
			type: String,
			default: 'menu',
		},
	},
	setup() {
		const headerEl = ref<Element>();

		const collapsed = ref(false);

		const observer = new IntersectionObserver(
			([e]) => {
				collapsed.value = e.boundingClientRect.y === -1;
			},
			{ threshold: [1] }
		);

		onMounted(() => {
			observer.observe(headerEl.value as HTMLElement);
		});

		onUnmounted(() => {
			observer.disconnect();
		});

		return { headerEl, collapsed };
	},
});
</script>

<style lang="scss" scoped>
@import '@/styles/mixins/breakpoint';

.header-bar {
	position: sticky;
	top: -1px;
	left: 0;
	z-index: 5;
	display: flex;
	align-items: center;
	justify-content: flex-start;
	width: 100%;
	height: 65px;
	margin: 0;
	padding: 0 12px;
	background-color: var(--background-page);
	box-shadow: 0;
	transition: box-shadow var(--medium) var(--transition);

	.nav-toggle {
		@include breakpoint(medium) {
			display: none;
		}
	}

	.title-outer-prepend {
		display: none;

		@include breakpoint(medium) {
			display: block;
		}
	}

	.title-container {
		position: relative;
		display: flex;
		align-items: center;
		width: 100%;
		max-width: calc(100% - 12px - 44px - 120px - 12px - 8px);
		height: 100%;
		margin-left: 16px;
		overflow: hidden;

		@include breakpoint(small) {
			max-width: 70%;
		}

		&.full {
			margin-right: 12px;
			padding-right: 0;

			@include breakpoint(small) {
				margin-right: 20px;
				padding-right: 20px;
			}
		}

		.headline {
			position: absolute;
			top: 2px;
			left: 0;
			color: var(--foreground-subdued);
			white-space: nowrap;
			opacity: 1;
			transition: opacity var(--fast) var(--transition);

			@include breakpoint(small) {
				top: -2px;
			}
		}

		.title {
			position: relative;
			display: flex;
			align-items: center;
			overflow: hidden;

			.type-title {
				flex-grow: 1;
				width: 100%;
				overflow: hidden;
				white-space: nowrap;
				text-overflow: ellipsis;
			}
		}
	}

	&.collapsed {
		box-shadow: 0 4px 7px -4px rgba(0, 0, 0, 0.2);

		.title-container {
			.headline {
				opacity: 0;
				pointer-events: none;
			}
		}
	}

	.spacer {
		flex-grow: 1;
	}

	.sidebar-toggle {
		flex-shrink: 0;
		margin-left: 8px;

		@include breakpoint(medium) {
			display: none;
		}
	}

	@include breakpoint(small) {
		margin: 24px 0;
		padding: 0 32px;
	}
}
</style>
