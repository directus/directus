<script setup lang="ts">
import { useTresContext } from '@tresjs/core';
import { useControls } from '@tresjs/leches';
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
import { inject, onBeforeUnmount, watch } from 'vue';

interface Props {
	projectColor?: string | null;
}

const props = defineProps<Props>();

const { sizes } = useTresContext();

const DEFAULT_PRIMARY = '#6644ff';

// Grid spacing and dot radius range in CSS pixels — dots never vanish below the min.
const CELL_SIZE_PX = 30;
const DOT_RADIUS_MIN_PX = 0.5;
const DOT_RADIUS_MAX_PX = 2;
const DOT_ALPHA_MIN = 0.25;

// 3D noise field: scale is noise-space step per cell, speed is noise-space drift per second.
const NOISE_SCALE = 0.045;
const NOISE_SPEED = 0.24;

// Each dot swings on an arc around a pivot offset by this distance (the original's "inflate") —
// as the noise drifts, dots sweep along curves like fabric instead of pulsing in place.
const INFLATE_PX = 160;

function resolveColor(input?: string | null): Color {
	if (!input) return new Color(DEFAULT_PRIMARY);

	try {
		return new Color(input);
	} catch {
		return new Color(DEFAULT_PRIMARY);
	}
}

const uColor = uniform(resolveColor(props.projectColor));
const uPixelRatio = uniform(sizes.pixelRatio.value);
const uMinRadius = uniform(DOT_RADIUS_MIN_PX);
const uMaxRadius = uniform(DOT_RADIUS_MAX_PX);
const uNoiseScale = uniform(NOISE_SCALE);
const uNoiseSpeed = uniform(NOISE_SPEED);
const uInflate = uniform(INFLATE_PX);

watch(
	() => props.projectColor,
	(value) => uColor.value.copy(resolveColor(value)),
);

watch(sizes.pixelRatio, (value) => {
	uPixelRatio.value = value;
});

// screenCoordinate is in physical pixels; convert to CSS pixels so density is DPR-independent.
const cssCoord = screenCoordinate.div(uPixelRatio);

// Arc warp: the original rotates each dot by noise·45° around a pivot (INFLATE_PX, INFLATE_PX) away.
// Inverted here as a domain warp — for rotation θ around that pivot the displacement works out to
// (f·(1 − cosθ + sinθ), f·(1 − cosθ − sinθ)); subtracting it from the coordinate recovers the source cell.
const warpAngle = mx_noise_float(vec3(cssCoord.div(CELL_SIZE_PX).mul(uNoiseScale), time.mul(uNoiseSpeed))).mul(
	Math.PI * 0.25,
);

const warpX = float(1).sub(cos(warpAngle)).add(sin(warpAngle)).mul(uInflate);
const warpY = float(1).sub(cos(warpAngle)).sub(sin(warpAngle)).mul(uInflate);
const warped = cssCoord.sub(vec2(warpX, warpY));

// 3D noise sampled per cell (so dots stay round), drifting through the third dimension over time.
// Dots shrink and fade with the noise value, floored so dark regions keep faint dots.
const cell = floor(warped.div(CELL_SIZE_PX));
const noise = mx_noise_float(vec3(cell.mul(uNoiseScale), time.mul(uNoiseSpeed)));
const intensity = noise.max(0);
const radius = mix(uMinRadius, uMaxRadius, intensity);

const cellUv = fract(warped.div(CELL_SIZE_PX));
// Distance from cell center, back in pixel units for a crisp 1px anti-aliased edge.
const distPx = length(cellUv.sub(vec2(0.5))).mul(CELL_SIZE_PX);
const dot = smoothstep(radius.add(1), radius, distPx).mul(mix(float(DOT_ALPHA_MIN), float(1), intensity));

const material = new MeshBasicNodeMaterial({
	transparent: true,
	depthWrite: false,
});

material.colorNode = uColor;
material.opacityNode = dot;

onBeforeUnmount(() => {
	material.dispose();
});

const uuid = inject<string>('uuid');

const { particlesColor, particlesMinSize, particlesMaxSize } = useControls(
	'particles',
	{
		color: {
			value: new Color(uColor.value),
			type: 'color',
		},
		minSize: {
			value: DOT_RADIUS_MIN_PX,
			min: 0,
			max: 10,
			step: 0.1,
		},
		maxSize: {
			value: DOT_RADIUS_MAX_PX,
			min: 0,
			max: 20,
			step: 0.1,
		},
	},
	{ uuid },
);

// Drive the existing uColor uniform instead of swapping colorNode (which forces a material recompile).
// The control mutates its Color in place, so deep-watch; .set() accepts a Color, hex, or CSS string.
watch(
	() => particlesColor?.value,
	(value) => {
		if (value) uColor.value.set(value);
	},
	{ deep: true },
);

watch(
	() => particlesMinSize?.value,
	(value) => {
		if (value != null) uMinRadius.value = value;
	},
);

watch(
	() => particlesMaxSize?.value,
	(value) => {
		if (value != null) uMaxRadius.value = value;
	},
);

const { motionSpeed, motionSweep, motionScale } = useControls(
	'motion',
	{
		speed: {
			value: NOISE_SPEED,
			min: 0,
			max: 1,
			step: 0.01,
		},
		sweep: {
			value: INFLATE_PX,
			min: 0,
			max: 400,
			step: 10,
		},
		scale: {
			value: NOISE_SCALE,
			min: 0,
			max: 0.2,
			step: 0.001,
		},
	},
	{ uuid },
);

watch(
	() => motionSpeed?.value,
	(value) => {
		if (value != null) uNoiseSpeed.value = value;
	},
);

watch(
	() => motionSweep?.value,
	(value) => {
		if (value != null) uInflate.value = value;
	},
);

watch(
	() => motionScale?.value,
	(value) => {
		if (value != null) uNoiseScale.value = value;
	},
);
</script>

<template>
	<!-- Oversized plane: the grid is computed in screen space, the mesh just needs to cover the viewport. -->
	<TresMesh :material="material">
		<TresPlaneGeometry :args="[200, 200]" />
	</TresMesh>
</template>
