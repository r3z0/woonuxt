<script setup lang="ts">
useSeoMeta({ title: 'Vendor Dashboard' });
</script>

<template>
  <div class="container my-8">
    <h1 class="text-2xl font-semibold mb-4">Vendor Dashboard</h1>
    <ul class="space-y-2">
      <li>
        <NuxtLink to="/my-account/vendor/orders" class="text-primary">Manage Orders</NuxtLink>
      </li>
      <li>
        <NuxtLink to="/my-account/vendor/products" class="text-primary">Manage Products</NuxtLink>
      </li>
    </ul>
  </div>
</template>
