import api from '@/api';
import { ref, Ref } from 'vue';

export interface MiniApp {
	id: string;
	name: string;
	icon: string;
	description: string | null;
	ui_schema: any;
	css: string | null;
	script: string | null;
	status: 'draft' | 'published';
	date_created: string;
	date_updated: string | null;
	user_created: string | null;
	user_updated: string | null;
}

export function useMinis() {
	const minis: Ref<MiniApp[]> = ref([]);
	const loading = ref(false);
	const error = ref<Error | null>(null);

	async function fetchMinis() {
		loading.value = true;
		error.value = null;

		try {
			const response = await api.get('/minis', {
				params: {
					fields: ['id', 'name', 'icon', 'description', 'status', 'date_created'],
					sort: ['name'],
				},
			});

			minis.value = response.data.data;
		} catch (err) {
			error.value = err as Error;
		} finally {
			loading.value = false;
		}
	}

	async function createMiniApp(data: Partial<MiniApp>) {
		const miniAppData = {
			id: crypto.randomUUID(),
			...data,
		};

		const response = await api.post('/minis', miniAppData);
		await fetchMinis();
		return response.data.data;
	}

	async function deleteMiniApp(id: string) {
		await api.delete(`/minis/${id}`);
		await fetchMinis();
	}

	return {
		minis,
		loading,
		error,
		fetchMinis,
		createMiniApp,
		deleteMiniApp,
	};
}

export function useMiniApp(id: Ref<string>) {
	const miniApp: Ref<MiniApp | null> = ref(null);
	const loading = ref(false);
	const error = ref<Error | null>(null);

	async function fetchMiniApp() {
		if (!id.value) return;

		loading.value = true;
		error.value = null;

		try {
			const response = await api.get(`/minis/${id.value}`, {
				params: {
					fields: ['*'],
				},
			});

			const data = response.data.data;

			if (data && typeof data.ui_schema === 'string') {
				try {
					data.ui_schema = JSON.parse(data.ui_schema);
				} catch {
					data.ui_schema = null;
				}
			}

			miniApp.value = data;
		} catch (err) {
			error.value = err as Error;
		} finally {
			loading.value = false;
		}
	}

	async function updateMiniApp(data: Partial<MiniApp>) {
		if (!id.value) return;

		const response = await api.patch(`/minis/${id.value}`, data);
		miniApp.value = response.data.data;
		return response.data.data;
	}

	return {
		miniApp,
		loading,
		error,
		fetchMiniApp,
		updateMiniApp,
	};
}
