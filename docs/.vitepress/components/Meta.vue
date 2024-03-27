<script setup lang="ts">
defineProps<{ titleLeft?: string; titleRight?: string; titleBottom?: string }>();

defineSlots<{
	left(): any;
	right(): any;
	bottom(): any;
}>();
</script>

<template>
	<div class="wrapper">
		<div class="top">
			<div v-if="$slots['left']">
				<span class="sm-gray-text spacing">{{ titleLeft }}</span>
				<slot name="left" />
			</div>
			<div v-if="$slots['right']" class="right">
				<span class="sm-gray-text spacing">{{ titleRight }}</span>
				<slot name="right" />
			</div>
		</div>
		<div v-if="$slots['bottom']" class="bottom">
			<span class="sm-gray-text">{{ titleBottom }}</span>
			<slot name="bottom" />
		</div>
	</div>
</template>

<style scoped>
.wrapper {
	border: 1px solid var(--vp-c-divider);
	border-radius: 8px;
	padding: 11px 16px 9px;
}

.sm-gray-text {
	color: var(--vp-c-gray-light-1);
	font-size: 0.75rem;
	font-weight: 500;
}

.spacing + :deep(*) {
	margin-top: 4px;
}

.bottom {
	display: flex;
	border-top: 1px solid var(--vp-c-divider);
	flex-wrap: wrap;
	margin-top: 0.75em;
	padding-top: 0.5em;
	align-items: baseline;
	gap: 0.75em;
}

.bottom span {
	font-weight: 500;
	color: var(--vp-c-gray-light-1);
}

.top > * + * {
	margin-top: 1em;
}

@media only screen and (min-width: 768px) {
	.top {
		display: flex;
		justify-content: space-between;
	}
	.top > * + * {
		margin-top: 0;
	}

	.right {
		text-align: right;
	}
}
</style>
