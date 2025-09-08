#!/usr/bin/env python3
"""
Simple HTTP server with URL routing for CareGrid
Handles clinic-profile URLs and serves static files
"""

import http.server
import socketserver
import urllib.parse
import os
from pathlib import Path

class CareGridHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        # Parse the URL
        parsed_path = urllib.parse.urlparse(self.path)
        path = parsed_path.path
        query = parsed_path.query
        
        # Handle clinic-profile URLs
        if path == '/clinic-profile' or path == '/clinic-profile/':
            # Redirect to the actual clinic profile page
            if query:
                self.path = f'/pages/clinic-profile.html?{query}'
            else:
                self.path = '/pages/clinic-profile.html'
        
        # Handle root path
        elif path == '/' or path == '':
            self.path = '/index.html'
        
        # Call the parent handler
        super().do_GET()
    
    def end_headers(self):
        # Add CORS headers
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

if __name__ == '__main__':
    PORT = 8000
    
    # Change to the directory containing the files
    os.chdir(Path(__file__).parent)
    
    with socketserver.TCPServer(("", PORT), CareGridHTTPRequestHandler) as httpd:
        print(f"CareGrid server running at http://localhost:{PORT}/")
        print(f"Clinic profiles accessible at http://localhost:{PORT}/clinic-profile?id=1")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nServer stopped.")
            httpd.shutdown()