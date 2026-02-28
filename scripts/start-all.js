/**
 * Start test backend (FastAPI) and Vite dev server together.
 * Auto-installs backend deps (pip install -r requirements.txt) then starts backend + Vite.
 */
import { spawn, spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const backendDir = path.join(root, 'testing-connection', 'backend');

const isWin = process.platform === 'win32';
const py = isWin ? 'py' : 'python3';
const pipArgs = isWin ? ['-3', '-m', 'pip', 'install', '-q', '-r', 'requirements.txt'] : ['-m', 'pip', 'install', '-q', '-r', 'requirements.txt'];
const pyArgs = isWin ? ['-3', 'main.py'] : ['main.py'];

// Ensure backend deps are installed before starting
console.log('Checking test backend dependencies...');
const install = spawnSync(py, pipArgs, { cwd: backendDir, shell: true, stdio: 'inherit' });
if (install.status !== 0) {
  console.error('Backend deps install failed. Run: cd testing-connection/backend && pip install -r requirements.txt');
  process.exit(install.status ?? 1);
}

const backend = spawn(py, pyArgs, {
  cwd: backendDir,
  stdio: 'inherit',
  shell: true,
});

backend.on('error', (err) => {
  console.error('Backend start failed:', err.message);
});

const vite = spawn('node', ['node_modules/vite/bin/vite.js'], {
  cwd: root,
  stdio: 'inherit',
  shell: true,
});

function killAll() {
  backend.kill();
  vite.kill();
  process.exit();
}

process.on('SIGINT', killAll);
process.on('SIGTERM', killAll);
vite.on('exit', (code) => {
  backend.kill();
  process.exit(code ?? 0);
});

console.log('Test backend (port 8000) + Vite started. Open the URL shown above (e.g. http://localhost:5173 or 5174). Stop with Ctrl+C.');
