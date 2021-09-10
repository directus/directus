<template>
	<v-menu attached class="v-select">
		<template #activator="{ toggle, active }">
			<v-input readonly :model-value="displayValue" clickable :active="active" @click="toggle">
				<template #prepend>
					<v-icon class="translate" name="translate" />
				</template>
				<template #append>
					<v-icon name="expand_more" :class="{ active }" />
					<slot name="append" />
				</template>
			</v-input>
		</template>

		<v-list>
			<v-list-item v-for="(item, index) in items" :key="index" @click="$emit('update:modelValue', item.value)">
				<div class="start">
					<div class="dot" :class="{ show: item.edited }"></div>
					{{ item.text }}
				</div>
				<div class="end">
					<v-progress-linear :value="item.progress" colorful />
					{{ item.current }} / {{ item.max }}
				</div>
			</v-list-item>
		</v-list>
	</v-menu>
</template>

<script lang="ts">
import { defineComponent, PropType, computed } from 'vue';

export default defineComponent({
	components: {},
	props: {
		modelValue: {
			type: String,
			default: null,
		},
		items: {
			type: Array as PropType<Record<string, any>[]>,
			default: () => [],
		},
	},
	emits: ['update:modelValue'],
	setup(props, { emit }) {
		const displayValue = computed(() => {
			const item = props.items.find((item) => item.value === props.modelValue);
			return item?.text ?? props.modelValue;
		});

		return { displayValue };
	},
});
</script>
<style lang="scss" scoped>
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
		}

		&:hover {
			background-color: var(--background-normal);
		}

		.dot {
			width: 8px;
			height: 100%;

			&.show::before {
				display: block;
				width: 4px;
				height: 4px;
				background-color: var(--primary);
				border-radius: 2px;
				content: '';
			}
		}

		.v-progress-linear {
			max-width: 300px;
		}
	}
}
</style>
