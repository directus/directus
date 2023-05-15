<template>
	<div class="v-fancy-select">
		<transition-group tag="div" name="option">
			<template v-for="(item, index) in visibleItems" :key="index">
				<v-divider v-if="item.divider === true" />
				<div
					v-else
					class="v-fancy-select-option"
					:class="{ active: item[itemValue] === modelValue, disabled }"
					:style="{
						'--index': index,
					}"
					@click="toggle(item)"
				>
					<div class="icon">
						<v-icon :name="item.icon" />
					</div>

					<div class="content">
						<div class="text">{{ item[itemText] }}</div>
						<div class="description">{{ item[itemDescription] }}</div>
					</div>

					<v-icon
						v-if="modelValue === item[itemValue] && disabled === false"
						name="cancel"
						@click.stop="toggle(item)"
					/>
					<v-icon v-else-if="item.iconRight" class="icon-right" :name="item.iconRight" />
				</div>
			</template>
		</transition-group>
	</div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

export type FancySelectItem = {
	icon: string;
	value?: string | number;
	text: string;
	description?: string;
	divider?: boolean;
	iconRight?: string;
} & Record<string, any>;

interface Props {
	/** The list of possible items to display */
	items: FancySelectItem[];
	/** Used to model the current selected item */
	modelValue?: string | number | null;
	/** Disable selecting / deselecting a value */
	disabled?: boolean;
	/** What key in items to use to display text */
	itemText?: string;
	/** What key in items to use to model the selected item */
	itemValue?: string;
	/** What key in items to use to display a description */
	itemDescription?: string;
}

const props = withDefaults(defineProps<Props>(), {
	modelValue: () => null,
	disabled: false,
	itemText: 'text',
	itemValue: 'value',
	itemDescription: 'description',
});

const emit = defineEmits(['update:modelValue']);

const visibleItems = computed(() => {
	if (props.modelValue === null) return props.items;

	return props.items.filter((item) => {
		return item[props.itemValue] === props.modelValue;
	});
});

function toggle(item: Record<string, any>) {
	if (props.disabled === true) return;
	if (props.modelValue === item[props.itemValue]) emit('update:modelValue', null);
	else emit('update:modelValue', item[props.itemValue]);
}
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
	background-color: var(--background-normal);
	border: 2px solid var(--background-normal);
	border-radius: 6px;
	backface-visibility: hidden;
	cursor: pointer;
	transition-timing-function: var(--transition);
	transition-duration: var(--fast);
	transition-property: background-color, border-color;

	&:not(.disabled):hover {
		border-color: var(--background-normal-alt);
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
		background-color: var(--background-page);
		border-radius: 50%;
	}

	.content {
		flex: 1;

		.description {
			opacity: 0.6;
		}
	}

	&.active {
		z-index: 2;
		color: var(--primary);
		background-color: var(--primary-alt);
		border-color: var(--primary);

		.v-icon {
			--v-icon-color: var(--primary);
		}

		&:hover {
			border-color: var(--primary);
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

.option-enter-from,
.option-leave-to {
	opacity: 0;
}

.icon-right {
	--v-icon-color: var(--foreground-subdued);
}

.v-divider {
	margin: 24px 0;
}
</style>
