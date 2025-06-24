<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import HeaderBarActions from './header-bar-actions.vue';

withDefaults(
	defineProps<{
		title?: string;
		showSidebarToggle?: boolean;
		primaryActionIcon?: string;
		small?: boolean;
		shadow?: boolean;
	}>(),
	{
		primaryActionIcon: 'menu',
		shadow: true,
	},
);

defineEmits<{
	(e: 'primary'): void;
	(e: 'toggle:sidebar'): void;
}>();

const headerEl = ref<Element>();

const collapsed = ref(false);

const observer = new IntersectionObserver(
	([e]) => {
		if (!e) return;
		collapsed.value = e.boundingClientRect.y < 0;
	},
	{ threshold: [1] },
);

onMounted(() => {
	observer.observe(headerEl.value as HTMLElement);
});

onUnmounted(() => {
	observer.disconnect();
});
</script>

<template>
	<header ref="headerEl" class="header-bar" :class="{ collapsed, small, shadow }">
		<v-button secondary class="nav-toggle" icon rounded @click="$emit('primary')">
			<v-icon :name="primaryActionIcon" />
		</v-button>

		<div v-if="$slots['title-outer:prepend']" class="title-outer-prepend">
			<slot name="title-outer:prepend" />
		</div>

		<div class="title-container" :class="{ full: !$slots['title-outer:append'] }">
			<div class="headline">
				<slot name="headline" />
			</div>

			<div class="title">
				<slot name="title">
					<slot name="title:prepend" />
					<h1 class="type-title">
						<v-text-overflow :text="title" placement="bottom">{{ title }}</v-text-overflow>
					</h1>
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

<style lang="scss" scoped>
.header-bar {
	position: sticky;
	inset-block-start: -1px;
	inset-inline-start: 0;
	z-index: 5;
	display: flex;
	align-items: center;
	justify-content: flex-start;
	inline-size: 100%;
	block-size: calc(var(--header-bar-height) + var(--theme--header--border-width));
	margin: 0;
	padding: 0 10px;
	background-color: var(--theme--header--background);
	box-shadow: none;
	transition:
		box-shadow var(--medium) var(--transition),
		margin var(--fast) var(--transition);
	border-block-end: var(--theme--header--border-width) solid var(--theme--header--border-color);

	.nav-toggle {
		@media (min-width: 960px) {
			display: none;
		}
	}

	.title-outer-prepend {
		display: none;

		@media (min-width: 960px) {
			display: block;
		}
	}

	.title-container {
		position: relative;
		display: flex;
		align-items: center;
		gap: 16px;
		inline-size: 100%;
		max-inline-size: calc(100% - 12px - 44px - 120px - 12px - 8px);
		block-size: 100%;
		margin-inline-start: 16px;
		overflow: hidden;

		@media (min-width: 600px) {
			max-inline-size: 70%;
		}

		&.full {
			margin-inline-end: 12px;
			padding-inline-end: 0;
			@media (min-width: 600px) {
				margin-inline-end: 20px;
				padding-inline-end: 20px;
			}
		}

		.headline {
			--v-breadcrumb-color: var(--theme--header--headline--foreground);

			position: absolute;
			inset-block-start: 2px;
			inset-inline-start: 0;
			font-weight: 600;
			font-size: 12px;
			white-space: nowrap;
			opacity: 1;
			transition: opacity var(--fast) var(--transition);
			font-family: var(--theme--header--headline--font-family);

			@media (min-width: 600px) {
				inset-block-start: -2px;
			}
		}

		.title {
			position: relative;
			display: flex;
			align-items: center;
			overflow: hidden;

			.type-title {
				color: var(--theme--header--title--foreground);
				flex-grow: 1;
				inline-size: 100%;
				overflow: hidden;
				white-space: nowrap;
				text-overflow: ellipsis;
				font-family: var(--theme--header--title--font-family);
				font-weight: var(--theme--header--title--font-weight);
			}

			:deep(.type-title) {
				.render-template {
					img {
						block-size: 24px;
					}
				}
			}
		}
	}

	&.small {
		inset-block-start: 0;
		block-size: 60px;
	}

	&.small .title-container .headline {
		opacity: 0;
		pointer-events: none;
	}

	&.collapsed.shadow,
	&.small.shadow {
		box-shadow: var(--theme--header--box-shadow);

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
		margin-inline-start: 8px;

		@media (min-width: 960px) {
			display: none;
		}
	}

	@media (min-width: 600px) {
		padding: 0 32px;

		&:not(.small) {
			margin: 24px 0;

			/* Somewhat hacky way to make sure we fill
			the empty space caused by the margin with
			the appropriate color */
			&::before {
				content: '';
				inline-size: 100%;
				block-size: 24px;
				inset-block-end: 100%;
				inset-inline-start: 0;
				background-color: var(--theme--header--background);
				position: absolute;
			}
		}
	}
}
</style>
