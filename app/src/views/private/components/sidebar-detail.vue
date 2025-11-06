<script setup lang="ts">
import { AccordionContent, AccordionHeader, AccordionItem, AccordionTrigger } from 'reka-ui';

defineProps<{ id: string, title: string, icon: string }>();
</script>

<template>
	<AccordionItem class="sidebar-detail" :value="id">
		<AccordionHeader>
			<AccordionTrigger>
				<span>{{ title }}</span>
			</AccordionTrigger>
		</AccordionHeader>
		<AccordionContent>
			<slot />
		</AccordionContent>
	</AccordionItem>
</template>

<style lang="scss" scoped>

</style>
