#!/bin/bash
echo "=== Starting NBA Fantasy Frontend ==="

# Try to serve web-build (from expo export:web)
if [ -d "web-build" ]; then
  echo "✅ Serving Expo web build from web-build/"
  npx serve web-build -p $PORT
elif [ -d "dist" ]; then
  echo "✅ Serving from dist/"
  npx serve dist -p $PORT
else
  echo "⚠️ No build found, creating simple landing page..."
  cat > index.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
  <title>NBA Fantasy AI</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body>
  <h1>🏀 NBA Fantasy AI</h1>
  <p>Download the mobile app or use the web version.</p>
  <div id="app-root"></div>
  <script>
    // Your React app will mount here
    console.log('App starting...');
  </script>
</body>
</html>
EOF
  npx serve . -p $PORT
fi
