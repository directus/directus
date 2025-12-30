<script setup lang="ts">
import VCard from './v-card.vue';
import VButton from '@/components/v-button.vue';
import VCardActions from '@/components/v-card-actions.vue';
import VCardText from '@/components/v-card-text.vue';
import VCardTitle from '@/components/v-card-title.vue';
import { logEvent } from 'histoire/client';
</script>

<template>
	<Story title="VCard">
		<VCard>
			<VCardTitle>Want a cake?</VCardTitle>
			<VCardText>If you want a cake, you have to click on accept. And the cake is definitely not a lie.</VCardText>
			<VCardActions>
				<VButton secondary @click="logEvent('decline', $event)">Decline</VButton>
				<VButton @click="logEvent('accept', $event)">Accept</VButton>
			</VCardActions>
		</VCard>
	</Story>
</template>
