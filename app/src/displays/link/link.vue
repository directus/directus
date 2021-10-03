<template>
	<div class="link">
		<value-null v-if="value === null" />
		<template v-else>
			<a :href="value" target="_blank" @click.stop>
				<v-icon name="open_in_new"></v-icon>
			</a>
			<span>{{ parsedValue }}</span>
		</template>
	</div>
</template>

<script lang="ts">
import { defineComponent, computed } from 'vue';

export default defineComponent({
	props: {
		value: {
			type: String,
			default: null,
		},
	},
	setup(props) {
		const parsedValue = computed(() => {
			if (typeof props.value === 'string') {
				return props.value.split('://')[1];
			}
			return props.value;
		});

		return { parsedValue };
	},
});
</script>

<style lang="scss" scoped>
.link {
	display: inline-flex;
	align-items: center;

	.v-icon {
		margin-right: 4px;
		color: #999;

		&:hover {
			color: #666;
		}
	}
}
</style>
