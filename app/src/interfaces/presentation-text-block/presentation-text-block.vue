<template>
	<p class="presentation-text-block">
		{{ text }}
	</p>
</template>

<script lang="ts" setup>
interface Props {
	text?: string;
}

withDefaults(defineProps<Props>(), {
	text: '',
});
</script>

<style lang="scss" scoped>
.presentation-text-block {
	color: var(--g-color-foreground-subtle);
}
</style>
