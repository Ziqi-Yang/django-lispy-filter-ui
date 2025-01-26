#!/usr/bin/env sh

npx tsup
./node_modules/.bin/esbuild --bundle --minify --format="esm" ./demo/main.ts --outfile=./demo/dist/main.js
npx @tailwindcss/cli -m -i ./demo/tailwind.css -o ./demo/dist/main.css
