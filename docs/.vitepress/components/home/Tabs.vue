<template>
	<div class="tabs">
		<div class="tab-buttons">
			<button :class="{ active: activeTab === 'tab1' }" @click="changeTab('tab1')">Developer Reference</button>
			<button :class="{ active: activeTab === 'tab2' }" @click="changeTab('tab2')">User Guide</button>
		</div>
		<div>
			<div v-if="activeTab === 'tab1'" class="tab-content">
				<DocCard
					title="Authentication"
					desc="Directus provides powerful authentication capabilities to effortlessly implement a robust authentication system."
					url="https://www.google.com/"
				>
					<template v-slot:icon>
						<Auth />
					</template>
				</DocCard>
				<DocCard
					title="GraphQL"
					desc="Directus provides powerful authentication capabilities to effortlessly implement a robust authentication system."
					url="https://www.google.com/"
				>
					<template v-slot:icon>
						<GraphQL />
					</template>
				</DocCard>
				<DocCard
					title="APIs"
					desc="Directus provides powerful authentication capabilities to effortlessly implement a robust authentication system."
					url="https://www.google.com/"
				>
					<template v-slot:icon>
						<API />
					</template>
				</DocCard>
				<DocCard
					title="Extensions"
					desc="Directus provides powerful authentication capabilities to effortlessly implement a robust authentication system."
					url="https://www.google.com/"
				>
					<template v-slot:icon>
						<Extension />
					</template>
				</DocCard>
				<DocCard
					title="Real Time"
					desc="Directus provides powerful authentication capabilities to effortlessly implement a robust authentication system."
					url="https://www.google.com/"
				>
					<template v-slot:icon>
						<RealTime />
					</template>
				</DocCard>
				<DocCard
					title="Self Hosting"
					desc="Directus provides powerful authentication capabilities to effortlessly implement a robust authentication system."
					url="https://www.google.com/"
				>
					<template v-slot:icon>
						<SelfHosting />
					</template>
				</DocCard>
			</div>
			<div v-else-if="activeTab === 'tab2'" class="tab-content">
				<DocCard
					title="Authentication"
					desc="Directus provides powerful authentication capabilities to effortlessly implement a robust authentication system."
					url="https://www.google.com/"
				>
					<template v-slot:icon>
						<Auth />
					</template>
				</DocCard>
				<DocCard
					title="GraphQL"
					desc="Directus provides powerful authentication capabilities to effortlessly implement a robust authentication system."
					url="https://www.google.com/"
				>
					<template v-slot:icon>
						<GraphQL />
					</template>
				</DocCard>
				<DocCard
					title="APIs"
					desc="Directus provides powerful authentication capabilities to effortlessly implement a robust authentication system."
					url="https://www.google.com/"
				>
					<template v-slot:icon>
						<API />
					</template>
				</DocCard>
			</div>
		</div>
	</div>
</template>

<script>
import DocCard from './DocCard.vue';
import Auth from './icons/Auth.vue';
import GraphQL from './icons/GraphQL.vue';
import API from './icons/API.vue';
import Extension from './icons/Extension.vue';
import RealTime from './icons/RealTime.vue';
import SelfHosting from './icons/SelfHosting.vue';

export default {
	data() {
		return {
			activeTab: 'tab1',
		};
	},
	components: {
		DocCard,
		Auth,
		GraphQL,
		API,
		Extension,
		RealTime,
		SelfHosting,
	},
	methods: {
		changeTab(tab) {
			this.activeTab = tab;
		},
	},
};
</script>

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
