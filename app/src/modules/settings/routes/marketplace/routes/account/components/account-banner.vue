<script setup lang="ts">
import VBanner from '@/components/v-banner.vue';
import type { RegistryAccountResponse } from '@directus/extensions-registry';
import { computed } from 'vue';

const props = defineProps<{
	account: RegistryAccountResponse['data'];
}>();

const hasMeta = computed(() => {
	const account = props.account;
	return !!account.github_location || !!account.github_company;
});
</script>

<template>
	<VBanner icon="person">
		<template v-if="account.github_avatar_url" #avatar>
			<div class="avatar">
				<img :src="account.github_avatar_url" :alt="account.github_name ?? account.username" />
			</div>
		</template>

		<h2 class="name">{{ account.github_name ?? account.username }}</h2>

		<template v-if="hasMeta" #subtitle>
			<p class="meta">
				<span v-if="account.github_location">
					<v-icon class="icon" small name="location_on" />
					{{ account.github_location }}
				</span>
				<span v-if="account.github_company">
					<v-icon class="icon" small name="work" />
					{{ account.github_company }}
				</span>
			</p>
		</template>
	</VBanner>
</template>

<style scoped lang="scss">
.avatar {
	position: relative;
	width: 100%;
	height: 100%;

	&::after {
		content: '';
		position: absolute;
		left: 0;
		top: 0;
		width: 100%;
		height: 100%;
		border-radius: 50%;
		box-shadow: inset 0px 0px 0px 2px #ffffff33;
	}

	img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		object-position: center center;
	}
}

.meta {
	.icon {
		vertical-align: -4px;
		margin-inline-end: 4px;
		display: inline-block;
	}

	span + span {
		&::before {
			content: ' • ';
		}
	}
}
</style>
