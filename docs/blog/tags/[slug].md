---
layout: page
---

<script setup>
import { useData } from 'vitepress'
const { params } = useData()
import TagsIndex from '../../.vitepress/components/TagsIndex.vue'

</script>

<!-- <pre>{{ params }}</pre> -->
<TagsIndex :tag="params" />
