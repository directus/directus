<script setup lang="ts">
import { RevisionsByDate, Revision } from '@/types/revisions';

import { ref } from 'vue';

import RevisionItem from './revision-item.vue';

interface Props {
	group: RevisionsByDate;
	isFirstGroup?: boolean;
}

defineProps<Props>();
defineEmits(['click']);

const expand = ref(true);
</script>

<template>
	<v-detail v-model="expand" :label="group.dateFormatted" class="revisions-date-group">
		<div v-show="expand" class="scroll-container">
			<revision-item
				v-for="(item, index) in group.revisions"
				:key="item.id"
				:revision="item as Revision"
				:last="index === group.revisions.length - 1"
				:most-recent="isFirstGroup && index === 0"
				@click="$emit('click', item.id)"
			/>
		</div>
	</v-detail>
</template>
