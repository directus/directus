<template>
	<div class="v-fancy-select">
		<transition-group tag="div" name="option">
			<div
				v-for="(item, index) in visibleItems"
				:key="item.value"
				class="v-fancy-select-option"
				:class="{ active: item.value === value, disabled }"
				:style="{
					'--index': index,
				}"
				@click="toggle(item)"
			>
				<div class="icon">
					<v-icon :name="item.icon" />
				</div>

				<div class="content">
					<div class="text">{{ item.text }}</div>
					<div class="description">{{ item.description }}</div>
				</div>

				<v-icon
					v-if="value === item.value && disabled === false"
					name="cancel"
					@click.stop="toggle(item)"
				/>
			</div>
		</transition-group>
	</div>
</template>

<script lang="ts">
import { defineComponent, PropType, computed } from '@vue/composition-api';
import { FancySelectItem } from './types';

export default defineComponent({
	props: {
		items: {
			type: Array as PropType<FancySelectItem[]>,
			required: true,
		},
		value: {
			type: [String, Number],
			default: null,
		},
		disabled: {
			type: Boolean,
			default: false,
		},
	},
	setup(props, { emit }) {
		const visibleItems = computed(() => {
			if (props.value === null) return props.items;

			return props.items.filter((item) => {
				return item.value === props.value;
			});
		});

		return { toggle, visibleItems };

		function toggle(item: FancySelectItem) {
			if (props.disabled === true) return;
			if (props.value === item.value) emit('input', null);
			else emit('input', item.value);
		}
	},
});
</script>

<style lang="scss" scoped>
.v-fancy-select {
	position: relative;
}

.v-fancy-select-option {
	position: relative;
	z-index: 1;
	display: flex;
	align-items: center;
	width: 100%;
	margin-bottom: 8px;
	padding: 12px;
	background-color: var(--background-color-alt);
	border: 2px solid var(--background-color-alt);
	border-radius: 6px;
	backface-visibility: hidden;
	cursor: pointer;
	transition-timing-function: var(--transition);
	transition-duration: var(--fast);
	transition-property: background-color, border-color;

	&:not(.disabled):hover {
		border-color: var(--action);
	}

	&.disabled {
		cursor: not-allowed;
	}

	.icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 44px;
		height: 44px;
		margin-right: 12px;
		background-color: var(--background-color);
		border-radius: 50%;
	}

	.content {
		flex-grow: 1;

		.description {
			opacity: 0.6;
		}
	}

	&.active {
		z-index: 2;
		color: var(--accent);
		background-color: var(--accent-light);
		border-color: var(--accent);

		.v-icon {
			--v-icon-color: var(--accent);
		}

		&:hover {
			border-color: var(--accent);
		}
	}
}

.option-enter-active,
.option-leave-active {
	transition: opacity var(--slow) var(--transition);
}

.option-leave-active {
	position: absolute;
}

.option-move {
	transition: all 500ms var(--transition);
}

.option-enter,
.option-leave-to {
	opacity: 0;
}
</style>
