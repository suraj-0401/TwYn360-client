import "axios";

declare module "axios" {
  export interface AxiosRequestConfig {
    /** When true, the global interceptor will not show a toast for this request. */
    skipGlobalErrorToast?: boolean;
  }
}
