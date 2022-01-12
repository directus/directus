<template>
	<div class="block-container" :class="type">
		<div class="block">{{ type }}</div>
	</div>
</template>

<script lang="ts" setup>
const props = defineProps({
	type: {
		type: String,
		default: 'operation',
		validator: (val: string) => ['trigger', 'operation', 'error'].includes(val),
	},
});
</script>

<style lang="scss" scoped>
.block-container {
	position: relative;
	padding: 8px;
	overflow: hidden;
	border-radius: calc(var(--border-radius) * 1.8);

	&::before {
		position: absolute;
		top: 0;
		left: 0;
		width: calc(100%);
		height: calc(100%);
		background-color: var(--background-inverted);
		opacity: 0.2;
		content: '';
	}
}

.block {
	position: relative;
	z-index: 2;
	height: 100%;
	padding: 4px 8px;
	border-radius: var(--border-radius);
}

.trigger {
	&::before {
		background-color: var(--background-inverted);
	}

	.block {
		color: var(--foreground-inverted);
		background-color: var(--background-inverted);
	}
}

.operation {
	&::before {
		background-color: var(--secondary);
	}

	.block {
		color: var(--foreground-inverted);
		background-color: var(--secondary);
	}
}

.error {
	&::before {
		background-color: var(--danger);
	}

	.block {
		color: var(--foreground-inverted);
		background-color: var(--danger);
	}
}
</style>
