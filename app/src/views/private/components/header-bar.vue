<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import HeaderBarActions from './header-bar-actions.vue';

withDefaults(
	defineProps<{
		title?: string;
		showSidebarToggle?: boolean;
		primaryActionIcon?: string;
		shadow?: boolean;
	}>(),
	{
		primaryActionIcon: 'menu',
		shadow: true,
	}
);

defineEmits<{
	(e: 'primary'): void;
	(e: 'toggle:sidebar'): void;
}>();

const headerEl = ref<Element>();

const collapsed = ref(true);

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
</script>

<template>
	<header ref="headerEl" class="header-bar" :class="{ collapsed, shadow }">
		<v-button secondary class="nav-toggle" icon rounded @click="$emit('primary')">
			<v-icon :name="primaryActionIcon" />
		</v-button>

		<div v-if="$slots['title-outer:prepend']" class="title-outer-prepend">
			<slot name="title-outer:prepend" />
		</div>

		<div class="title-container" :class="{ full: !$slots['title-outer:append'] }">
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
	top: 0;
	left: 0;
	z-index: 5;
	display: flex;
	align-items: center;
	justify-content: flex-start;
	width: 100%;
	height: calc(var(--header-bar-height) + var(--theme--header--border-width));
	margin: 0;
	padding: 0 10px;
	background-color: var(--theme--header--background);
	box-shadow: 0;
	transition: box-shadow var(--medium) var(--transition), margin var(--fast) var(--transition);
	border-bottom: var(--theme--header--border-width) solid var(--theme--header--border-color);

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
		width: 100%;
		max-width: calc(100% - 12px - 44px - 120px - 12px - 8px);
		height: 100%;
		margin-left: 16px;
		overflow: hidden;

		@media (min-width: 600px) {
			max-width: 70%;
		}

		&.full {
			margin-right: 12px;
			padding-right: 0;
			@media (min-width: 600px) {
				margin-right: 20px;
				padding-right: 20px;
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
				width: 100%;
				overflow: hidden;
				white-space: nowrap;
				text-overflow: ellipsis;
				font-family: var(--theme--header--title--font-family);
			}

			:deep(.type-title) {
				.render-template {
					img {
						height: 24px;
					}
				}
			}
		}
	}

	&.collapsed.shadow {
		box-shadow: var(--theme--header--box-shadow);
	}

	.spacer {
		flex-grow: 1;
	}

	.sidebar-toggle {
		flex-shrink: 0;
		margin-left: 8px;

		@media (min-width: 960px) {
			display: none;
		}
	}

	@media (min-width: 600px) {
		padding: 0 32px;
	}
}
</style>
