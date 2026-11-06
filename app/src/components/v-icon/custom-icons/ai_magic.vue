<script setup lang="ts">
import { useElementHover, usePreferredReducedMotion } from '@vueuse/core';
import { computed, onMounted, ref, useTemplateRef } from 'vue';
import AiMagicButton from '@/ai/components/ai-magic-button.vue';

const icon = useTemplateRef<InstanceType<typeof AiMagicButton>>('icon');
const target = ref<HTMLElement | null>(null);
const hovered = useElementHover(target);
const reducedMotion = usePreferredReducedMotion();

const animate = computed(() => hovered.value && reducedMotion.value !== 'reduce');

/**
 * Sparkles while the button or link around the icon is hovered, like the AI translate button. The icon is used inside
 * other components' markup, like the operation picker's choices, so it finds its clickable parent instead of taking a
 * ref. Outside one, it stays still.
 */
onMounted(() => {
	target.value = (icon.value?.$el as Element | undefined)?.closest<HTMLElement>('button, a, [role="button"]') ?? null;
});
</script>

<template>
	<AiMagicButton ref="icon" :animate="animate" />
</template>
