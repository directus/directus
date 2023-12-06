<script setup lang="ts">
import { logEvent } from 'histoire/client';
import VButton from './v-button.vue';
</script>

<template>
	<Story title="VButton">
		<template #default="{ state: { _hPropState, _hPropDefs, $data: _, ...state } }">
			<v-button v-bind="state" @click="logEvent('click', $event)">My Button</v-button>
		</template>
	</Story>
</template>
