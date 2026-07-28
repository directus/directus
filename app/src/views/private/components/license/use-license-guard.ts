import { ref } from 'vue';
import { type RouteLocationRaw, useRouter } from 'vue-router';

export function useLicenseGuard(hasRemaining: () => boolean) {
	const limitModalOpen = ref(false);
	const router = useRouter();

	function navigate(to: RouteLocationRaw) {
		if (!hasRemaining()) return void (limitModalOpen.value = true);
		router.push(to);
	}

	return { limitModalOpen, navigate };
}
