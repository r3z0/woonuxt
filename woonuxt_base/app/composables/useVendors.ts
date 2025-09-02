import { $fetch } from 'ofetch';

interface Vendor extends Customer {
  storeName?: string;
  storeSlug?: string;
  description?: string;
  avatarUrl?: string;
  bannerUrl?: string;
}

export const useVendors = () => {
  const runtimeConfig = useRuntimeConfig();
  const getHeaders = () => {
    const token = useCookie('wcRestToken').value;
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const normalizeVendor = (vendor: any): Vendor => ({
    id: vendor?.id ?? vendor?.vendor_id,
    databaseId: vendor?.id ?? vendor?.vendor_id,
    email: vendor?.email || '',
    firstName: vendor?.first_name || '',
    lastName: vendor?.last_name || '',
    username: vendor?.store_slug || vendor?.slug || '',
    avatarUrl: vendor?.avatar || vendor?.gravatar || '',
    storeName: vendor?.store_name || vendor?.shop_name || '',
    storeSlug: vendor?.store_slug || vendor?.slug || '',
    description: vendor?.shop_description || vendor?.description || '',
    bannerUrl: vendor?.banner || '',
    billing: {},
    shipping: {},
  });

  async function getVendors(): Promise<Vendor[]> {
    const { data, error } = await useAsyncData('vendors', () =>
      $fetch<any[]>(`${runtimeConfig.public?.BACKEND_URL}/wp-json/wcfmmp/v1/vendors`, { headers: getHeaders() }),
    );

    if (error.value) {
      console.error(error.value);
      return [];
    }

    return (data.value || []).map(normalizeVendor);
  }

  async function getVendor(id: number | string): Promise<Vendor | null> {
    const { data, error } = await useAsyncData(`vendor-${id}`, () =>
      $fetch<any>(`${runtimeConfig.public?.BACKEND_URL}/wp-json/wcfmmp/v1/vendors/${id}`, { headers: getHeaders() }),
    );

    if (error.value) {
      console.error(error.value);
      return null;
    }

    return data.value ? normalizeVendor(data.value) : null;
  }

  return {
    getVendors,
    getVendor,
  };
};
