<script setup lang="ts">
import { useLoop, useTresContext } from '@tresjs/core';
import { usePreferredReducedMotion } from '@vueuse/core';
import { Color } from 'three';
import {
	cos,
	float,
	floor,
	fract,
	length,
	mix,
	mx_noise_float,
	screenCoordinate,
	sin,
	smoothstep,
	time,
	uniform,
	vec2,
	vec3,
} from 'three/tsl';
import { MeshBasicNodeMaterial } from 'three/webgpu';
import { onBeforeUnmount, watch } from 'vue';

interface Props {
	projectColor?: string | null;
}

const props = defineProps<Props>();

const { sizes } = useTresContext();

const DEFAULT_PRIMARY = '#6644ff';

// Grid spacing and dot radius range in CSS pixels — dots never vanish below the min.
const CELL_SIZE_PX = 30;
const DOT_RADIUS_MIN_PX = 0.0;
const DOT_RADIUS_MAX_PX = 2.0;
const DOT_ALPHA_MIN = 0.25;

// 3D noise field: scale is noise-space step per cell, speed is noise-space drift per second.
const NOISE_SCALE = 0.038;
const NOISE_SPEED = 0.05;

// Each dot swings on an arc around a pivot offset by this distance (the original's "inflate") —
// as the noise drifts, dots sweep along curves like fabric instead of pulsing in place.
const INFLATE_PX = 200;

// Second gradient stop: faint dots fade toward this fixed gray in both dark and light mode.
const COLOR_B = '#BBBBBB';

function resolveColor(input?: string | null): Color {
	if (!input) return new Color(DEFAULT_PRIMARY);

	try {
		return new Color(input);
	} catch {
		return new Color(DEFAULT_PRIMARY);
	}
}

const uColor = uniform(resolveColor(props.projectColor));
const uColorB = uniform(new Color(COLOR_B));
const uPixelRatio = uniform(sizes.pixelRatio.value);

watch(
	() => props.projectColor,
	(value) => {
		uColor.value.copy(resolveColor(value));
	},
);

watch(sizes.pixelRatio, (value) => {
	uPixelRatio.value = value;
});

// screenCoordinate is in physical pixels; convert to CSS pixels so density is DPR-independent.
const cssCoord = screenCoordinate.div(uPixelRatio);

// Arc warp: the original rotates each dot by noise·45° around a pivot (INFLATE_PX, INFLATE_PX) away.
// Inverted here as a domain warp — for rotation θ around that pivot the displacement works out to
// (f·(1 − cosθ + sinθ), f·(1 − cosθ − sinθ)); subtracting it from the coordinate recovers the source cell.
const warpAngle = mx_noise_float(vec3(cssCoord.div(CELL_SIZE_PX).mul(NOISE_SCALE), time.mul(NOISE_SPEED))).mul(
	Math.PI * 0.25,
);

const warpX = float(1).sub(cos(warpAngle)).add(sin(warpAngle)).mul(INFLATE_PX);
const warpY = float(1).sub(cos(warpAngle)).sub(sin(warpAngle)).mul(INFLATE_PX);
const warped = cssCoord.sub(vec2(warpX, warpY));

// 3D noise sampled per cell (so dots stay round), drifting through the third dimension over time.
// Dots shrink and fade with the noise value, floored so dark regions keep faint dots.
const cell = floor(warped.div(CELL_SIZE_PX));
const noise = mx_noise_float(vec3(cell.mul(NOISE_SCALE), time.mul(NOISE_SPEED)));
const intensity = noise.max(0);
const radius = mix(float(DOT_RADIUS_MIN_PX), float(DOT_RADIUS_MAX_PX), intensity);

const cellUv = fract(warped.div(CELL_SIZE_PX));
// Distance from cell center, back in pixel units for a crisp 1px anti-aliased edge.
const distPx = length(cellUv.sub(vec2(0.5))).mul(CELL_SIZE_PX);
const dot = smoothstep(radius.add(1), radius, distPx).mul(mix(float(DOT_ALPHA_MIN), float(1), intensity));

const material = new MeshBasicNodeMaterial({
	transparent: true,
	depthWrite: false,
});

// Big/bright dots read as the primary; faint ones fade toward uColorB, riding the existing noise drift.
material.colorNode = mix(uColorB, uColor, intensity);
material.opacityNode = dot;

onBeforeUnmount(() => {
	material.dispose();
});

const { start, stop, onRender } = useLoop();
const reducedMotion = usePreferredReducedMotion();

// prefers-reduced-motion: stop the loop right after a frame renders so the static grid stays visible.
onRender(() => {
	if (reducedMotion.value === 'reduce') stop();
});

watch(reducedMotion, (value) => {
	if (value !== 'reduce') start();
});
</script>

<template>
	<!-- Oversized plane: the grid is computed in screen space, the mesh just needs to cover the viewport. -->
	<TresMesh :material="material">
		<TresPlaneGeometry :args="[200, 200]" />
	</TresMesh>
</template>
