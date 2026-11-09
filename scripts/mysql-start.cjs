const net = require('net');
const { spawn } = require('child_process');
const path = require('path');

const HOST = '127.0.0.1';
const PORT = 3306;
const MYSQLD = 'C:\\xampp\\mysql\\bin\\mysqld.exe';
const DEFAULTS_FILE = 'C:\\xampp\\mysql\\bin\\my.ini';

function isPortOpen() {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(1500);
    socket.once('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.once('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    socket.once('error', () => {
      socket.destroy();
      resolve(false);
    });
    socket.connect(PORT, HOST);
  });
}

async function main() {
  if (await isPortOpen()) {
    console.log(`[mysql] MySQL already running on ${HOST}:${PORT}, skipping mysqld start.`);
    return;
  }

  console.log('[mysql] Starting mysqld...');
  const child = spawn(MYSQLD, [`--defaults-file=${DEFAULTS_FILE}`, '--standalone', '--console'], {
    stdio: 'inherit',
  });

  child.on('error', (err) => {
    if (err.code === 'ENOENT') {
      console.error(
        `[mysql] mysqld not found at ${MYSQLD}. Start MySQL from the XAMPP Control Panel instead.`
      );
      process.exit(1);
    }
    console.error(`[mysql] Failed to start mysqld: ${err.message}`);
    process.exit(1);
  });

  child.on('exit', (code) => {
    // If mysqld exits immediately, surface the code so `concurrently` reports it.
    // Normal shutdown (Ctrl+C) forwards the code.
    if (code !== null && code !== 0) {
      console.error(
        `[mysql] mysqld exited with code ${code}. If MySQL is already running in XAMPP, this is expected — just start MySQL from XAMPP Control Panel and run: npm run backend + npm run frontend`
      );
    }
    process.exit(code ?? 1);
  });

  // Forward termination signals so Ctrl+C stops mysqld cleanly.
  const shutdown = () => child.kill();
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main();
