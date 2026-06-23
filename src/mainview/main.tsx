import { ViteReactSSG } from "vite-react-ssg";
import "./index.css";
import App from "./App";

const routes = [
  {
    path: "/",
    element: <App />,
  },
];

export const createRoot = ViteReactSSG(
  { routes },
  () => {}
//   ({ router, isClient }) => {}
);