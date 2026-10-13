#!/bin/bash
# Assemble le kit kit/marionnettes.js à partir de kit/src/*.js (ordre alphabétique) et vérifie la syntaxe.
cd "$(dirname "$0")"
cat src/*.js > marionnettes.js
node -e "new Function(require('fs').readFileSync('marionnettes.js','utf8'))" && echo "kit ok ($(wc -l < marionnettes.js) lignes)"
