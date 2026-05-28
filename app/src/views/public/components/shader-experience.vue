<script setup lang="ts">
import { useLoop, useTresContext } from '@tresjs/core';
import { Color, DataTexture, PlaneGeometry, ShaderMaterial, Uniform, Vector2, Vector3 } from 'three';
import { computed, nextTick, onBeforeUnmount, shallowRef, watch } from 'vue';
import fragmentShader from '../shaders/fragment.glsl';
import vertexShader from '../shaders/vertex.glsl';

interface Props {
	projectColor?: string | null;
}

const props = defineProps<Props>();

const { sizes } = useTresContext();

const DEFAULT_PRIMARY = new Vector3(0.4, 0.267, 1.0);
const DEFAULT_SECONDARY = new Vector3(0.702, 0.635, 1.0);

function resolveColors(input?: string | null): { primary: Vector3; secondary: Vector3 } {
	if (!input) return { primary: DEFAULT_PRIMARY.clone(), secondary: DEFAULT_SECONDARY.clone() };

	try {
		const base = new Color(input);
		const primary = new Vector3(base.r, base.g, base.b);
		// Lighter tint for the secondary, mirroring the original purple ratio.
		const lighter = base.clone().lerp(new Color(1, 1, 1), 0.55);
		const secondary = new Vector3(lighter.r, lighter.g, lighter.b);
		return { primary, secondary };
	} catch {
		return { primary: DEFAULT_PRIMARY.clone(), secondary: DEFAULT_SECONDARY.clone() };
	}
}

const initialColors = resolveColors(props.projectColor);

// Static black 1x1 texture: keeps the shader's displacement sampler valid while contributing zero displacement.
const displacementTexture = new DataTexture(new Uint8Array([0, 0, 0, 255]), 1, 1);
displacementTexture.needsUpdate = true;

// --- Particle geometry: full plane, uniform grid ---
// Cells are sized in screen pixels so particle density stays constant across viewport sizes.
const TARGET_CELL_PX = 14;
const planeHeight = 10;

function createParticlesGeometry(widthPx: number, heightPx: number) {
	const safeHeightPx = heightPx > 0 ? heightPx : 1;
	const safeWidthPx = widthPx > 0 ? widthPx : 1;
	const subdivsY = Math.max(1, Math.round(safeHeightPx / TARGET_CELL_PX));
	const subdivsX = Math.max(1, Math.round(safeWidthPx / TARGET_CELL_PX));
	const aspect = safeWidthPx / safeHeightPx;
	const geometry = new PlaneGeometry(planeHeight * aspect, planeHeight, subdivsX, subdivsY);
	geometry.setIndex(null);
	geometry.deleteAttribute('normal');
	return { geometry, subdivsY };
}

const canvasSize = computed(() => ({
	width: sizes.width.value,
	height: sizes.height.value,
}));

const initial = createParticlesGeometry(canvasSize.value.width, canvasSize.value.height);
const particlesGeometry = shallowRef(initial.geometry);
const cellWorldSize = shallowRef(planeHeight / initial.subdivsY);

watch(canvasSize, async (next) => {
	const previous = particlesGeometry.value;
	const { geometry, subdivsY } = createParticlesGeometry(next.width, next.height);
	particlesGeometry.value = geometry;
	cellWorldSize.value = planeHeight / subdivsY;
	await nextTick();
	previous.dispose();
});

onBeforeUnmount(() => {
	particlesGeometry.value.dispose();
});

// --- Shader material ---
const particlesMaterial = new ShaderMaterial({
	vertexShader,
	fragmentShader,
	uniforms: {
		uResolution: new Uniform(new Vector2(1, 1)),
		uTime: new Uniform(0),
		uDisplacementTexture: new Uniform(displacementTexture),
		uColorPrimary: new Uniform(initialColors.primary),
		uColorSecondary: new Uniform(initialColors.secondary),
		uZoom: new Uniform(0.7),
		uSizeContrast: new Uniform(3.0),
		uSpeed: new Uniform(0.05),
		uSineFrequency: new Uniform(1.0),
		uSineSpeed: new Uniform(0.2),
		uSineAmplitude: new Uniform(1.2),
		uGridCellSize: new Uniform(cellWorldSize.value),
		uDisplacementStrength: new Uniform(0.5),
		uMinCellSize: new Uniform(0.5),
		uMaxCellSize: new Uniform(50.0),
		uPlaneWidth: new Uniform(planeHeight * (canvasSize.value.width / Math.max(1, canvasSize.value.height))),
		// World units from the plane's right edge to the mask center — keeps the mask docked to the right.
		uMaskRightOffset: new Uniform(8.0),
	},
	transparent: true,
	depthWrite: false,
});

const resolution = computed(
	() => new Vector2(sizes.width.value * sizes.pixelRatio.value, sizes.height.value * sizes.pixelRatio.value),
);

watch(resolution, (res) => particlesMaterial.uniforms.uResolution!.value.copy(res), { immediate: true });

watch(cellWorldSize, (size) => {
	particlesMaterial.uniforms.uGridCellSize!.value = size;
});

watch(
	canvasSize,
	({ width, height }) => {
		particlesMaterial.uniforms.uPlaneWidth!.value = planeHeight * (width / Math.max(1, height));
	},
	{ immediate: true },
);

watch(
	() => props.projectColor,
	(value) => {
		const { primary, secondary } = resolveColors(value);
		particlesMaterial.uniforms.uColorPrimary!.value.copy(primary);
		particlesMaterial.uniforms.uColorSecondary!.value.copy(secondary);
	},
);

const { onBeforeRender } = useLoop();

onBeforeRender(({ elapsed }) => {
	particlesMaterial.uniforms.uTime!.value = elapsed;
});
</script>

<template>
	<TresPoints :geometry="particlesGeometry" :material="particlesMaterial" />
</template>
