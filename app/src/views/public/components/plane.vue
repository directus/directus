<script setup lang="ts">
import { useTexture } from '@tresjs/cientos'
import { useLoop, useTresContext } from '@tresjs/core'
import { usePointer } from '@vueuse/core'
import { DoubleSide, NearestFilter, Uniform, Vector2, Vector3 } from 'three'
import { computed, onMounted, watch } from 'vue'
import blurUrl from '../assets/blur.webp'
import grainUrl from '../assets/grain.webp'
import fragmentShader from './shaders/fragment.glsl'
import vertexShader from './shaders/vertex.glsl'


const { sizes } = useTresContext()
const { x, y } = usePointer()

const resolution = computed(() => {
  return new Vector2(
    sizes.width.value * sizes.pixelRatio.value,
    sizes.height.value * sizes.pixelRatio.value,
  )
})

const normalizedMouse = computed(() => {
  const nx = (x.value / window.innerWidth) * 2 - 1
  const ny = -(y.value / window.innerHeight) * 2 + 1
  return new Vector2(nx, ny)
})

// Load textures via cientos useTexture, NearestFilter + no mipmaps
const { state: grainTex } = useTexture(grainUrl)
const { state: blurTex } = useTexture(blurUrl)

const uniforms = {
  grainTex: new Uniform(grainTex.value),
  blurTex: new Uniform(blurTex.value),
  time: new Uniform(0),
  seed: new Uniform(Math.random() * 100.0),
  back: new Uniform(new Vector3(0.055, 0.11, 0.184)),          // #0e1c2f
  style: 1,
  uGrainScale: new Uniform(1.0),
  uGrainDisplacement: new Uniform(0.05),
  uNoiseDensity: new Uniform(0.2),
  uMouse: new Uniform(new Vector2(0, 0)),
  uResolution: new Uniform(resolution.value),
  uColorPrimary: new Uniform(new Vector3(1.0, 0.643, 0.224)),   // #ffa439
  uColorSecondary: new Uniform(new Vector3(0.89, 0.318, 0.412)), // #e35169
  uColorTertiary: new Uniform(new Vector3(0.702, 0.635, 1.0)),  // #b3a2ff
}

watch([grainTex, blurTex], () => {
  if (grainTex.value) {
    grainTex.value.minFilter = NearestFilter
    grainTex.value.magFilter = NearestFilter
    grainTex.value.generateMipmaps = false
  }

  if (blurTex.value) {
    blurTex.value.minFilter = NearestFilter
    blurTex.value.magFilter = NearestFilter
    blurTex.value.generateMipmaps = false
  }

  uniforms.grainTex.value = grainTex.value
  uniforms.blurTex.value = blurTex.value
}, { immediate: true })


watch(normalizedMouse, (mouse) => {
  uniforms.uMouse.value.copy(mouse)
})

watch(resolution, (res) => {
  uniforms.uResolution.value.copy(res)
})

const { onBeforeRender } = useLoop()

onBeforeRender(({ elapsed }) => {
  uniforms.time.value = elapsed
})
</script>

<template>
	<TresMesh>
		<TresPlaneGeometry :args="[20, 20]" />
		<TresShaderMaterial
			:vertex-shader="vertexShader"
			:fragment-shader="fragmentShader"
			:uniforms="uniforms"
			:transparent="true"
			/>
	</TresMesh>
</template>
