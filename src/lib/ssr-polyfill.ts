// SSR polyfill: @supabase/supabase-js accesses localStorage at module evaluation time

const noopStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
  clear: () => {},
  key: () => null,
  length: 0,
};

if (typeof globalThis.localStorage === 'undefined') {
  (globalThis as any).localStorage = noopStorage;
}
