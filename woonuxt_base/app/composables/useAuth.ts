import type {
  CreateAccountInput,
  LoginClientFragment,
  LoginInput,
  RegisterCustomerInput,
  ResetPasswordEmailMutationVariables,
  ResetPasswordKeyMutationVariables,
} from '#gql';
import { $fetch } from 'ofetch';

export const useAuth = () => {
  const { refreshCart } = useCart();
  const { clearAllCookies, getErrorMessage } = useHelpers();
  const router = useRouter();
  const runtimeConfig = useRuntimeConfig();

  const customer = useState<Customer>('customer', () => ({ billing: {}, shipping: {} }));
  const viewer = useState<Viewer | null>('viewer', () => null);
  const isPending = useState<boolean>('isPending', () => false);
  const orders = useState<Order[] | null>('orders', () => null);
  const downloads = useState<DownloadableItem[] | null>('downloads', () => null);
  const loginClients = useState<LoginClient[] | null>('loginClients', () => null);

  const storeWcToken = async (username?: string, password?: string, token?: string) => {
    try {
      const headers: Record<string, string> = {};
      const body: any = {};
      if (username && password) {
        body.username = username;
        body.password = password;
      }
      if (token) headers.Authorization = `Bearer ${token}`;
      const response = await $fetch<{ token: string }>(
        `${runtimeConfig.public?.BACKEND_URL}/wp-json/jwt-auth/v1/token`,
        { method: 'POST', body: Object.keys(body).length ? body : undefined, headers }
      );
      const wcToken = useCookie('wcRestToken');
      wcToken.value = response.token;
    } catch (err) {
      console.error(err);
    }
  };

  const clearWcToken = async () => {
    const wcToken = useCookie('wcRestToken');
    if (!wcToken.value) return;
    try {
      await $fetch(`${runtimeConfig.public?.BACKEND_URL}/wp-json/jwt-auth/v1/token/revoke`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${wcToken.value}` },
      });
    } catch (err) {
      console.error(err);
    }
    wcToken.value = null;
  };

  const refreshWcToken = async () => {
    const wcToken = useCookie('wcRestToken');
    if (!wcToken.value) return;
    try {
      const response = await $fetch<{ token: string }>(
        `${runtimeConfig.public?.BACKEND_URL}/wp-json/jwt-auth/v1/token/refresh`,
        { method: 'POST', headers: { Authorization: `Bearer ${wcToken.value}` } },
      );
      wcToken.value = response.token;
    } catch (err) {
      console.error(err);
      await clearWcToken();
    }
  };

  // Log in the user
  const loginUser = async (credentials: CreateAccountInput): Promise<AuthResponse> => {
    isPending.value = true;

    try {
      const { login } = await GqlLogin(credentials);
      if (login?.user && login?.authToken) {
        useGqlToken(login.authToken);
        const username = (credentials as any)?.username;
        const password = (credentials as any)?.password;
        await storeWcToken(username, password, login.authToken);
        await refreshCart();
      }

      isPending.value = false;
      return {
        success: true,
      };
    } catch (error: any) {
      const errorMsg = getErrorMessage(error);
      isPending.value = false;

      return {
        success: false,
        error: errorMsg,
      };
    }
  };

  const loginWithProvider = async (state: string, code: string, provider: any): Promise<AuthResponse> => {
    isPending.value = true;

    try {
      const input: LoginInput = { oauthResponse: { state, code }, provider };
      const response = await GqlLoginWithProvider({ input });
      if (response.login?.authToken) {
        useGqlToken(response.login.authToken);
        await storeWcToken(undefined, undefined, response.login.authToken);
        await refreshCart();
        if (viewer.value === null) {
          return {
            success: false,
            error:
              'Your credentials are correct, but there was an error logging in. This is most likely due to an SSL error. Please try again later. If the problem persists, please contact support.',
          };
        }
      }

      return {
        success: true,
      };
    } catch (error: any) {
      const errorMsg = getErrorMessage(error);

      return {
        success: false,
        error: errorMsg,
      };
    } finally {
      isPending.value = false;
    }
  };

  // Log out the user
  async function logoutUser(): Promise<AuthResponse> {
    isPending.value = true;
    try {
      const { logout } = await GqlLogout();
      if (logout) {
        await refreshCart();
        await clearWcToken();
        clearAllCookies();
        customer.value = { billing: {}, shipping: {} };
      }
      return { success: true };
    } catch (error: any) {
      const errorMsg = getErrorMessage(error);
      return { success: false, error: errorMsg };
    } finally {
      updateViewer(null);
      if (router.currentRoute.value.path === '/my-account' && viewer.value === null) {
        router.push('/my-account');
      } else {
        router.push('/');
      }
    }
  }

  async function registerUser(userInfo: RegisterCustomerInput): Promise<AuthResponse> {
    isPending.value = true;
    try {
      await GqlRegisterCustomer({ input: userInfo });
      return { success: true };
    } catch (error: any) {
      const errorMsg = getErrorMessage(error);
      isPending.value = false;
      return { success: false, error: errorMsg };
    }
  }

  // Update the user state
  const updateCustomer = (payload: Customer): void => {
    const sessionToken = payload?.sessionToken;
    if (sessionToken) {
      useGqlHeaders({ 'woocommerce-session': `Session ${sessionToken}` });
      const newToken = useCookie('woocommerce-session');
      newToken.value = sessionToken;
    }
    customer.value = payload;
    isPending.value = false;
  };

  const updateViewer = (payload: Viewer | null): void => {
    viewer.value = payload;
    isPending.value = false;
  };

  const sendResetPasswordEmail = async ({ username }: ResetPasswordEmailMutationVariables): Promise<AuthResponse> => {
    try {
      isPending.value = true;
      const { sendPasswordResetEmail } = await GqlResetPasswordEmail({ username });
      if (sendPasswordResetEmail?.success) {
        isPending.value = false;
        return { success: true };
      }
      return { success: false, error: 'There was an error sending the reset password email. Please try again later.' };
    } catch (error: any) {
      const errorMsg = getErrorMessage(error);
      isPending.value = false;
      return { success: false, error: errorMsg };
    }
  };

  const resetPasswordWithKey = async ({ key, login, password }: ResetPasswordKeyMutationVariables): Promise<AuthResponse> => {
    try {
      isPending.value = true;
      const { resetUserPassword } = await GqlResetPasswordKey({ key, login, password });
      const wasPasswordReset = Boolean(resetUserPassword?.user?.id);
      if (wasPasswordReset) {
        isPending.value = false;
        return { success: true };
      }
      return { success: false, error: 'There was an error resetting the password. Please try again later.' };
    } catch (error: any) {
      isPending.value = false;
      const gqlError = error?.gqlErrors?.[0];
      return { success: false, error: getErrorMessage(error) };
    }
  };

  const getOrders = async (): Promise<ApiResponse<Order[]>> => {
    try {
      const { customer } = await GqlGetOrders();
      if (customer) {
        const orderNodes = customer.orders?.nodes ?? [];
        orders.value = orderNodes;
        return { success: true, data: orderNodes };
      }
      return { success: false, error: 'There was an error getting your orders. Please try again later.' };
    } catch (error: any) {
      const errorMsg = getErrorMessage(error);
      return { success: false, error: errorMsg };
    }
  };

  const getDownloads = async (): Promise<ApiResponse<DownloadableItem[]>> => {
    try {
      const { customer } = await GqlGetDownloads();
      if (customer) {
        const downloadNodes = customer.downloadableItems?.nodes ?? [];
        downloads.value = downloadNodes;
        return { success: true, data: downloadNodes };
      }
      return { success: false, error: 'There was an error getting your downloads. Please try again later.' };
    } catch (error: any) {
      const errorMsg = getErrorMessage(error);
      return { success: false, error: errorMsg };
    }
  };

  const updateLoginClients = (payload: LoginClient[]): void => {
    loginClients.value = payload;
  };

  const avatar = computed(() => viewer.value?.avatar?.url ?? null);
  const wishlistLink = computed<string>(() => (viewer.value ? '/my-account?tab=wishlist' : '/wishlist'));

  return {
    viewer,
    customer,
    isPending,
    orders,
    downloads,
    avatar,
    wishlistLink,
    loginUser,
    loginClients,
    loginWithProvider,
    updateCustomer,
    updateViewer,
    logoutUser,
    registerUser,
    sendResetPasswordEmail,
    resetPasswordWithKey,
    getOrders,
    getDownloads,
    updateLoginClients,
    refreshWcToken,
  };
};
