/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_AVAILITY_CLIENT_ID: string;
  readonly VITE_AVAILITY_CLIENT_SECRET: string;
  readonly VITE_AVAILITY_API_TOKEN_URL: string;
  readonly VITE_AVAILITY_API_BASE_URL: string;
  readonly VITE_BACKEND_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
