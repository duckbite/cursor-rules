#!/usr/bin/env node
import('../src/index.mjs').then((m) => m.main(process.argv.slice(2)));

