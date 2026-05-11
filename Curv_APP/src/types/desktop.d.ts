export {};

declare global {
  interface Window {
    curvDesktop?: {
      isDesktop: boolean;
      openExternal: (url: string) => Promise<boolean>;
    };
  }
}
