<script setup>
import TabsHeader from './TabsHeader'

const activeTabIndex = ref(0)

const onChangeActiveTab = (index) => {
  activeTabIndex.value = index
}

const slots = useSlots()

const renderSlots = () => {
  return (slots.default() || []).map((slot, index) => {
    return h('div', {
      style: {
        display: index === activeTabIndex.value ? 'block' : 'none',
      },
    }, (slot.children)?.default() || h('div'))
  })
}

const render = () => {
	return h('div', {
		class: { 'tabs-container': true }
	},
	[
		h(TabsHeader, {
			activeTabIndex: activeTabIndex.value,
			tabs: slots.default().map((slot, index) => ({
				label: slot?.props?.filename || slot?.props?.label || slot?.props?.title || `${index}`,
				active: slot?.props?.active || false,
				component: slot,
			})),
			'onUpdate:activeTabIndex': onChangeActiveTab,
		}),
		h('div', { class: 'tabs-content', text: activeTabIndex.value }, renderSlots()),
	]
)}
</script>

<template>
  <render />
</template>

<style scoped>
.tabs-container {
	border: 1px solid black;
}
</style>
