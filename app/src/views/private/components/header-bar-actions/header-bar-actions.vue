<template>
	<div class="actions" :class="{ active }">
		<v-button class="expand" icon rounded secondary outlined @click="active = !active">
			<v-icon name="arrow_left" />
		</v-button>

		<div class="action-buttons">
			<v-button
				class="sidebar-toggle"
				icon
				rounded
				secondary
				outlined
				@click="$emit('toggle:sidebar')"
				v-if="showSidebarToggle"
			>
				<v-icon name="info" outline />
			</v-button>

			<slot />
		</div>
	</div>
</template>

<script lang="ts">
import { defineComponent, ref } from '@vue/composition-api';

export default defineComponent({
	props: {
		showSidebarToggle: {
			type: Boolean,
			default: false,
		},
	},
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
		--v-icon-color: var(--foreground-normal);

		flex-shrink: 0;
		margin-right: 8px;

		@include breakpoint(medium) {
			display: none;
		}
	}

	.action-buttons {
		display: flex;
		flex-shrink: 0;

		.v-button.secondary {
			--v-icon-color: var(--foreground-normal);
		}

		> *:not(:last-child) {
			display: none;
			margin-right: 8px;
		}

		.sidebar-toggle {
			flex-shrink: 0;

			@include breakpoint(medium) {
				display: none;
			}
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
			> *:not(.sidebar-toggle) {
				display: inherit !important;
			}
		}
	}
}
</style>
