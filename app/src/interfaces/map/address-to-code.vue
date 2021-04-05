<template>
	<v-menu attached>
		<template #activator="{ activate }">
			<v-input
				class="address-to-code"
				:placeholder="$t('interfaces.map.address-to-code')"
				v-model="searchQuery"
				@focus="activate"
				:disabled="disabled"
			>
				<template #prepend>
					<v-icon name="search" />
				</template>
			</v-input>
		</template>
		<v-list>
			<v-skeleton-loader v-if="loading" type="list-item-icon"></v-skeleton-loader>
			<template v-else-if="suggestions.length > 0">
				<v-list-item v-for="item in suggestions" :key="item.place_id" @click="() => emitSelection(item)">
					<v-list-item-icon>
						<img v-if="item.icon" :src="item.icon" class="location-icon" />
					</v-list-item-icon>
					<v-list-item-content>
						{{ item.display_name }}
						<div class="location-latlng">
							{{ $t('interfaces.map.lat') }}: {{ item.lat }}, {{ $t('interfaces.map.lng') }}: {{ item.lon }}
						</div>
					</v-list-item-content>
				</v-list-item>
			</template>
			<v-list-item v-else>
				{{ $t('no_items') }}
			</v-list-item>
		</v-list>
	</v-menu>
</template>

<script lang="ts">
import i18n from '@/lang';
import { defineComponent, ref, watch } from '@vue/composition-api';
import axios from 'axios';

export default defineComponent({
	props: {
		disabled: {
			type: Boolean,
			default: false,
		},
	},
	setup(props, { emit }) {
		const error = ref<string | null>(null);
		const searchQuery = ref<string | null>(null);
		const suggestions = ref<any[]>([]);
		const cached = ref<Map<string, any>>(new Map());
		const loading = ref<boolean>(false);
		const token = ref(0);

		watch(searchQuery, makeQuery);

		return {
			emitSelection,
			searchQuery,
			error,
			suggestions,
			loading,
		};

		function emitSelection(record: any) {
			searchQuery.value = record.display_name || `${record.lat}, ${record.lon}`;
			emit('select', { lat: record.lat, lng: record.lon });
		}

		function makeQuery(newValue: string | null, oldValue: string | null) {
			if (!newValue || newValue === oldValue) return;

			const query = encodeURIComponent(newValue.trim());

			if (cached.value.has(query)) {
				suggestions.value = cached.value.get(query);
			} else {
				loading.value = true;
				token.value++;
				makeRequest(query, token.value);
			}
		}

		async function makeRequest(query: string, currentToken: number) {
			const response = await axios.get(`https://nominatim.openstreetmap.org/search?format=json&limit=10&q=${query}`);
			if (currentToken !== token.value) return;

			loading.value = false;
			if (response.status === 200) {
				suggestions.value = response.data;
				cached.value.set(query, response.data);
			} else {
				error.value = i18n.t('interfaces.map.address-to-code-error').toString();
			}
		}
	},
});
</script>

<style lang="scss" scoped>
.address-to-code {
	margin-bottom: 7px;
}
.location-latlng {
	color: var(--foreground-subdued);
	font-size: 0.8em;
}
.location-icon {
	flex: 0;
	width: 1em;
	height: 1em;
	margin-inline-end: 0.5em;
}
</style>
