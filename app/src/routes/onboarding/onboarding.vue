<script setup lang="ts">
import api from '@/api';
import { useServerStore } from '@/stores/server';
import { useSettingsStore } from '@/stores/settings';
import { useUserStore } from '@/stores/user';
import { collectOnboarding } from '@/utils/send-onboarding';
import { Field, SettingsOnboarding, UserOnboarding } from '@directus/types';
import { Ref, computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { useProjectFields } from './forms/project';
import { useUserFields } from './forms/user';

type OnboardingSlide = {
	i18nTitle: string;
	i18nText: string;
	form?: {
		model: Ref<object>;
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
	wants_emails: userStore.currentUser?.onboarding?.wants_emails ?? false,
	primary_skillset: userStore.currentUser?.onboarding?.primary_skillset,
});

const showProjectSlide = Boolean(settingsStore.settings?.onboarding) === false;

const slides: Ref<Record<string, OnboardingSlide>> = ref({
	welcome: {
		i18nTitle: 'onboarding.welcome.title',
		i18nText: 'onboarding.welcome.text',
		transitions: { back: null, next: showProjectSlide ? 'project' : 'user' },
	},
	project: null, // This slide is optional
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

const currentSlideName = ref('welcome'); // Important that this matches a key in slides
const isLoading = ref(false);
// Active means non-null slides because they would affect the progress-percentage
const activeSlideNames = computed(() => Object.keys(slides.value).filter((key) => slides.value[key]));
const currentSlideIndex = computed(() => activeSlideNames.value.findIndex((key) => key === currentSlideName.value));
const currentSlide = computed(() => slides.value[currentSlideName.value]);
const isFirstSlide = computed(() => currentSlide.value?.transitions.back === null);
const isLastSlide = computed(() => currentSlide.value?.transitions.next === 'finish');

// Add one so that there is progress on the first slide
const progressPercent = computed(() => ((currentSlideIndex.value + 1) / activeSlideNames.value.length) * 100);

async function finishOnboarding() {
	const settingUpdate = settingsStore
		.updateSettings({
			project_name: projectModel.value.project_name,
			project_url: projectModel.value.project_url,
			project_logo: projectModel.value.project_logo,
			project_color: projectModel.value.project_color,
			onboarding: JSON.stringify({
				project_use_case: projectModel.value.project_use_case ?? null,
			} satisfies SettingsOnboarding),
		})
		.then(() => serverStore.hydrate())
		.catch((e) => console.error('Error when updating settings', e));

	const userUpdate = api
		.patch(`/users/${userModel.value.id}`, {
			first_name: userModel.value.first_name,
			last_name: userModel.value.last_name,
			email: userModel.value.email, // TODO validate before!
			onboarding: JSON.stringify({
				primary_skillset: userModel.value.primary_skillset ?? null,
				wants_emails: userModel.value.wants_emails,
				retryTransmission: true,
			} satisfies UserOnboarding),
		})
		.then(() => userStore.hydrate())
		.catch((e) => console.error('Error when updating user', e));

	await Promise.allSettled([settingUpdate, userUpdate]);

	// Dont await the result, similar to telemetry
	// It might fail but proceed as normal for seamless user experience
	collectOnboarding().catch(() => {});

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

	const settingUpdate = settingsStore
		.updateSettings({
			onboarding: JSON.stringify({
				project_use_case: null,
			} satisfies SettingsOnboarding),
		})
		.then(() => serverStore.hydrate())
		.catch((e) => console.error('Error when updating settings', e));

	const userUpdate = api
		.patch(`/users/${userModel.value.id}`, {
			onboarding: JSON.stringify({
				primary_skillset: null,
				wants_emails: false,
				retryTransmission: false,
			} satisfies UserOnboarding),
		})
		.then(() => userStore.hydrate())
		.catch((e) => console.error('Error when updating user', e));

	await Promise.allSettled([settingUpdate, userUpdate]);

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

<template>
	<public-view :wide="true">
		<template #actions>
			<Transition name="dialog">
				<v-button
					v-if="!isLoading"
					secondary
					x-small
					kind="link"
					:disabled="isLoading"
					class="btn-skip"
					@click="skipOnboarding"
				>
					{{ t('onboarding.action.skip') }}
				</v-button>
			</Transition>
		</template>

		<div class="container">
			<!-- Top Navbar -->
			<div class="nav">
				<v-progress-linear :value="progressPercent" rounded :indeterminate="isLoading"></v-progress-linear>
			</div>

			<!-- Content -->
			<div class="onboarding-slides">
				<Transition name="dialog" mode="out-in">
					<div :key="currentSlideName" class="slide">
						<div class="intro-text">
							<h2 class="type-title">{{ t(currentSlide?.i18nTitle) }}</h2>
							<div class="text-content" v-md="t(currentSlide?.i18nText)"></div>
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
					<v-button v-if="!isLoading" :disabled="isLoading" @click="nextSlide">
						{{
							isFirstSlide
								? t('onboarding.action.first')
								: isLastSlide
								? t('onboarding.action.last')
								: t('onboarding.action.continue')
						}}
					</v-button>
				</div>
			</div>
		</div>
	</public-view>
</template>

<style lang="scss" scoped>
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
	width: 100%;
}

.btn-skip {
	:deep(button) {
		color: var(--foreground-subdued);
	}
}

.intro-text {
	max-width: 600px;
	margin-bottom: 64px;

	.type-title {
		margin-bottom: 1em;
	}

	:deep() {
		@import '@/styles/markdown';
	}
}
</style>
