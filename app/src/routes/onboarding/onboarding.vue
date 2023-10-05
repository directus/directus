<template>
	<public-view :wide="true">
		<div class="container">
			<!-- Top Navbar -->
			<div class="nav">
				<v-progress-linear :value="progressPercent" rounded :indeterminate="isLoading"></v-progress-linear>
			</div>

			<!-- Content -->
			<div class="onboarding-slides">
				<Transition name="dialog" mode="out-in">
					<div class="slide" :key="currentSlideName">
						<div class="intro-text">
							<h1 class="type-title">{{ t(currentSlide?.i18nTitle) }}</h1>
							<p class="type-text">{{ t(currentSlide?.i18nText) }}</p>
						</div>
						<v-form
							v-if="currentSlide?.form"
							v-model="currentSlide.form.model"
							:fields="currentSlide.form.fields"
							:autofocus="true"
						/>
					</div>
				</Transition>
			</div>

			<!-- Actions -->
			<div class="actions">
				<!-- Left Actions -->
				<div>
					<Transition name="dialog">
						<v-button
							v-if="!isLoading"
							secondary
							:disabled="isLoading || !currentSlide?.transitions.back"
							@click="prevSlide"
						>
							{{ t('back') }}
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
			<Transition name="dialog">
				<v-button v-if="!isLoading" secondary xSmall :disabled="isLoading" @click="skipOnboarding" class="btn-skip">
					{{ t('onboarding.skip') }}
				</v-button>
			</Transition>
		</div>
	</public-view>
</template>

