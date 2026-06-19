import { register } from "node:module";

// Use import.meta.url directly as the parent
register("./loader-hooks.mjs", import.meta.url);
