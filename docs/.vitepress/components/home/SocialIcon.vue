<script setup lang="ts">
import LinkedIn from './icons/LinkedIn.vue';
import Docker from './icons/Docker.vue';
import NPM from './icons/NPM.vue';
import YouTube from './icons/YouTube.vue';
import Discord from './icons/Discord.vue';
import Twitter from './icons/Twitter.vue';
import GitHub2 from './icons/GitHub2.vue';

const iconsMap = {
	linkedin: LinkedIn,
	docker: Docker,
	npm: NPM,
	youtube: YouTube,
	discord: Discord,
	twitter: Twitter,
	github: GitHub2,
};

const props = defineProps<{
	url: string;
	icon: keyof typeof iconsMap;
}>();

const Comp = iconsMap[props.icon];
</script>

<template>
	<a class="social-icons" :href="url" target="_blank" rel="noreferrer noopener">
		<Comp />
	</a>
</template>

<style scoped>
.social-icons {
	font-size: 28px;
}
</style>
