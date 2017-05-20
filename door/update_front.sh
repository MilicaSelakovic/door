#!/usr/bin/env bash
cp -r "$1/dist/index.html" static/
cp -r "$1/dist/scripts/vendor.js" static/scripts/
cp -r "$1/dist/scripts/main.js" static/scripts/
cp -r "$1/dist/styles/main.css" static/styles/