import { provide } from 'vue';
import api from '@/api';
import * as stores from '@/stores';
import { API_INJECT, STORES_INJECT } from '@directus/shared/constants';

export default function useSystem(): void {
	provide(STORES_INJECT, stores);
	provide(API_INJECT, api);
}
