<script setup lang="ts">
import VIcon from '@/components/v-icon/v-icon.vue';
</script>

<template>
	<VIcon class="toolbar-caret" name="expand_more" small />
</template>

<style lang="scss" scoped>
// Shared dropdown-caret glyph; consumers position it (margin/flex) via their own class on the root.
.toolbar-caret {
	--v-icon-size: 1rem;
}
</style>
