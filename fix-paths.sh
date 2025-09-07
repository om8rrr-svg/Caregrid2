#!/bin/bash

# Fix CSS and JS paths in all HTML files in pages/ directory
echo "Fixing CSS and JS paths in pages/ directory..."

# Find all HTML files in pages/ directory and fix the paths
find pages/ -name "*.html" -type f -exec sed -i '' 's|href="css/|href="../css/|g' {} \;
find pages/ -name "*.html" -type f -exec sed -i '' 's|src="js/|src="../js/|g' {} \;
find pages/ -name "*.html" -type f -exec sed -i '' 's|href="assets/|href="../assets/|g' {} \;
find pages/ -name "*.html" -type f -exec sed -i '' 's|src="assets/|src="../assets/|g' {} \;
find pages/ -name "*.html" -type f -exec sed -i '' 's|href="images/|href="../images/|g' {} \;
find pages/ -name "*.html" -type f -exec sed -i '' 's|src="images/|src="../images/|g' {} \;

echo "Path fixes completed!"
echo "Files updated:"
find pages/ -name "*.html" -type f