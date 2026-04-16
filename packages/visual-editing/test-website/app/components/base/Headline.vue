<script setup lang="ts">
interface HeadlineProps {
	headline?: string | null;
	className?: string;
	as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span' | 'div';
}
const { as = 'p', className = '' } = defineProps<HeadlineProps>();
</script>

<template>
	<component
		:is="as"
		v-if="headline"
		:class="`font-heading text-foreground font-normal ${className}
      text-4xl md:text-5xl lg:text-headline`"
	>
		{{ headline }}
	</component>
</template>
