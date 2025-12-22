<script setup lang="ts">
import VDetail from '@/components/v-detail.vue';
import { Revision, RevisionsByDate } from '@/types/revisions';
import { ref } from 'vue';
import RevisionItem from './revision-item.vue';

interface Props {
	group: RevisionsByDate;
}

defineProps<Props>();
defineEmits(['click']);

const expand = ref(true);
</script>

<template>
	<VDetail v-model="expand" :label="group.dateFormatted" class="revisions-date-group">
		<div v-show="expand" class="scroll-container">
			<RevisionItem
				v-for="(item, index) in group.revisions"
				:key="item.id"
				:revision="item as Revision"
				:last="index === group.revisions.length - 1"
				@click="$emit('click', item.id)"
			/>
		</div>
	</VDetail>
</template>
