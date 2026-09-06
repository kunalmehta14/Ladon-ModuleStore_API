declare global {
  namespace NodeJS {
    interface ProcessEnv {
      PORT: string;
      DATABASE_URL: string;
      API_KEY: string;
      // NODE_ENV: 'development' | 'production';
    }
  }
}

export {};