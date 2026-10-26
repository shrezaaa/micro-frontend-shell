<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router';

const embedded = window.parent !== window;
</script>

<template>
  <nav>
    <RouterLink to="/">Home</RouterLink>
    <RouterLink to="/about">About</RouterLink>
    <small v-if="!embedded">(standalone)</small>
  </nav>
  <main>
    <RouterView />
  </main>
</template>

<style scoped lang="scss">
nav {
  display: flex;
  gap: 12px;
  padding: 12px 20px;
  border-bottom: 1px solid var(--border);

  a {
    color: var(--accent);
  }

  .router-link-exact-active {
    font-weight: bold;
  }
}

main {
  padding: 20px;
}
</style>
