---
layout: doc
editLink: false
---

<script setup>
import { useData } from 'vitepress'
import Badge from '@/components/Badge.vue'
const { params } = useData()
</script>

<Badge><a href="/plus/">Directus +</a></Badge>

<h1>{{ params.title }}</h1>

<!-- @content -->
