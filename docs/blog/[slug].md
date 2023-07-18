---
layout: doc
# editLink: false
prev: false
next: false
---

<script setup>
import { useData } from 'vitepress'
import Badge from '../.vitepress/components/Badge.vue'
import PostMeta from '../.vitepress/components/blog/PostMeta.vue'
const { params } = useData()
</script>

<Badge>Developer Blog</Badge>

<h1>{{ params.title }}</h1>

<PostMeta :params="params" />

<!-- @content -->
