#!/bin/bash
# convert-screen.sh
MOBILE_DIR="../nba-frontend-clean/src/screens"
WEB_DIR="src/pages"
BACKUP_DIR="mobile-converted-backup"

echo "📱 Converting mobile screens to web..."

mkdir -p "$BACKUP_DIR"

# Find all screen files
for screen_file in "$MOBILE_DIR"/*.js "$MOBILE_DIR"/*.jsx; do
  if [ -f "$screen_file" ]; then
    screen_name=$(basename "$screen_file" .js)
    screen_name=$(basename "$screen_name" .jsx)
    web_file="$WEB_DIR/${screen_name}.tsx"
    
    echo "Processing: $screen_name"
    
    # Backup original if exists
    if [ -f "$web_file" ]; then
      cp "$web_file" "$BACKUP_DIR/${screen_name}_backup.tsx"
    fi
    
    # Read the mobile screen
    content=$(cat "$screen_file")
    
    # Create web version
    cat > "$web_file" << EOF
// Web version of $screen_name
// Converted from React Native to Material-UI
import React from 'react'
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  Container,
} from '@mui/material'

// TODO: Convert React Native components to Material-UI
// Original screen: $screen_file

const ${screen_name} = () => {
  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h1" gutterBottom>
        ${screen_name}
      </Typography>
      <Typography variant="body1" color="text.secondary">
        This screen was converted from React Native. 
        Manual adjustments needed for full functionality.
      </Typography>
      <Box mt={4}>
        <Button
          variant="contained"
          href="/diagnostic"
        >
          Test Backend Connection
        </Button>
      </Box>
    </Container>
  )
}

export default ${screen_name}
EOF
    
    echo "  → Created: $web_file"
  fi
done

echo "✅ Conversion complete. Check $BACKUP_DIR for backups."
