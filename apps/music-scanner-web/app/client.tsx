import { hydrateRoot } from "react-dom/client";
import { StartClient } from "@tanstack/start";
import { createRouter } from "./router";

const router = createRouter();

function Client() {
  // @ts-expect-error - router property is required by StartClient but mismatched in React 19 types
  return <StartClient router={router} />;
}

// @ts-expect-error - router property is required by StartClient but mismatched in React 19 types
hydrateRoot(document.getElementById("root")!, <StartClient router={router} />);

export default Client;
