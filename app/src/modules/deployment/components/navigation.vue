<script setup lang="ts">
import VIcon from '@/components/v-icon/v-icon.vue';
import VListItemContent from '@/components/v-list-item-content.vue';
import VListItemIcon from '@/components/v-list-item-icon.vue';
import VListItem from '@/components/v-list-item.vue';
import VList from '@/components/v-list.vue';
import VTextOverflow from '@/components/v-text-overflow.vue';

interface Provider {
	type: string;
	name: string;
	icon: string;
}

defineProps<{
	providers: Provider[];
}>();
</script>

<template>
	<VList nav>
		<VListItem v-for="provider in providers" :key="provider.type" :to="`/deployment/${provider.type}`">
			<VListItemIcon><VIcon :name="provider.icon" /></VListItemIcon>
			<VListItemContent>
				<VTextOverflow :text="provider.name" />
			</VListItemContent>
		</VListItem>
	</VList>
</template>

