<script setup lang="ts">
import VListItem from './v-list-item.vue';
</script>

<template>
	<Story title="VList/VListItem" icon="material-symbols:horizontal-rule" :layout="{ type: 'grid', width: '45%' }">
		<Variant title="Basic">
			<v-list-item>This is a list Item</v-list-item>
		</Variant>
		<Variant title="Detailed">
			<v-list-item>
				<v-list-item-icon><v-icon name="check" /></v-list-item-icon>
				<v-list-item-content>Some Item Content</v-list-item-content>
				<v-list-item-hint>This is a hint</v-list-item-hint>
			</v-list-item>
		</Variant>
	</Story>
</template>
