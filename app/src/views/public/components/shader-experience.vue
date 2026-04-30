<script setup lang="ts">
import type { TresPointerEvent } from '@tresjs/core';
import { useLoop, useTresContext } from '@tresjs/core';
import { BufferAttribute, CanvasTexture, PlaneGeometry, ShaderMaterial, Uniform, Vector2, Vector3 } from 'three';
import { computed, watch } from 'vue';
import fragmentShader from '../shaders/fragment.glsl';
import vertexShader from '../shaders/vertex.glsl';

const { sizes } = useTresContext();

const CURSOR_RADIUS = 0.5;
const CURSOR_RECOVERY = 0.01;

// --- Displacement canvas (cursor trails) ---
const canvas = document.createElement('canvas');
canvas.width = 128;
canvas.height = 128;
const ctx = canvas.getContext('2d')!;
ctx.fillRect(0, 0, canvas.width, canvas.height);

const canvasTexture = new CanvasTexture(canvas);
const canvasCursor = new Vector2(9999, 9999);
const prevCanvasCursor = new Vector2(9999, 9999);

// --- Particle geometry: full plane, uniform grid ---
const aspect = sizes.width.value / sizes.height.value;
const subdivisions = 64;
const planeHeight = 10;
const subdivsX = Math.round(subdivisions * aspect);
const particlesGeometry = new PlaneGeometry(planeHeight * aspect, planeHeight, subdivsX, subdivisions);
particlesGeometry.setIndex(null);
particlesGeometry.deleteAttribute('normal');

const count = particlesGeometry.attributes.position!.count;
const intensities = new Float32Array(count);
const angles = new Float32Array(count);

for (let i = 0; i < count; i++) {
	intensities[i] = Math.random();
	angles[i] = Math.random() * Math.PI * 2;
}

particlesGeometry.setAttribute('aIntensity', new BufferAttribute(intensities, 1));
particlesGeometry.setAttribute('aAngle', new BufferAttribute(angles, 1));

// --- Shader material ---
const particlesMaterial = new ShaderMaterial({
	vertexShader,
	fragmentShader,
	uniforms: {
		uResolution: new Uniform(new Vector2(1, 1)),
		uTime: new Uniform(0),
		uDisplacementTexture: new Uniform(canvasTexture),
		uColorPrimary: new Uniform(new Vector3(0.4, 0.267, 1.0)),
		uColorSecondary: new Uniform(new Vector3(0.702, 0.635, 1.0)),
		uZoom: new Uniform(0.7),
		uSizeContrast: new Uniform(3.0),
		uSpeed: new Uniform(0.2),
		uSineFrequency: new Uniform(1.0),
		uSineSpeed: new Uniform(0.15),
		uSineAmplitude: new Uniform(0.12),
		uGridCellSize: new Uniform(planeHeight / subdivisions),
		uDisplacementStrength: new Uniform(0.5),
		uMinCellSize: new Uniform(0.5),
		uMaxCellSize: new Uniform(50.0),
	},
	transparent: true,
	depthWrite: false,
});

const resolution = computed(
	() => new Vector2(sizes.width.value * sizes.pixelRatio.value, sizes.height.value * sizes.pixelRatio.value),
);

watch(resolution, (res) => particlesMaterial.uniforms.uResolution!.value.copy(res), { immediate: true });

// --- Pointer: capture UV for cursor displacement ---
const onMouseMove = (event: TresPointerEvent) => {
	const uv = event.intersection?.uv;
	if (uv) canvasCursor.set(uv.x * canvas.width, (1 - uv.y) * canvas.height);
};

// --- Render loop ---
const { onBeforeRender } = useLoop();

onBeforeRender(({ elapsed }) => {
	particlesMaterial.uniforms.uTime!.value = elapsed;

	ctx.globalCompositeOperation = 'source-over';
	ctx.globalAlpha = CURSOR_RECOVERY;
	ctx.fillStyle = '#000000';
	ctx.fillRect(0, 0, canvas.width, canvas.height);

	const dist = canvasCursor.distanceTo(prevCanvasCursor);
	prevCanvasCursor.copy(canvasCursor);
	const speedAlpha = Math.min(dist * 0.1, 1);

	if (speedAlpha > 0) {
		const r = canvas.width * CURSOR_RADIUS;
		const glow = ctx.createRadialGradient(canvasCursor.x, canvasCursor.y, 0, canvasCursor.x, canvasCursor.y, r);
		glow.addColorStop(0, 'rgba(255,255,255,1)');
		glow.addColorStop(1, 'rgba(0,0,0,0)');
		ctx.globalCompositeOperation = 'lighten';
		ctx.globalAlpha = speedAlpha;
		ctx.fillStyle = glow;
		ctx.beginPath();
		ctx.arc(canvasCursor.x, canvasCursor.y, r, 0, Math.PI * 2);
		ctx.fill();
	}

	canvasTexture.needsUpdate = true;
});
</script>

<template>
	<TresPoints :geometry="particlesGeometry" :material="particlesMaterial" />
	<TresMesh :visible="false" @pointermove="onMouseMove">
		<TresPlaneGeometry :args="[15 * aspect, 15]" />
		<TresMeshBasicMaterial />
	</TresMesh>
</template>
