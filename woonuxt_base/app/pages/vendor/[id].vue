<script setup lang="ts">
const route = useRoute();
const { getVendor } = useVendors();
const { getVendorProducts } = useVendorProducts();
const { setProducts } = useProducts();
const id = route.params.id as string;

const vendor = ref<any>(null);
const isLoading = ref(true);

try {
  vendor.value = await getVendor(id);
  const products = await getVendorProducts(id);
  setProducts(products);
} finally {
  isLoading.value = false;
}

useSeoMeta({
  title: vendor.value?.storeName ?? 'Vendor',
  description: vendor.value?.description || '',
});
</script>

<template>
  <div class="container my-8">
    <div v-if="isLoading" class="flex justify-center py-12">
      <LoadingIcon />
    </div>
    <div v-else-if="vendor">
      <div class="flex flex-col items-center mb-8 text-center">
        <img v-if="vendor.avatarUrl" :src="vendor.avatarUrl" :alt="vendor.storeName" class="w-32 h-32 rounded-full mb-4" />
        <h1 class="text-2xl font-semibold mb-2">{{ vendor.storeName }}</h1>
        <div v-if="vendor.description" class="max-w-2xl prose" v-html="vendor.description" />
      </div>
      <ProductGrid />
    </div>
    <div v-else>
      <p>Vendor not found.</p>
    </div>
  </div>
</template>
