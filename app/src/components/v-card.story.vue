<script setup lang="ts">
import VCard from './v-card.vue';
import { logEvent } from 'histoire/client';
import VButton from '@/components/v-button.vue';
import VCardActions from '@/components/v-card-actions.vue';
import VCardText from '@/components/v-card-text.vue';
import VCardTitle from '@/components/v-card-title.vue';
</script>

<template>
	<Story title="VCard">
		<v-card>
			<v-card-title>Want a cake?</v-card-title>
			<v-card-text>If you want a cake, you have to click on accept. And the cake is definitely not a lie.</v-card-text>
			<v-card-actions>
				<v-button secondary @click="logEvent('decline', $event)">Decline</v-button>
				<v-button @click="logEvent('accept', $event)">Accept</v-button>
			</v-card-actions>
		</v-card>
	</Story>
</template>
