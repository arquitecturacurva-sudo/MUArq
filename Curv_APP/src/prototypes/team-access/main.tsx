import "@fontsource/inter/latin-400.css";
import "@fontsource/inter/latin-500.css";
import "@fontsource/inter/latin-600.css";
import "../../index.css";
import "../../styles/kit.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Prototype } from "./Prototype";
createRoot(document.getElementById("root")!).render(<StrictMode><Prototype /></StrictMode>);
