<script setup lang="ts">
import { Revision, RevisionsByDate } from '@/types/revisions';
import { computed, ref } from 'vue';

import RevisionItem from './revision-item.vue';

interface Props {
	group: RevisionsByDate;
	isFirstGroup?: boolean;
}

const props = defineProps<Props>();
defineEmits(['click']);

const expand = ref(true);

const revisionsAsRevision = computed(() => props.group.revisions as unknown as Revision[]);
</script>

<template>
	<v-detail v-model="expand" :label="group.dateFormatted" class="revisions-date-group">
		<div v-show="expand" class="scroll-container">
			<revision-item
				v-for="(item, index) in revisionsAsRevision"
				:key="item.id"
				:revision="item"
				:last="index === revisionsAsRevision.length - 1"
				:most-recent="props.isFirstGroup && index === 0"
				@click="$emit('click', item.id)"
			/>
		</div>
	</v-detail>
</template>
