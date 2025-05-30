#!/usr/bin/env python3
import subprocess
import sys
import os

# Change to ai_server directory and start the Flask app
os.chdir('ai_server')
subprocess.run([sys.executable, 'app.py'])