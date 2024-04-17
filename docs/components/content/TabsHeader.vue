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


<style scoped lang="scss">
.tabs-header {
	width: 100%;
	border-bottom: 1px solid var(--border-2);
	background: var(--background--subdued);
	position: relative;
	border-top-left-radius: var(--border-radius);
	border-top-right-radius: var(--border-radius);
}
button {
	background: none;
	border: none;
	border-bottom: 1px solid transparent;
	margin-bottom: -1px;
	cursor: pointer;
	padding: 0.5rem 0.75rem;
	font-weight: 500;
	&:not(:last-child) {
		border-right: 1px solid var(--border-2);
	}
}
button.active {
	border-bottom-color: var(--primary);
	color: var(--primary);
}
</style>
