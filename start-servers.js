import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Start the AI server (Python Flask)
const aiServer = spawn('python', ['app.py'], {
  cwd: path.join(__dirname, 'ai_server'),
  stdio: 'inherit'
});

// Start the main application (Node.js)
const mainApp = spawn('npm', ['run', 'dev'], {
  stdio: 'inherit'
});

// Handle process cleanup
process.on('SIGINT', () => {
  console.log('\nShutting down servers...');
  aiServer.kill();
  mainApp.kill();
  process.exit();
});

// Handle errors
aiServer.on('error', (err) => {
  console.error('AI Server error:', err);
});

mainApp.on('error', (err) => {
  console.error('Main App error:', err);
});

console.log('Starting both servers...');
console.log('AI Server: http://localhost:5001');
console.log('Main App: http://localhost:5000');