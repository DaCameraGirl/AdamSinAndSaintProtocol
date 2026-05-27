declare module "axios" {
  const axios: {
    get: (url: string, config?: any) => Promise<{ data: any }>;
  };
  export default axios;
}

declare module "vitest" {
  export const describe: (name: string, fn: () => void) => void;
  export const test: (name: string, fn: () => void) => void;
  export const expect: (value: unknown) => { toBe: (expected: unknown) => void };
}
