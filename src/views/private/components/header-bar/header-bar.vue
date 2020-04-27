<template>
	<header class="header-bar" ref="headerEl" :class="{ shadow: showShadow }">
		<v-button secondary class="nav-toggle" icon rounded @click="$emit('toggle:nav')">
			<v-icon name="menu" />
		</v-button>

		<div class="title-outer-prepend" v-if="$scopedSlots['title-outer:prepend']">
			<slot name="title-outer:prepend" />
		</div>

		<div class="title-container">
			<slot name="headline" />
			<div class="title">
				<slot name="title">
					<slot name="title:prepend" />
					<h1 class="type-title">{{ title }}</h1>
					<slot name="title:append" />
				</slot>
			</div>
		</div>

		<slot name="title-outer:append" />

		<div class="spacer" />

		<slot name="actions:prepend" />
		<header-bar-actions @toggle:drawer="$emit('toggle:drawer')">
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
	},
	setup() {
		const headerEl = ref<Element>();

		const showShadow = ref(false);

		const observer = new IntersectionObserver(
			([e]) => {
				showShadow.value = e.intersectionRatio < 1;
			},
			{ threshold: [1] }
		);

		onMounted(() => {
			observer.observe(headerEl.value as HTMLElement);
		});

		onUnmounted(() => {
			observer.disconnect();
		});

		return { headerEl, showShadow };
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
	margin: 24px 0;
	padding: 0 12px;
	background-color: var(--background-page);
	box-shadow: 0;
	transition: box-shadow var(--medium) var(--transition);

	&.shadow {
		box-shadow: 0 4px 7px -4px rgba(0, 0, 0, 0.2);
	}

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
		margin-left: 12px;

		.title {
			position: relative;
			top: -2px;
			display: flex;
			align-items: center;
		}

		h1 {
			flex-grow: 1;
		}
	}

	.spacer {
		flex-grow: 1;
	}

	.drawer-toggle {
		flex-shrink: 0;
		margin-left: 8px;

		@include breakpoint(medium) {
			display: none;
		}
	}

	@include breakpoint(small) {
		padding: 0 32px;
	}
}
</style>
