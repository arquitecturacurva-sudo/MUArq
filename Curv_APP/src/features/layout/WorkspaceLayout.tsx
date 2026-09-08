import type { CSSProperties, ReactNode } from "react";
import "./workspace-layout.css";

type WorkspacePageProps = {
  darkMode: boolean;
  themeVars: CSSProperties;
  children: ReactNode;
};

/** The page owns vertical scrolling on mobile; the tool pane owns it on desktop. */
export function WorkspacePage({ darkMode, themeVars, children }: WorkspacePageProps) {
  return (
    <div data-workspace-page data-theme={darkMode ? "dark" : "light"} style={themeVars}>
      {children}
    </div>
  );
}

export function WorkspaceBody({ children }: { children: ReactNode }) {
  return <div data-workspace-shell>{children}</div>;
}
