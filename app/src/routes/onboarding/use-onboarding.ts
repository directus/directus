import api from '@/api';
import { VALIDATION_TYPES } from '@/constants';
import { useUserStore } from '@/stores/user';
import { APIError } from '@/types/error';
import { User, UserOnboarding, ValidationError } from '@directus/types';
import { isArray } from 'lodash';
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import { getSlides } from './slides';

export function useOnboarding() {
	const router = useRouter();
	const userStore = useUserStore();
	const currentUser = userStore.currentUser as User;

	const slides = getSlides();
	const isLoading = ref(false);
	const validationErrors = ref<ValidationError[]>([]);
	const nextButtonDisabled = ref(false);
	const currentSlideIndex = ref(0);

	const currentSlide = computed(() => {
		const [key, slide] = Object.entries(slides)[currentSlideIndex.value]!;
		return { key, ...slide };
	});

	const isFirstSlide = computed(() => currentSlideIndex.value === 0);
	const isLastSlide = computed(() => currentSlideIndex.value === Math.max(0, Object.keys(slides).length - 1));
	// + 1 for initial progress on the first slide
	const progressPercent = computed(() => ((currentSlideIndex.value + 1) / Object.keys(slides).length) * 100);

	return {
		isLoading,
		validationErrors,
		nextButtonDisabled,
		currentSlide,
		isFirstSlide,
		isLastSlide,
		progressPercent,
		nextSlide,
		skipOnboarding,
	};

	async function skipOnboarding() {
		isLoading.value = true;

		try {
			await api.patch(`/users/${currentUser.id}`, {
				onboarding: JSON.stringify({
					primary_skillset: currentUser.onboarding?.primary_skillset ?? null,
					wants_emails: currentUser.onboarding?.wants_emails ?? false,
					retry_transmission: false,
				} satisfies UserOnboarding),
			});

			await userStore.hydrate();

			// Proceed immediately and swallow any errors for seamless user experience
			api.post(`/onboarding/${currentUser.id}/send`).catch(() => {});

			router.replace('/content');
		} catch (error: any) {
			if (isArray(error?.response?.data.errors)) {
				validationErrors.value = error.response.data.errors
					.filter((err: APIError) => VALIDATION_TYPES.includes(err?.extensions?.code))
					.map((err: APIError) => {
						return err.extensions;
					});
			}
		} finally {
			isLoading.value = false;
		}
	}

	async function nextSlide() {
		// Prevent accidental double clicks, skipping over a slide
		nextButtonDisabled.value = true;
		setTimeout(() => (nextButtonDisabled.value = false), 500);

		// Clean-up any previously encountered errors
		validationErrors.value = [];

		isLoading.value = true;

		try {
			await currentSlide.value.next?.();
			currentSlideIndex.value++;
		} catch (error: any) {
			if (isArray(error?.response?.data.errors)) {
				validationErrors.value = error.response.data.errors
					.filter((err: APIError) => VALIDATION_TYPES.includes(err?.extensions?.code))
					.map((err: APIError) => {
						return err.extensions;
					});
			}
		} finally {
			isLoading.value = false;
		}
	}
}
