import { hydrateRoot } from "react-dom/client";
import { StartClient } from "@tanstack/start";
import { createRouter } from "./router";

const router = createRouter();

function Client() {
  return <StartClient router={router} />;
}

hydrateRoot(document.getElementById("root")!, <StartClient router={router} />);

export default Client;
