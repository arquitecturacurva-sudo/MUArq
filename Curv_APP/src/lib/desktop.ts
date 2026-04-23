export const isDesktopRuntime = () => Boolean(window.curvDesktop?.isDesktop);

export const openExternalUrl = async (url: string) => {
  try {
    if (window.curvDesktop?.openExternal) {
      return await window.curvDesktop.openExternal(url);
    }
    window.open(url, "_blank", "noopener,noreferrer");
    return true;
  } catch {
    return false;
  }
};
