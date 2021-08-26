<template>
	<div ref="layoutElement" class="layout-map">
		<map-component
			ref="map"
			class="mapboxgl-map"
			:class="{ loading, error: error || geojsonError || !geometryOptions }"
			:data="geojson"
			:feature-id="featureId"
			:selection="selection"
			:camera="cameraOptions"
			:bounds="geojsonBounds"
			:source="directusSource"
			:layers="directusLayers"
			@featureclick="handleClick"
			@featureselect="updateSelection"
			@moveend="cameraOptions = $event"
			@fitdata="removeLocationFilter"
		/>

		<v-button
			v-if="!autoLocationFilter && locationFilterOutdated"
			small
			class="location-filter"
			@click="updateLocationFilter"
		>
			{{ t('layouts.map.search_this_area') }}
		</v-button>

		<transition name="fade">
			<v-info v-if="error" type="danger" :title="t('unexpected_error')" icon="error" center>
				{{ t('unexpected_error_copy') }}
				<template #append>
					<v-error :error="error" />
					<v-button small class="reset-preset" @click="resetPresetAndRefresh">
						{{ t('reset_page_preferences') }}
					</v-button>
				</template>
			</v-info>
			<v-info
				v-else-if="geojsonError"
				type="warning"
				icon="wrong_location"
				center
				:title="t('layouts.map.invalid_geometry')"
			>
				{{ geojsonError }}
			</v-info>
			<v-progress-circular v-else-if="loading || geojsonLoading" indeterminate x-large class="center" />
			<slot
				v-else-if="itemCount === 0 && (searchQuery || activeFilterCount > 0 || !locationFilterOutdated)"
				name="no-results"
			/>
		</transition>

		<template v-if="loading || itemCount > 0">
			<div class="footer">
				<div class="pagination">
					<v-pagination
						v-if="totalPages > 1"
						:length="totalPages"
						:total-visible="7"
						show-first-last
						:model-value="page"
						@update:model-value="toPage"
					/>
				</div>
				<div class="mapboxgl-ctrl-dropdown">
					<span>{{ t('limit') }}</span>
					<v-select
						:model-value="limit"
						:items="[
							{
								text: n(100),
								value: 100,
							},
							{
								text: n(1000),
								value: 1000,
							},
							{
								text: n(10000),
								value: 10000,
							},
							{
								text: n(100000),
								value: 100000,
							},
						]"
						inline
						@update:model-value="limit = +$event"
					/>
				</div>
			</div>
		</template>
	</div>
</template>

<script lang="ts">
import { useI18n } from 'vue-i18n';
import { defineComponent, toRefs } from 'vue';

import MapComponent from './components/map.vue';
import { useLayoutState } from '@directus/shared/composables';

export default defineComponent({
	components: { MapComponent },
	setup() {
		const { t, n } = useI18n();
		const layoutState = useLayoutState();

		const {
			loading,
			error,
			geojsonError,
			geometryOptions,
			geojson,
			featureId,
			selection,
			geojsonBounds,
			directusSource,
			directusLayers,
			handleClick,
			updateSelection,
			cameraOptions,
			resetPresetAndRefresh,
			geojsonLoading,
			itemCount,
			searchQuery,
			activeFilterCount,
			totalPages,
			page,
			toPage,
			limit,
			autoLocationFilter,
			locationFilterOutdated,
			updateLocationFilter,
			removeLocationFilter,
		} = toRefs(layoutState.value);

		return {
			t,
			loading,
			error,
			geojsonError,
			geometryOptions,
			geojson,
			featureId,
			selection,
			cameraOptions,
			geojsonBounds,
			directusSource,
			directusLayers,
			handleClick,
			updateSelection,
			resetPresetAndRefresh,
			geojsonLoading,
			itemCount,
			searchQuery,
			activeFilterCount,
			totalPages,
			page,
			toPage,
			limit,
			n,
			autoLocationFilter,
			locationFilterOutdated,
			updateLocationFilter,
			removeLocationFilter,
		};
	},
});
</script>

<style lang="scss">
.mapboxgl-ctrl-dropdown {
	display: flex;
	align-items: center;
	justify-content: space-between;
	height: 36px;
	padding: 10px;
	color: var(--foreground-subdued);
	background-color: var(--background-subdued);
	border: var(--border-width) solid var(--background-subdued);
	border-radius: var(--border-radius);

	span {
		width: auto;
		margin-right: 4px;
	}

	.v-select {
		color: var(--foreground-normal);
	}
}
</style>

<style lang="scss">
.layout-map .mapboxgl-map .mapboxgl-canvas-container {
	transition: opacity 0.2s;
}

.layout-map .mapboxgl-map.loading .mapboxgl-canvas-container {
	opacity: 0.9;
}

.layout-map .mapboxgl-map.error .mapboxgl-canvas-container {
	opacity: 0.4;
}
</style>

<style lang="scss" scoped>
.layout-map {
	position: relative;
	width: 100%;
	height: calc(100% - 65px);
}

.center {
	position: absolute;
	top: 50%;
	left: 50%;
	-webkit-transform: translate(-50%, -50%);
	transform: translate(-50%, -50%);
}

.location-filter {
	position: absolute;
	top: 10px;
	left: 50%;
	transform: translate(-50%, 0%);
}

.v-progress-circular {
	--v-progress-circular-background-color: var(--primary-25);
	--v-progress-circular-color: var(--primary-75);
}

.reset-preset {
	margin-top: 24px;
}

.delete-action {
	--v-button-background-color: var(--danger-10);
	--v-button-color: var(--danger);
	--v-button-background-color-hover: var(--danger-25);
	--v-button-color-hover: var(--danger);
}

.custom-layers {
	padding: var(--content-padding);
	padding-top: 0;
}

.v-info {
	padding: 40px;
	background-color: var(--background-page);
	border-radius: var(--border-radius);
	box-shadow: var(--card-shadow);
	pointer-events: none;
}

.v-info > :deep(.v-button) {
	pointer-events: initial;
}

.footer {
	position: absolute;
	right: 10px;
	bottom: 10px;
	left: 10px;
	display: flex;
	align-items: center;
	justify-content: space-between;
	box-sizing: border-box;
	overflow: hidden;
	background-color: transparent !important;

	.pagination {
		--v-button-height: 28px;

		display: inline-block;

		button {
			box-shadow: 0 0 2px 1px rgba(0, 0, 0, 0.2);
		}
	}
}
</style>
