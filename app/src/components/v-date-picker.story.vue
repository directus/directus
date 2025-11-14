<script setup lang="ts">
import { ref } from 'vue';
import VDatePicker from './v-date-picker.vue';

const type = ref<'date' | 'time' | 'dateTime' | 'timestamp'>('dateTime');
const value = ref('');
</script>

<template>
	<Story title="VDatePicker">
		<v-date-picker v-model="value" :type />

		<template #controls>
			<HstSelect v-model="type" title="Type" :options="['date', 'time', 'dateTime', 'timestamp']" />
			<HstText v-model="value" title="Value" />
		</template>
	</Story>
</template>
