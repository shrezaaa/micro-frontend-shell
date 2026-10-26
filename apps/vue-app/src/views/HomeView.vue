<script setup lang="ts">
import { inject } from 'vue';
import type { RemoteBridge } from '@mfe/bridge';
import { shellContext } from '../mfe-bridge';

const bridge = inject<RemoteBridge>('bridge');
</script>

<template>
  <h2>Vue · Home</h2>
  <p>Hello {{ shellContext?.user?.name ?? 'stranger' }}.</p>
  <button @click="bridge?.emit('vue:liked', { count: 1 })">Emit event to shell</button>
</template>
