/// <reference types="vite/client" />

interface ImportMetaEnv {
  // HIPAA Security: Client secrets must NEVER be exposed to frontend
  // All API authentication should go through the backend proxy
  readonly VITE_BACKEND_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
