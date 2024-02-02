<script setup lang="ts">
defineProps<{
	icon: string;
}>();
</script>

<template>
	<div class="v-banner">
		<div class="avatar">
			<v-icon :name="icon" large />
		</div>

		<div class="content">
			<div class="headline"><slot name="headline" /></div>
			<div class="title"><slot /></div>
			<div class="subtitle"><slot name="subtitle" /></div>
		</div>
	</div>
</template>

<style scoped>
.v-banner {
	container-type: inline-size;
	width: 100%;
	padding: var(--theme--banner--padding);
	border-radius: var(--theme--banner--border-radius);
	background-color: var(--theme--banner--background);
	display: flex;
	align-items: center;
	gap: var(--theme--banner--padding);

	.content {
		.headline {
			--theme--foreground: var(--theme--banner--foreground-subdued);
			color: var(--theme--banner--headline--foreground);
			font-family: var(--theme--banner--headline--font-family);
			font-weight: var(--theme--banner--headline--font-weight);
		}

		.title {
			--theme--foreground: var(--theme--banner--foreground);
			color: var(--theme--banner--title--foreground);
			font-family: var(--theme--banner--title--font-family);
			font-weight: var(--theme--banner--title--font-weight);
			font-size: 24px;
			line-height: 34px;
		}

		.subtitle {
			--theme--foreground: var(--theme--banner--foreground-subdued);
			color: var(--theme--banner--subtitle--foreground);
			font-family: var(--theme--banner--subtitle--font-family);
			font-weight: var(--theme--banner--subtitle--font-weight);
		}
	}

	.avatar {
		flex-shrink: 0;
		width: 120px;
		height: 120px;
		align-items: center;
		justify-content: center;
		border-radius: var(--theme--banner--avatar--border-radius);
		background-color: var(--theme--banner--avatar--background);
		color: var(--theme--banner--avatar--foreground);
		display: none;

		@container (width > 700px) {
			display: flex;
		}
	}
}
</style>
