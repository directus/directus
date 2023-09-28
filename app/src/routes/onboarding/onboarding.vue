<template>
	<div class="container">
		<!-- Top Navbar -->
		<div class="nav">
			<!-- Directus Logo -->
			<div class="logo-container">
				<div class="logo" :class="{ running: isLoading }"></div>
				<h1 class="logo-type">directus</h1>
			</div>

			<v-progress-linear :value="progressPercent" rounded :indeterminate="isLoading"></v-progress-linear>
		</div>

		<!-- Content -->
		<div class="onboarding-slides">
			<!-- Test First Slide -->
			<Transition name="dialog" mode="out-in">
				<component :is="slides[0]" v-if="currentSlideIndex === 0"></component>
				<component :is="slides[1]" v-else-if="currentSlideIndex === 1"></component>
				<component :is="slides[2]" v-else-if="currentSlideIndex === 2"></component>
				<component :is="LastSlide" v-else-if="currentSlideIndex === 3"></component>
			</Transition>
		</div>

		<!-- Actions -->
		<div class="actions">
			<!-- Left Actions -->
			<div>
				<Transition name="dialog">
					<v-button v-if="!isLoading" secondary :disabled="isLoading || isFirstSlide" @click="prevSlide">
						{{ t('back') }}
					</v-button>
				</Transition>
				<Transition name="dialog">
					<v-button v-if="!isLoading" secondary :disabled="isLoading" @click="skipSlide" class="btn-skip">
						{{ t('skip') }}
					</v-button>
				</Transition>
			</div>
			<!-- Right Actions -->
			<div>
				<v-button @click="nextSlide" v-if="!isLoading" :disabled="isLoading">
					{{ isLastSlide ? t('finish_setup') : t('next') }}
				</v-button>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import LastSlide from './slides/last-slide.vue';
import ProjectSlide from './slides/project.vue';
import UserSlide from './slides/user.vue';
import WelcomeSlide from './slides/welcome.vue';

const { t } = useI18n();
const currentSlideIndex = ref(0);
const slides = [WelcomeSlide, ProjectSlide, UserSlide];
// const slides = [ 1, 2, 3 ];
const slideCount = slides.length;
const progressPercent = computed(() => (currentSlideIndex.value / slideCount) * 100);
const isFirstSlide = computed(() => currentSlideIndex.value === 0);
const isLastSlide = computed(() => currentSlideIndex.value === slideCount - 1);
const isLoading = ref(false);
const router = useRouter();

function prevSlide() {
	currentSlideIndex.value = Math.max(currentSlideIndex.value - 1, 0);
}
async function skipSlide() {
	if (isLastSlide.value) {
		isLoading.value = true;
		setTimeout(() => {
			router.replace('/content');
		}, 3000);
	}
	currentSlideIndex.value += 1;
}
async function nextSlide() {
	if (isLastSlide.value) {
		isLoading.value = true;
		setTimeout(() => {
			router.replace('/content');
		}, 3000);
	}
	currentSlideIndex.value += 1;
}
</script>

<style scoped>
.container {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: 64px;
	padding: 64px 16px;
	margin-left: auto;
	margin-right: auto;
	width: 100%;
}

@media (min-width: 640px) {
	.container {
		max-width: 640px;
	}
}
@media (min-width: 768px) {
	.container {
		max-width: 768px;
	}
}
@media (min-width: 1024px) {
	.container {
		max-width: 1024px;
	}
}

.nav {
	display: flex;
	flex-direction: column;
	justify-content: start;
	align-items: start;
	width: 100%;
	gap: 16px;
}

.actions {
	width: 100%;
	display: flex;
	flex-direction: row;
	justify-content: space-between;
	align-items: center;
}

.actions > div {
	display: flex;
	flex-direction: row;
	gap: 16px;
}

.onboarding-slides {
	/* min-height: 300px; */
	width: 100%;
}

.logo {
	width: 80px;
	height: 64px;
	background-image: url('@/assets/sprite.svg');
	background-position: 0% 0%;
	background-size: 1200px 64px;
}

.logo-container {
	display: flex;
	flex-direction: row;
	align-items: center;
	font-style: italic;
	letter-spacing: -1px;
	gap: 16px;
}

.logo-type {
	font-size: 38px;
}

.logo.running {
	animation: 560ms run steps(14) infinite;
}

@keyframes run {
	100% {
		background-position: 100%;
	}
}
</style>
