import api from '@/api';
import { VALIDATION_TYPES } from '@/constants';
import { useUserStore } from '@/stores/user';
import { APIError } from '@/types/error';
import { ValidationError } from '@directus/types';
import { isArray } from 'lodash';
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import { getSlides } from './slides';

export function useOnboarding() {
	const router = useRouter();
	const userStore = useUserStore();

	const slides = getSlides();

	const loading = ref(false);
	const validationErrors = ref<ValidationError[]>([]);
	const nextButtonDisabled = ref(false);

	const currentSlideIndex = ref(0);

	const currentSlide = computed(() => {
		const [key, slide] = Object.entries(slides)[currentSlideIndex.value]!;
		return { key, ...slide };
	});

	const isFirstSlide = computed(() => currentSlideIndex.value === 0);
	// + 1 for initial progress on the first slide
	const progressPercent = computed(() => ((currentSlideIndex.value + 1) / Object.keys(slides).length) * 100);

	return {
		loading,
		validationErrors,
		nextButtonDisabled,
		currentSlide,
		isFirstSlide,
		progressPercent,
		nextSlide,
		skipOnboarding,
	};

	function finishOnboarding() {
		loading.value = true;

		// Proceed immediately and swallow any errors for seamless user experience
		api.post(`/onboarding/${userStore.currentUser?.id}/send`).catch(() => {});

		router.replace('/content');
	}

	function skipOnboarding() {
		userStore.skippedOnboarding = true;
		finishOnboarding();
	}

	async function nextSlide() {
		// Prevent accidental double clicks, skipping over a slide
		nextButtonDisabled.value = true;
		setTimeout(() => (nextButtonDisabled.value = false), 500);

		// Clean-up any previously encountered errors
		validationErrors.value = [];

		if (currentSlide.value.next) {
			try {
				await currentSlide.value.next(finishOnboarding);

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
				loading.value = false;
			}
		} else {
			currentSlideIndex.value++;
		}
	}
}
