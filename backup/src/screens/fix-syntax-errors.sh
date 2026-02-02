#!/bin/bash
# Script to fix commented catch blocks in screen files

echo "=== Fixing syntax errors in screen files ==="

# List of files that need fixing (based on your grep output)
files_to_fix=(
  "DailyPicksAIScreen.js"
  "DailyPicksScreen-enhanced.js" 
  "FantasyScreen-enhanced.js"
  "FantasyScreen-enhanced-v2.js"
  "GameDetailsScreen.js"
  "LiveGamesScreen-enhanced-BACKUP-infinite-loop.js"
  "NHLScreen-enhanced.js"
  "PlayerProfileScreen-enhanced.js"
  "SportsNewsHub-enhanced.js"
)

# Create backup directory
mkdir -p ../backups/syntax-fixes

for file in "${files_to_fix[@]}"; do
  if [ -f "$file" ]; then
    echo "Processing $file..."
    
    # Backup original
    timestamp=$(date +%s)
    cp "$file" "../backups/syntax-fixes/$file.backup-$timestamp"
    
    # Fix pattern: commented } before catch
    # Changes:
    #   // }
    # } catch (error) {
    # To:
    # }
    # } catch (error) {
    # Then removes duplicate }
    
    # First pass: Remove commented closing braces before catch
    sed -i '' '/^[[:space:]]*\/\/ *}$/{N;s/\/\/ *}\n} catch/} catch/;}' "$file"
    
    # Second pass: Remove standalone commented closing braces
    sed -i '' 's/^[[:space:]]*\/\/ *}$/}/' "$file"
    
    # Third pass: Fix nested try-catch with comments
    sed -i '' '/try {/,/^[[:space:]]*}[[:space:]]*$/ {
      /\/\/ *}/d
    }' "$file"
    
    echo "  Fixed $file"
  else
    echo "  File $file not found, skipping..."
  fi
done

echo "=== Done fixing syntax errors ==="
