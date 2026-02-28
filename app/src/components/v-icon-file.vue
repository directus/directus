<script setup lang="ts">
import VIcon from './v-icon/v-icon.vue';

interface Props {
	/** The extension type of the file */
	ext: string;
}

defineProps<Props>();
</script>

<template>
	<div class="icon" :class="{ right: ext.length >= 4 }">
		<VIcon name="insert_drive_file" />
		<span class="label">{{ ext }}</span>
	</div>
</template>

<style lang="scss" scoped>
/*

	Available Variables:

		--v-icon-file-color             [var(--theme--primary)]
		--v-icon-file-background-color  [var(--theme--background-normal)]

*/

.icon {
	--v-icon-size: 64px;
	--v-icon-color: var(--v-icon-file-color, var(--theme--primary));
	color: var(--v-icon-file-color, var(--theme--primary));
	position: relative;

	.label {
		position: absolute;
		text-transform: uppercase;
		inset-inline-start: 50%;
		inset-block-start: 55%;
		font-size: var(--v-icon-file-label-size, 12px);
		font-weight: 800;
		line-height: 1;
		padding: 2px 0;
		text-align: center;
		transform: translateX(-50%);

		html[dir='rtl'] & {
			transform: translateX(50%);
		}
	}

	&.right {
		.label {
			background-color: var(--v-icon-file-background-color, var(--theme--background-normal));
			inset-inline-start: calc(100% - var(--v-icon-file-label-size, 12px) - 3ch);
			text-align: start;
			transform: none;
			padding-inline-end: 8px;
		}
	}
}
</style>
