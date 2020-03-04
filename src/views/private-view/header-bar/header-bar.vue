<template>
	<header class="header-bar" :class="{ dense }">
		<v-button secondary class="nav-toggle" icon rounded @click="$emit('toggle:nav')">
			<v-icon name="menu" />
		</v-button>

		<div class="title-outer-prepend" v-if="$scopedSlots['title-outer:prepend']">
			<slot name="title-outer:prepend" />
		</div>

		<div class="title-container">
			<slot name="headline" />
			<div class="title">
				<slot name="title:prepend" />
				<h1>{{ title }}</h1>
				<slot name="title:append" />
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
import { defineComponent } from '@vue/composition-api';
import HeaderBarActions from '../header-bar-actions';

export default defineComponent({
	components: { HeaderBarActions },
	props: {
		title: {
			type: String,
			required: true
		},
		dense: {
			type: Boolean,
			default: false
		}
	},
	setup() {
		return {};
	}
});
</script>

<style lang="scss" scoped>
@import '@/styles/mixins/breakpoint';
@import '@/styles/mixins/type-styles';

.header-bar {
	position: relative;
	display: flex;
	align-items: center;
	justify-content: flex-start;
	width: 100%;
	height: 64px;
	padding: 0 12px;
	background-color: var(--background-color);
	transition: height var(--medium) var(--transition);

	&.dense {
		height: 64px;
		box-shadow: 0 1px 4px 0 rgba(0, 0, 0, 0.2);
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
			display: flex;
			align-items: center;
		}

		h1 {
			flex-grow: 1;
			@include type-title;
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
		height: 112px;
		padding: 0 32px;
	}
}
</style>
