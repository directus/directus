<template>
    <div class="live-preview">
        <iframe id="frame" src="http://foto-pia.de" frameborder="0"></iframe>
    </div>
</template>

<script setup lang="ts">

</script>

<style scoped lang="scss">

.live-preview {
    width: 100%;
    height: 100%;
    overflow: hidden;
}

#frame {
    width: 100%;
    height: 100%;
}
</style>