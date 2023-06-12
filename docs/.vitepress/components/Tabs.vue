<script setup lang="ts">
import { ref } from 'vue';

interface TabsProps {
	tabs: string[];
}

const props = defineProps<TabsProps>();

const activeTab = ref(props.tabs[0]);
</script>

<template>
	<div class="tabs">
		<div class="tab-buttons">
			<button v-for="tab in tabs" :class="{ active: activeTab === tab }" @click="activeTab = tab">{{ tab }}</button>
		</div>
		<div>
			<template v-for="tab in tabs">
				<div class="tab-content" v-if="activeTab === tab">
					<slot :name="tab.toLowerCase().replaceAll(' ', '-')" />
				</div>
			</template>
		</div>
	</div>
</template>

<style scoped>
.tabs {
	padding: 120px;
}

.tab-buttons {
	display: flex;
	justify-content: space-between;
	max-width: 560px;
	margin: 0 auto;
	text-align: center;
}

.tab-buttons button {
	background: white;
	color: #a3a7ac;
	cursor: pointer;
	border: none;
	font-size: 32px;
	font-weight: bold;
}

.tab-buttons button.active {
	color: black;
	text-decoration: underline;
	text-decoration-color: #6543fa75;
	text-underline-offset: 16px;
}

.tab-content {
	display: grid;
	grid-template-columns: repeat(3, 1fr);
	gap: 24px;
	padding-top: 60px;
}

@media only screen and (max-width: 768px) {
	.tabs {
		padding: 48px;
	}
	.tab-content {
		grid-template-columns: 1fr;
	}
	.tab-buttons button {
		font-size: 24px;
	}
}
</style>
