/// <reference types="expo/env" />

declare global {
  namespace Expo {
    interface Config {
      extra?: {
        appEnv?: string;
        apiBaseUrl?: string;
      };
    }
  }
}

export {};