<script setup lang="ts">
import VIcon from './v-icon/v-icon.vue';

interface Props {
	/** The title to display in the info */
	title: string;
	/** What icon to render above the title */
	icon?: string | false;
	/** Styling of the info */
	type?: 'info' | 'success' | 'warning' | 'danger';
	/** Displays the info centered */
	center?: boolean;
}

withDefaults(defineProps<Props>(), {
	icon: false,
	type: 'info',
	center: false,
});
</script>

<template>
	<div class="v-info" :class="[type, { center }]">
		<div v-if="icon !== false" class="icon">
			<v-icon large :name="icon" />
		</div>
		<h2 class="title type-title">{{ title }}</h2>
		<p class="content"><slot /></p>
		<slot name="append" />
	</div>
</template>

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
	width: 100px;
	height: 100px;
	margin-bottom: 16px;
	border-radius: 50%;
}

.info .icon {
	color: var(--theme--foreground-subdued);
	background-color: var(--theme--background-normal);
}

.success .icon {
	color: var(--theme--success);
	background-color: var(--success-alt);
}

.warning .icon {
	color: var(--theme--warning);
	background-color: var(--warning-alt);
}

.danger .icon {
	color: var(--theme--danger);
	background-color: var(--danger-alt);
}

.title {
	margin-bottom: 8px;
}

.content {
	max-width: 300px;
	color: var(--theme--foreground-subdued);
	line-height: 22px;

	&:not(:last-child) {
		margin-bottom: 24px;
	}
}

.center {
	position: absolute;
	top: 50%;
	left: 50%;
	transform: translate(-50%, -50%);
}
</style>
