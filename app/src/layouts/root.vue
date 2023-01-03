<template>
	<div class="private-view">
		<aside id="navigation" role="navigation" aria-label="Module Navigation" :class="{ 'is-open': navOpen }">
			<module-bar />
			<!-- <div ref="moduleNavEl" class="module-nav alt-colors"> -->
			<!-- <project-info /> -->

			<!-- <div class="module-nav-content">
					<slot name="navigation" />
				</div> -->

			<!-- <div
					class="module-nav-resize-handle"
					:class="{ active: handleHover }"
					@pointerenter="handleHover = true"
					@pointerleave="handleHover = false"
					@pointerdown.self="onResizeHandlePointerDown"
					@dblclick="resetModuleNavWidth"
				/> -->
			<!-- </div> -->
		</aside>
		<RouterView />
	</div>
</template>

<script>
import ModuleBar from '@/views/private/components/module-bar.vue';

export default {
	components: {
		ModuleBar,
	},
};
</script>

<style lang="scss" scoped>
.private-view {
	--content-padding: 12px;
	--content-padding-bottom: 60px;

	display: flex;
	width: 100%;
	height: 100%;
	overflow-x: hidden;
	background-color: var(--background-page);

	.nav-overlay {
		--v-overlay-z-index: 49;

		@media (min-width: 960px) {
			display: none;
		}
	}

	.sidebar-overlay {
		--v-overlay-z-index: 29;

		@media (min-width: 1260px) {
			display: none;
		}
	}

	#navigation {
		position: fixed;
		top: 0;
		left: 0;
		z-index: 50;
		display: flex;
		height: 100%;
		font-size: 0;
		transform: translateX(-100%);
		transition: transform var(--slow) var(--transition);

		&.is-open {
			transform: translateX(0);
		}

		&:not(.is-open) {
			.module-nav-resize-handle {
				display: none;
			}
		}

		.module-nav {
			position: relative;
			display: inline-block;
			width: 220px;
			height: 100%;
			font-size: 1rem;
			background-color: var(--background-normal);

			&-content {
				--v-list-item-background-color-hover: var(--background-normal-alt);
				--v-list-item-background-color-active: var(--background-normal-alt);

				height: calc(100% - 64px);
				overflow-x: hidden;
				overflow-y: auto;
			}
		}

		.module-nav-resize-handle {
			position: absolute;
			top: 0;
			right: -2px;
			bottom: 0;
			width: 4px;
			z-index: 3;
			background-color: var(--primary);
			cursor: ew-resize;
			opacity: 0;
			transition: opacity var(--fast) var(--transition);
			transition-delay: 0;
			user-select: none;
			touch-action: none;

			&:hover,
			&:active {
				opacity: 1;
			}

			&.active {
				transition-delay: var(--slow);
			}
		}

		@media (min-width: 960px) {
			position: relative;
			transform: none;

			&:not(.is-open) {
				.module-nav-resize-handle {
					display: block;
				}
			}
		}
	}

	#main-content {
		--border-radius: 6px;
		--input-height: 60px;
		--input-padding: 16px; /* (60 - 4 - 24) / 2 */

		position: relative;
		flex-grow: 1;
		width: 100%;
		height: 100%;
		overflow: auto;
		scroll-padding-top: 100px;

		/* Page Content Spacing (Could be converted to Project Setting toggle) */
		font-size: 15px;
		line-height: 24px;

		main {
			display: contents;
		}

		/* Offset for partially visible sidebar */
		@media (min-width: 960px) {
			margin-right: 60px;
		}

		@media (min-width: 1260px) {
			margin-right: 0;
		}
	}

	#sidebar {
		position: fixed;
		top: 0;
		right: 0;
		z-index: 30;
		width: 280px;
		height: 100%;
		overflow: hidden;
		background-color: var(--background-normal);
		transform: translateX(100%);
		transition: transform var(--slow) var(--transition);

		.spacer {
			flex-grow: 1;
		}

		&.is-open {
			transform: translateX(0);
		}

		.flex-container {
			display: flex;
			flex-direction: column;
			width: 280px;
			height: 100%;
		}

		@media (min-width: 960px) {
			transform: translateX(calc(100% - 60px));
		}

		@media (min-width: 1260px) {
			position: relative;
			flex-basis: 60px;
			flex-shrink: 0;
			transition: flex-basis var(--slow) var(--transition), transform var(--slow) var(--transition);

			&.is-open {
				flex-basis: 280px;
			}
		}
	}

	@media (min-width: 600px) {
		--content-padding: 32px;
		--content-padding-bottom: 132px;
	}

	&.full-screen {
		#navigation {
			position: fixed;
			transform: translateX(-100%);
			transition: none;
		}

		#main-content {
			margin: 0;
		}

		#sidebar {
			position: fixed;
			transform: translateX(100%);
			transition: none;
		}
	}
}
</style>
