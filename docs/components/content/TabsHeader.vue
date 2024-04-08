<script setup>
defineProps({
	tabs: {
		type: Object,
		required: true
	},
	activeTabIndex: {
		type: Number,
		required: true
	}
})

const emit = defineEmits(['update:activeTabIndex'])

const updateTabs = ($event, i) => {
  emit('update:activeTabIndex', i)
}
</script>

<template>
	<div class="tabs-header">
		<div v-if="tabs" class="tabs">
			<button
				v-for="({ label }, i) in tabs"
				:key="`${i}${label}`"
				:class="[activeTabIndex === i ? 'active' : 'not-active']"
				@click="updateTabs($event, i)"
			>
				{{ label }}
			</button>
		</div>
	</div>
</template>


<style scoped>
button.active {
	background: green;
}
</style>
