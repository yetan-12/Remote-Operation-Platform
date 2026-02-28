import { createRoot } from "react-dom/client";
import App from "./app/App.tsx";
import "./styles/index.css";

// v2.0 - 重构架构
createRoot(document.getElementById("root")!).render(<App />);