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
.tabs-header {
	width: 100%;
	border-bottom: 1px solid var(--border);
	background: var(--border);
	position: relative;
}
button {
	background: none;
	border: none;
	border-bottom: 1px solid transparent;
	margin-bottom: -1px;
	cursor: pointer;
	padding: 0.5rem 0.75rem;
	font-weight: 500;
}
button.active {
	border-color: var(--primary);
	color: var(--primary);
}
</style>
