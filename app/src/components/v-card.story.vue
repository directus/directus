<script setup lang="ts">
import VCard from './v-card.vue';
import { logEvent } from 'histoire/client';
</script>

<template>
	<Story title="VCard">
		<template #default="{ state: { _hPropState, _hPropDefs, $data: _, ...state } }">
			<v-card v-bind="state">
				<v-card-title>Want a cake?</v-card-title>
				<v-card-text>
					If you want a cake, you have to click on accept. And the cake is definitely not a lie.
				</v-card-text>
				<v-card-actions>
					<v-button secondary @click="logEvent('decline', $event)">Decline</v-button>
					<v-button @click="logEvent('accept', $event)">Accept</v-button>
				</v-card-actions>
			</v-card>
		</template>
	</Story>
</template>
