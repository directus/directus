<script setup lang="ts">
import { useLoop, useTresContext } from '@tresjs/core';
import { BufferAttribute, DataTexture, PlaneGeometry, ShaderMaterial, Uniform, Vector2, Vector3 } from 'three';
import { computed, watch } from 'vue';
import fragmentShader from '../shaders/fragment.glsl';
import vertexShader from '../shaders/vertex.glsl';

const { sizes } = useTresContext();

// Static black 1x1 texture: keeps the shader's displacement sampler valid while contributing zero displacement.
const displacementTexture = new DataTexture(new Uint8Array([0, 0, 0, 255]), 1, 1);
displacementTexture.needsUpdate = true;

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
		uDisplacementTexture: new Uniform(displacementTexture),
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

const { onBeforeRender } = useLoop();

onBeforeRender(({ elapsed }) => {
	particlesMaterial.uniforms.uTime!.value = elapsed;
});
</script>

<template>
	<TresPoints :geometry="particlesGeometry" :material="particlesMaterial" />
</template>
