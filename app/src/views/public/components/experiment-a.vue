<script setup lang="ts">
import type { TresPointerEvent } from '@tresjs/core';
import { useLoop, useTresContext } from '@tresjs/core';
import { BufferAttribute, CanvasTexture, PlaneGeometry, ShaderMaterial, Uniform, Vector2, Vector3 } from 'three';
import { computed, onMounted, watch } from 'vue';
import fragmentShader from './shaders/fragment.glsl';
import vertexShader from './shaders/vertex.glsl';

const { sizes } = useTresContext();

// --- CSS theme color helper ---
function cssColorToVec3(cssVar: string, fallback = new Vector3(0.7, 0.635, 1.0)): Vector3 {
	const el = document.createElement('div');
	el.style.color = `var(${cssVar})`;
	document.body.appendChild(el);
	const computed = getComputedStyle(el).color;
	document.body.removeChild(el);

	// getComputedStyle always resolves to rgb() or rgba() — never hsl()
	const parts = computed
		.replace(/rgba?\(/, '')
		.replace(/\).*/, '')
		.split(',');

	if (parts.length < 3) return fallback;
	const [r, g, b] = parts.map((v) => parseFloat(v.trim()) / 255);
	return new Vector3(r, g, b);
}

// --- Displacement canvas (128×128, fixed size for lifetime of component) ---
const canvas = document.createElement('canvas');
canvas.width = 128;
canvas.height = 128;
const ctx = canvas.getContext('2d')!;
ctx.fillRect(0, 0, canvas.width, canvas.height);

const canvasTexture = new CanvasTexture(canvas);
const canvasCursor = new Vector2(9999, 9999);
const prevCanvasCursor = new Vector2(9999, 9999);

// --- Particle geometry ---
const particlesGeometry = new PlaneGeometry(10, 10, 128, 128);
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
		uColorPrimary: new Uniform(new Vector3(0.4, 0.267, 1.0)), // #6644ff deep purple
		uColorSecondary: new Uniform(new Vector3(0.702, 0.635, 1.0)), // #b3a2ff light purple
	},
	transparent: true,
	depthWrite: false,
});

// Parse theme colors once at mount
// Secondary uses a light purple rather than --theme--public--art--secondary which resolves to pink
onMounted(() => {
	particlesMaterial.uniforms.uColorPrimary!.value = cssColorToVec3('--theme--public--art--primary');
});

// Reactive resolution
const resolution = computed(
	() => new Vector2(sizes.width.value * sizes.pixelRatio.value, sizes.height.value * sizes.pixelRatio.value),
);

watch(
	resolution,
	(res) => {
		particlesMaterial.uniforms.uResolution!.value.copy(res);
	},
	{ immediate: true },
);

// --- Invisible interaction plane (captures pointer UVs) ---
const onMouseMove = (event: TresPointerEvent) => {
	const uv = event.intersection?.uv;

	if (uv) {
		canvasCursor.set(uv.x * canvas.width, (1 - uv.y) * canvas.height);
	}
};

// --- Render loop ---
const { onBeforeRender } = useLoop();

onBeforeRender(({ elapsed }) => {
	particlesMaterial.uniforms.uTime!.value = elapsed;

	// Fade canvas to black (trails decay)
	ctx.globalCompositeOperation = 'source-over';
	ctx.globalAlpha = 0.02;
	ctx.fillStyle = '#000000';
	ctx.fillRect(0, 0, canvas.width, canvas.height);

	// Speed-scaled radial glow at cursor
	const dist = canvasCursor.distanceTo(prevCanvasCursor);
	prevCanvasCursor.copy(canvasCursor);
	const speedAlpha = Math.min(dist * 0.1, 1);

	if (speedAlpha > 0) {
		const r = canvas.width * 0.25;
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
	<TresMesh ref="displacementMesh" :visible="false" @pointermove="onMouseMove">
		<TresPlaneGeometry :args="[10, 10]" />
		<TresMeshBasicMaterial />
	</TresMesh>
</template>
