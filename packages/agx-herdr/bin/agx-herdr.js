#!/usr/bin/env node
void import("tsx/esm/api").then(({ register }) => {
  register();
  void import("../src/index.ts");
});
