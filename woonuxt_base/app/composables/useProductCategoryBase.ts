import { $fetch } from 'ofetch';

export const useProductCategoryBase = async () => {
  const runtimeConfig = useRuntimeConfig();
  const productCategoryBase = useState<string>('productCategoryBase', () => '');

  if (!productCategoryBase.value) {
    const fallback = runtimeConfig?.public?.PRODUCT_CATEGORY_PERMALINK || '/product-category/';
    try {
      const backend = runtimeConfig?.public?.BACKEND_URL;
      if (backend) {
        const data: any = await $fetch(`${backend}/wp-json/woonuxt/v1/permalinks`);
        const permalink = data?.product_category_base || data?.productCategoryBase || data?.permalinks?.product_category_base;
        productCategoryBase.value = permalink ? `/${String(permalink).replace(/^\/|\/$/g, '')}/` : fallback;
      } else {
        productCategoryBase.value = fallback;
      }
    } catch {
      productCategoryBase.value = fallback;
    }
  }

  return productCategoryBase;
};
