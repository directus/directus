<script setup lang="ts">
import VIcon from '@/components/v-icon/v-icon.vue';
import VListItem from '@/components/v-list-item.vue';
import VList from '@/components/v-list.vue';
import VMenu from '@/components/v-menu.vue';
import VProgressLinear from '@/components/v-progress-linear.vue';
import { computed } from 'vue';

const props = withDefaults(
	defineProps<{
		modelValue?: string;
		items?: Record<string, any>[];
		secondary?: boolean;
		danger?: boolean;
	}>(),
	{
		items: () => [],
	},
);

defineEmits(['update:modelValue']);

const displayValue = computed(() => {
	const item = props.items.find((item) => item.value === props.modelValue);
	return item?.text ?? props.modelValue;
});
</script>

<template>
	<VMenu attached class="language-select" :class="{ secondary, danger }">
		<template #activator="{ toggle, active }">
			<button class="toggle" type="button" @click="toggle">
				<slot name="prepend" />
				<span class="display-value">{{ displayValue }}</span>
				<span class="controls"><slot name="controls" :active :toggle /></span>
				<VIcon class="expand" name="expand_more" :class="{ active }" />
			</button>
		</template>

		<VList v-if="items">
			<VListItem
				v-for="(item, index) in items"
				:key="index"
				clickable
				@click="$emit('update:modelValue', item.value)"
			>
				<div class="start">
					<div class="dot" :class="{ show: item.edited }"></div>
					{{ item.text }}
				</div>
				<div class="end">
					<VProgressLinear
						v-tooltip="`${Math.round((item.current / item.max) * 100)}%`"
						:value="item.progress"
						rounded
						colorful
					/>
				</div>
			</VListItem>
		</VList>
	</VMenu>
</template>

<style lang="scss" scoped>
.toggle {
	--v-icon-color: var(--theme--primary);
	--v-icon-color-hover: var(--theme--primary-accent);

	display: flex;
	align-items: center;
	inline-size: 100%;
	block-size: var(--theme--form--field--input--height);
	padding: var(--theme--form--field--input--padding);
	color: var(--theme--primary);
	text-align: start;
	background-color: var(--theme--primary-background);
	border-radius: var(--theme--border-radius);

	.expand {
		transition: transform var(--medium) var(--transition-out);
	}

	.expand.active {
		transform: scaleY(-1);
		transition-timing-function: var(--transition-in);
	}

	.display-value {
		flex-grow: 1;
		margin-inline-start: 8px;
	}

	.controls > * + * {
		margin-inline-start: 8px;
	}

	.secondary & {
		--v-icon-color: var(--theme--secondary);
		--v-icon-color-hover: var(--secondary-150);

		color: var(--theme--secondary);
		background-color: var(--secondary-alt);
	}

	.danger & {
		--v-icon-color: var(--theme--danger);
		--v-icon-color-hover: var(--theme--danger-accent);

		color: var(--theme--danger);
		background-color: var(--theme--danger-background);
	}
}

.v-input .input {
	color: var(--theme--primary);
	background-color: var(--theme--primary-background);
	border: 0;
}

.v-icon {
	margin-inline-start: 6px;
}

.v-list {
	.v-list-item {
		display: flex;
		gap: 10px;
		align-items: center;
		justify-content: space-between;
		white-space: nowrap;
		cursor: pointer;

		.start {
			display: flex;
			flex: 1;
			align-items: center;
		}

		.end {
			display: flex;
			flex-grow: 1;
			gap: 10px;
			align-items: center;
			justify-content: flex-end;
			color: var(--theme--form--field--input--foreground-subdued);
		}

		&:hover {
			background-color: var(--theme--background-normal);
		}

		.dot {
			inline-size: 8px;
			block-size: 100%;

			&.show::before {
				display: block;
				inline-size: 4px;
				block-size: 4px;
				background-color: var(--theme--form--field--input--foreground-subdued);
				border-radius: 2px;
				content: '';
			}
		}

		.v-progress-linear {
			max-inline-size: 100px;
		}
	}
}
</style>
