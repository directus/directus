---
layout: doc
editLink: false
prev: false
next: false
---

<script setup>
import { useData } from 'vitepress'
import Avatar from '../.vitepress/components/Avatar.vue'
const stuff = useData()
const { params } = stuff
console.log(stuff)

</script>

<h1>{{ params.title }}</h1>

<Avatar image="" name="Bryant Gillespie" title="Developer Advocate" />

<p>{{ params.summary }}</p>

<!-- @content -->
