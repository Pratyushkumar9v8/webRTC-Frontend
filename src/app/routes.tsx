import { createBrowserRouter } from "react-router";
import { Root } from "./Root";
import { ErrorBoundaryFallback } from "./components/ErrorBoundaryFallback";
import { LoginPage } from "./components/LoginPage";
import { HomePage } from "./components/HomePage";
import { HistoryPage } from "./components/HistoryPage";
import { VideoCallPage } from "./components/VideoCallPage";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    errorElement: <ErrorBoundaryFallback />,
    children: [
      { index: true, Component: LoginPage },
      { path: "home", Component: HomePage },
      { path: "history", Component: HistoryPage },
      { path: "call", Component: VideoCallPage },
      { path: "call/:roomId", Component: VideoCallPage },
      { path: "*", Component: HomePage },
    ],
  },
]);
