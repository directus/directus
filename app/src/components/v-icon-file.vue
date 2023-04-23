<template>
	<div class="icon" :class="{ right: ext.length >= 4 }">
		<v-icon name="insert_drive_file" />
		<span class="label">{{ ext }}</span>
	</div>
</template>

<script setup lang="ts">
interface Props {
	/** The extension type of the file */
	ext: string;
}

defineProps<Props>();
</script>

<style lang="scss" scoped>
:global(body) {
	--v-icon-file-color: var(--primary);
	--v-icon-file-background-color: var(--background-normal);
}

.icon {
	--v-icon-size: 64px;
	--v-icon-color: var(--v-icon-file-color);
	color: var(--v-icon-file-color);
	position: relative;

	.label {
		position: absolute;
		text-transform: uppercase;
		left: 50%;
		transform: translateX(-50%);
		top: 55%;
		font-size: 12px;
		font-weight: 800;
		line-height: 1;
		padding: 2px 0;
		text-align: center;
	}

	&.right {
		.label {
			background-color: var(--v-icon-file-background-color);
			left: calc(100% - 12px - 3ch);
			text-align: left;
			transform: none;
			padding-right: 8px;
		}
	}
}
</style>
