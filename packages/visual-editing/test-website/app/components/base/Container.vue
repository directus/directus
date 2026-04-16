<script setup lang="ts">
export interface ContainerProps {
	as?: 'div' | 'section' | 'main' | 'article' | 'aside' | 'nav' | 'header' | 'footer' | 'form';
	className?: string;
	role?: string;
}

const { as = 'div', className = '', role } = defineProps<ContainerProps>();
</script>

<template>
	<component :is="as" :class="['max-w-7xl mx-auto px-4 sm:px-6 lg:px-16', className]" :role="role">
		<slot />
	</component>
</template>
