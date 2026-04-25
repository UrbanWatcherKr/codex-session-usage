#!/usr/bin/env node
import { main } from "../src/main.mjs";

main(process.argv.slice(2)).catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