<script setup lang="ts">
import api from '@/api';
import { useServerStore } from '@/stores/server';
import { useSettingsStore } from '@/stores/settings';
import { useUserStore } from '@/stores/user';
import { Field } from '@directus/types';
import { Ref, computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { useProjectFields } from './forms/project';
import { useUserFields } from './forms/user';

type OnboardingPayload = {
	version: 1;
	body: {
		user?: {
			email?: string;
			wants_emails?: boolean;
			primary_skillset?: string;
		};
		project?: {
			name?: string;
			url?: string;
			type?: string;
		};
	};
};

type OnboardingSlide = {
	i18nTitle: string;
	i18nText: string;
	form?: {
		model: Ref<{}>;
		fields: Field[];
	};
	transitions: {
		back: string | null;
		next: string | null;
	};
};

const { t } = useI18n();
const router = useRouter();
const settingsStore = useSettingsStore();
const serverStore = useServerStore();
const userStore = useUserStore();

// Split up the v-form models from the payload,
// so that we need to explicitly choose fields that we want to add
// Note: The models must match the field names of the v-forms
const projectModel = ref({
	project_name: settingsStore.settings?.project_name,
	project_url: settingsStore.settings?.project_url,
	project_logo: settingsStore.settings?.project_logo,
	project_color: settingsStore.settings?.project_color,
	project_use_case: settingsStore.settings?.onboarding?.project_use_case,
});
const userModel = ref({
	id: userStore.currentUser?.id,
	first_name: userStore.currentUser?.first_name,
	last_name: userStore.currentUser?.last_name,
	email: userStore.currentUser?.email,
	wants_emails: false,
	primary_skillset: userStore.currentUser?.onboarding?.primary_skillset,
});

const showProjectSlide = Boolean(settingsStore.settings?.onboarding) === false;
const slides: Ref<Record<string, OnboardingSlide>> = ref({
	welcome: {
		i18nTitle: 'onboarding.welcome.title',
		i18nText: 'onboarding.welcome.text',
		transitions: { back: null, next: showProjectSlide ? 'project' : 'user' },
	},
	user: {
		i18nTitle: 'onboarding.user.title',
		i18nText: 'onboarding.user.text',
		form: {
			model: userModel,
			fields: useUserFields(),
		},
		transitions: { back: showProjectSlide ? 'project' : 'welcome', next: 'finish' },
	},
	finish: {
		i18nTitle: 'onboarding.loading.title',
		i18nText: 'onboarding.loading.text',
		transitions: {
			back: null,
			next: null,
		},
	},
});
if (showProjectSlide) {
	slides.value.project = {
		i18nTitle: 'onboarding.project.title',
		i18nText: 'onboarding.project.text',
		form: {
			model: projectModel,
			fields: useProjectFields(),
		},
		transitions: { back: 'welcome', next: 'user' },
	};
}

const slideCount = showProjectSlide ? 3 : 2;
const currentSlideName = ref('welcome'); // Important that this matches a key in slides
const currentSlideIndex = ref(0);
const currentSlide = computed(() => slides.value[currentSlideName.value]);
const isLastSlide = computed(() => currentSlide.value?.transitions.next === 'finish');
const progressPercent = computed(() => (currentSlideIndex.value / slideCount) * 100);
const isLoading = ref(false);

async function finishOnboarding() {
	const settingUpdate = settingsStore
		.updateSettings({
			project_name: projectModel.value.project_name,
			project_url: projectModel.value.project_url,
			project_logo: projectModel.value.project_logo,
			project_color: projectModel.value.project_color,
			onboarding: JSON.stringify({ project_use_case: projectModel.value.project_use_case }),
		})
		.then(() => serverStore.hydrate())
		.catch((e) => console.error('Error when updating settings', e));

	const userUpdate = api
		.patch(`/users/${userModel.value.id}`, {
			first_name: userModel.value.first_name,
			last_name: userModel.value.last_name,
			email: userModel.value.email, // TODO validate before!
			onboarding: JSON.stringify({ primary_skillset: userModel.value.primary_skillset }),
		})
		.then(() => userStore.hydrate())
		.catch((e) => console.error('Error when updating user', e));

	// TODO: Remove fields when $TELEMETRY is set
	const onboarding: OnboardingPayload = {
		version: 1,
		body: {
			user: {
				email: userModel.value.email,
				wants_emails: userModel.value.wants_emails,
				primary_skillset: userModel.value.primary_skillset,
			},
			project: {
				name: projectModel.value.project_name,
				url: projectModel.value.project_url ?? undefined,
				type: projectModel.value.project_use_case,
			},
		},
	};
	// TODO: Do telemetry

	await Promise.allSettled([settingUpdate, userUpdate]);
	return router.replace('/content');
}

function prevSlide() {
	if (!currentSlide.value?.transitions.back) {
		return;
	}
	currentSlideName.value = currentSlide.value?.transitions.back;
}

async function skipOnboarding() {
	isLoading.value = true;
	const userUpdate = api
		.patch(`/users/${userModel.value.id}`, {
			onboarding: '{}',
		})
		.then(() => userStore.hydrate())
		.catch((e) => console.error('Error when updating user', e));

	await Promise.allSettled([userUpdate]);
	router.replace('/content').finally(() => (isLoading.value = false));
}

async function nextSlide() {
	if (!currentSlide.value?.transitions.next) {
		return;
	}
	if (isLastSlide.value) {
		isLoading.value = true;
		// TODO remove artificial slowdown for seeing how it'd look on a slower connection
		setTimeout(() => {
			// Set the loading to false can be useful in case there were routing errors
			finishOnboarding().finally(() => (isLoading.value = false));
		}, 750);
	}
	currentSlideName.value = currentSlide.value.transitions.next;
}
</script>

<style scoped>
.container {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: 64px;
	padding: 64px 0;
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

.btn-skip {
	place-self: flex-end;
}

.onboarding-slides {
	width: 100%;
}

.logo-wrapper {
	padding: 8px 12px;
	border-radius: var(--border-radius-outline);
	width: 64px;
	height: 64px;
	background-color: var(--purple);
	display: flex;
	justify-content: center;
	align-items: center;
}
.logo {
	width: 40px;
	height: 32px;
	transform: translateY(4px); /* To center the animated rabbit because the sprite has too much height */
	background-image: url('@/assets/sprite.svg');
	background-position: 0% 0%;
	background-size: 600px 32px;
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

.intro-text {
	margin-bottom: 64px;
}

/* Inherits from global class */
.type-title {
	margin-bottom: 8px;
}
/* Inherits from global class */
.type-text {
	max-width: 600px;
}
</style>
