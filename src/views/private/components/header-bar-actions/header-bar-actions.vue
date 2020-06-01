<template>
	<div class="actions" :class="{ active }">
		<v-button class="expand" icon rounded secondary outlined @click="active = !active">
			<v-icon name="arrow_left" />
		</v-button>

		<div class="action-buttons">
			<slot />
		</div>

		<v-button class="drawer-toggle" icon rounded secondary outlined @click="$emit('toggle:drawer')">
			<v-icon name="info" />
		</v-button>
	</div>
</template>

<script lang="ts">
import { defineComponent, ref } from '@vue/composition-api';

export default defineComponent({
	props: {},
	setup() {
		const active = ref(false);
		return { active };
	},
});
</script>

<style lang="scss" scoped>
@import '@/styles/mixins/breakpoint';

.actions {
	position: relative;
	display: flex;
	background-color: transparent;

	.gradient-wrapper {
		display: contents;
	}

	.expand {
		flex-shrink: 0;
		margin-right: 8px;

		@include breakpoint(medium) {
			display: none;
		}
	}

	.action-buttons {
		display: flex;
		flex-shrink: 0;

		> *:not(:last-child) {
			display: none;
			margin-right: 8px;
		}
	}

	.drawer-toggle {
		flex-shrink: 0;
		margin-left: 8px;

		@include breakpoint(medium) {
			display: none;
		}
	}

	&.active {
		position: absolute;
		top: 0;
		right: 0;
		align-items: center;
		justify-content: flex-end;
		height: 100%;
		padding: inherit;
		padding-left: 8px;
		background-color: var(--background-page);

		.expand {
			transform: rotate(180deg);
		}

		.action-buttons {
			> * {
				display: inherit;
			}
		}
	}

	@include breakpoint(medium) {
		.action-buttons ::v-deep {
			> * {
				display: inherit !important;
			}
		}
	}
}
</style>
