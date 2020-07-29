<template>
	<div class="v-info" :class="[type, { center }]">
		<div class="icon">
			<v-icon large :name="icon" />
		</div>
		<h2 class="title type-title">{{ title }}</h2>
		<p class="content"><slot /></p>
		<slot name="append" />
	</div>
</template>

<script lang="ts">
import { defineComponent, PropType } from '@vue/composition-api';

export default defineComponent({
	props: {
		icon: {
			type: String,
			default: 'box',
		},
		title: {
			type: String,
			required: true,
		},
		type: {
			type: String as PropType<'info' | 'success' | 'warning' | 'danger'>,
			default: 'info',
		},
		center: {
			type: Boolean,
			default: false,
		},
	},
});
</script>

<style lang="scss" scoped>
.v-info {
	display: flex;
	flex-direction: column;
	align-items: center;
	text-align: center;
}

.icon {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 120px;
	height: 120px;
	margin-bottom: 20px;
	border-radius: 50%;
}

.info .icon {
	color: var(--primary);
	background-color: var(--primary-alt);
}

.success .icon {
	color: var(--success);
	background-color: var(--success-alt);
}

.warning .icon {
	color: var(--warning);
	background-color: var(--warning-alt);
}

.danger .icon {
	color: var(--danger);
	background-color: var(--danger-alt);
}

.title {
	margin-bottom: 12px;
}

.content {
	max-width: 360px;
	color: var(--foreground-subdued);

	&:not(:last-child) {
		margin-bottom: 32px;
	}
}

.center {
	position: absolute;
	top: 50%;
	left: 50%;
	transform: translate(-50%, -50%);
}
</style>
