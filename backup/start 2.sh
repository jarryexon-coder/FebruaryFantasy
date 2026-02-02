#!/bin/bash
echo "=== Starting NBA Fantasy Frontend ==="

# Check what was built
if [ -d "dist" ]; then
  echo "✅ Serving from dist/"
  npx serve dist -p $PORT
elif [ -d "web-build" ]; then
  echo "✅ Serving from web-build/"
  npx serve web-build -p $PORT
else
  echo "⚠️ No build folder found. Creating minimal app..."
  echo '<html><body><h1>NBA Fantasy</h1><p>App loading...</p></body></html>' > index.html
  npx serve . -p $PORT
fi
