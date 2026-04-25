declare module "axios" {
  const axios: {
    get: (url: string, config?: any) => Promise<{ data: any }>;
  };
  export default axios;
}

declare module "crypto" {
  export function createHash(algorithm: string): {
    update: (data: string) => any;
    digest: (encoding: "hex") => string;
  };

  export function createHmac(algorithm: string, key: string): {
    update: (data: string) => any;
    digest: (encoding: "hex") => string;
  };
}

declare module "react" {
  const React: any;
  export default React;
}

declare module "react-dom/client" {
  const ReactDOM: {
    createRoot: (element: HTMLElement) => {
      render: (node: any) => void;
    };
  };
  export default ReactDOM;
}

declare namespace JSX {
  interface IntrinsicElements {
    [elemName: string]: any;
  }
}

declare module "vitest" {
  export const describe: (name: string, fn: () => void) => void;
  export const test: (name: string, fn: () => void) => void;
  export const expect: (value: unknown) => { toBe: (expected: unknown) => void };
}

declare module "node:assert/strict" {
  const assert: {
    equal: (actual: unknown, expected: unknown) => void;
  };
  export default assert;
}

declare module "node:test" {
  const test: (name: string, fn: () => void) => void;
  export default test;
}
