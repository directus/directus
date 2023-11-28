<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(
	defineProps<{
		modelValue?: string;
		items?: Record<string, any>[];
		secondary?: boolean;
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
	<v-menu attached class="language-select" :class="{ secondary }">
		<template #activator="{ toggle, active }">
			<button class="toggle" @click="toggle">
				<v-icon class="translate" name="translate" />
				<span class="display-value">{{ displayValue }}</span>
				<v-icon name="expand_more" :class="{ active }" />
				<span class="append-slot"><slot name="append" /></span>
			</button>
		</template>

		<v-list v-if="items">
			<v-list-item v-for="(item, index) in items" :key="index" @click="$emit('update:modelValue', item.value)">
				<div class="start">
					<div class="dot" :class="{ show: item.edited }"></div>
					{{ item.text }}
				</div>
				<div class="end">
					<v-progress-linear
						v-tooltip="`${Math.round((item.current / item.max) * 100)}%`"
						:value="item.progress"
						rounded
						colorful
					/>
				</div>
			</v-list-item>
		</v-list>
	</v-menu>
</template>

<style lang="scss" scoped>
.toggle {
	--v-icon-color: var(--theme--primary);
	--v-icon-color-hover: var(--theme--primary-accent);

	display: flex;
	align-items: center;
	width: 100%;
	height: var(--theme--form--field--input--height);
	padding: var(--theme--form--field--input--padding);
	color: var(--theme--primary);
	text-align: left;
	background-color: var(--theme--primary-background);
	border-radius: var(--theme--border-radius);

	.display-value {
		flex-grow: 1;
		margin-left: 8px;
	}

	.append-slot:not(:empty) {
		margin-left: 8px;
	}
}

.v-input .input {
	color: var(--theme--primary);
	background-color: var(--theme--primary-background);
	border: 0px;
}

.v-icon {
	margin-left: 6px;
}

.secondary {
	.toggle {
		--v-icon-color: var(--theme--secondary);
		--v-icon-color-hover: var(--secondary-150);

		color: var(--theme--secondary);
		background-color: var(--secondary-alt);
	}
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
			width: 8px;
			height: 100%;

			&.show::before {
				display: block;
				width: 4px;
				height: 4px;
				background-color: var(--theme--form--field--input--foreground-subdued);
				border-radius: 2px;
				content: '';
			}
		}

		.v-progress-linear {
			max-width: 100px;
		}
	}
}
</style>
