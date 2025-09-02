import { $fetch } from 'ofetch';

export const useVendorProducts = () => {
  const runtimeConfig = useRuntimeConfig();
  const getHeaders = () => {
    const token = useCookie('wcRestToken').value;
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const normalizeProduct = (product: any): Product => {
    const image = product?.images?.[0] || {};
    return {
      id: product?.id,
      databaseId: product?.id,
      name: product?.name,
      slug: product?.slug,
      description: product?.description,
      shortDescription: product?.short_description,
      price: product?.price,
      regularPrice: product?.regular_price,
      salePrice: product?.sale_price,
      image: {
        sourceUrl: image?.src,
        altText: image?.alt,
      },
    } as unknown as Product;
  };

  async function getVendorProducts(vendorId: number | string): Promise<Product[]> {
    const { data, error } = await useAsyncData(`vendor-${vendorId}-products`, () =>
      $fetch<any[]>(`${runtimeConfig.public?.BACKEND_URL}/wp-json/wcfmmp/v1/vendors/${vendorId}/products`, { headers: getHeaders() }),
    );

    if (error.value) {
      console.error(error.value);
      return [];
    }

    return (data.value || []).map(normalizeProduct);
  }

  async function getVendorProduct(vendorId: number | string, productId: number | string): Promise<Product | null> {
    const { data, error } = await useAsyncData(`vendor-${vendorId}-product-${productId}`, () =>
      $fetch<any>(`${runtimeConfig.public?.BACKEND_URL}/wp-json/wcfmmp/v1/vendors/${vendorId}/products/${productId}`, { headers: getHeaders() }),
    );

    if (error.value) {
      console.error(error.value);
      return null;
    }

    return data.value ? normalizeProduct(data.value) : null;
  }

  return {
    getVendorProducts,
    getVendorProduct,
  };
};
