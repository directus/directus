<script setup lang="ts">
import api from '@/api';
import { useSettingsStore } from '@/stores/settings';
import { useUserStore } from '@/stores/user';
import { Field, SettingsOnboarding, UserOnboarding } from '@directus/types';
import { parseJSON } from '@directus/utils';
import { Ref, computed, ref, watchEffect } from 'vue';
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
	actions?: {
		next: () => Promise<any>;
	};
	transitions: {
		back: string | null;
		next: string | null;
	};
};

const { t } = useI18n();
const router = useRouter();
const settingsStore = useSettingsStore();
const userStore = useUserStore();

// Some databases that dont have a native json type may return strings
if (typeof settingsStore?.settings?.onboarding === 'string') {
	settingsStore.settings.onboarding = parseJSON(settingsStore.settings.onboarding);
}

if (typeof userStore?.currentUser?.onboarding === 'string') {
	userStore.currentUser.onboarding = parseJSON(userStore.currentUser.onboarding);
}

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
		actions: {
			next: async function () {
				isLoading.value = true;

				await api
					.patch(`/users/${userModel.value.id}`, {
						first_name: userModel.value.first_name,
						last_name: userModel.value.last_name,
						email: userModel.value.email,
						onboarding: JSON.stringify({
							primary_skillset: userModel.value.primary_skillset ?? null,
							wants_emails: userModel.value.wants_emails ?? false,
							retry_transmission: true,
						} satisfies UserOnboarding),
					})
					.then(() => userStore.hydrate());

				finishOnboarding();
			},
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
		actions: {
			next: async function () {
				await settingsStore
					.updateSettings({
						project_name: projectModel.value.project_name,
						project_url: projectModel.value.project_url,
						project_logo: projectModel.value.project_logo,
						project_color: projectModel.value.project_color,
						onboarding: JSON.stringify({
							project_use_case: projectModel.value.project_use_case ?? null,
						} satisfies SettingsOnboarding),
					})
					.then(() => settingsStore.hydrate());
			},
		},
		transitions: { back: 'welcome', next: 'user' },
	};
}

const currentSlideName = ref('welcome'); // Important that this matches a key in slides
const isLoading = ref(false);
const error = ref<unknown>(null);
const notice = ref<HTMLDivElement | null>(null);
const doubleClickPreventionTimerMs = 500;
const isNextBtnDisabled = ref(false);

watchEffect(() => {
	if (!notice.value) {
		return;
	}

	notice.value.scrollIntoView({ behavior: 'smooth' });
});

// Active means non-null slides because they would affect the progress-percentage
const activeSlideNames = computed(() => Object.keys(slides.value).filter((key) => slides.value[key]));
const currentSlideIndex = computed(() => activeSlideNames.value.findIndex((key) => key === currentSlideName.value));
const currentSlide = computed(() => slides.value[currentSlideName.value]);
const isFirstSlide = computed(() => currentSlide.value?.transitions.back === null);
const isNavigationDisabled = computed(() => isLoading.value || isNextBtnDisabled.value);

// Add one so that there is progress on the first slide
const progressPercent = computed(() => ((currentSlideIndex.value + 1) / activeSlideNames.value.length) * 100);

function finishOnboarding() {
	isLoading.value = true;
	error.value = null;
	// Dont await the result, similar to telemetry
	// It might fail but proceed as normal for seamless user experience
	api.post(`/onboarding/${userStore.currentUser?.id}/send`).catch(() => {});
	router.replace('/content');
}

function skipOnboarding() {
	isLoading.value = true;
	error.value = null;
	finishOnboarding();
}

async function nextSlide() {
	if (!currentSlide.value?.transitions.next) {
		return;
	}

	// To prevent accidental double clicks skipping over a slide
	isNextBtnDisabled.value = true;
	setTimeout(() => (isNextBtnDisabled.value = false), doubleClickPreventionTimerMs);

	error.value = null;

	if (currentSlide.value.actions?.next) {
		try {
			await currentSlide.value.actions.next();
			currentSlideName.value = currentSlide.value.transitions.next;
		} catch (err) {
			error.value = err;
			isLoading.value = false;
		}
	} else {
		currentSlideName.value = currentSlide.value.transitions.next;
	}
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
							<div v-md="{ value: t(currentSlide?.i18nText), target: '_blank' }" class="text-content" />
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

			<!-- Error -->
			<Transition name="dialog">
				<div v-if="error" ref="notice" class="notice-error">
					<v-notice type="danger">{{ t('unexpected_error_copy') }}</v-notice>
				</div>
			</Transition>

			<!-- Actions -->
			<div class="actions">
				<!-- Left Actions -->
				<div></div>
				<!-- Right Actions -->
				<div>
					<v-button v-if="!isLoading" :disabled="isNavigationDisabled" @click="nextSlide">
						{{ isFirstSlide ? t('onboarding.action.first') : t('onboarding.action.saveAndContinue') }}
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

.notice-error,
.notice-error > .v-notice {
	width: 100%;
}
</style>
