const { test } = require('node:test');
const assert = require('node:assert/strict');
const { EventEmitter } = require('node:events');
const { spawn } = require('node:child_process');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { waitForReady, stopServer, verifyCaptureResponse } = require('../../scripts/capture-server.cjs');
const { publishCapture, verifyCaptureMetrics } = require('../../scripts/capture-files.cjs');

function child() {
  const server = new EventEmitter();
  server.exitCode = null;
  server.signalCode = null;
  server.kill = signal => {
    server.signalCode = signal;
    server.emit('exit', null, signal);
    return true;
  };
  return server;
}

test('capture accepts only its own child readiness signal', async () => {
  const server = child();
  const ready = waitForReady(server, 100);
  server.emit('message', { type: 'ready' });
  await ready;
});

test('capture rejects child failure instead of trusting an unrelated HTTP 200', async () => {
  const server = child();
  const ready = waitForReady(server, 100);
  server.exitCode = 1;
  server.emit('exit', 1, null);
  await assert.rejects(ready, /exited before readiness/);
});

test('capture does not await a second exit from an already signaled child', async () => {
  const server = child();
  server.signalCode = 'SIGTERM';
  await stopServer(server);
  assert.equal(server.signalCode, 'SIGTERM');
});

test('capture cleanup terminates its owned server without leaving a timer', async () => {
  const server = child();
  const started = Date.now();
  await stopServer(server);
  assert.equal(server.signalCode, 'SIGTERM');
  assert.ok(Date.now() - started < 500);
});

test('cleanup waits for SIGKILL to actually exit', async () => {
  const server = child();
  const signals = [];
  server.kill = signal => {
    signals.push(signal);
    if (signal === 'SIGKILL') setTimeout(() => {
      server.signalCode = signal;
      server.emit('exit', null, signal);
    }, 20);
    return true;
  };
  await stopServer(server, { termMs: 5, killMs: 100 });
  assert.deepEqual(signals, ['SIGTERM', 'SIGKILL']);
  assert.equal(server.signalCode, 'SIGKILL');
});

test('cleanup refuses to claim success when a child ignores both signals', async () => {
  const server = child();
  server.kill = () => true;
  await assert.rejects(stopServer(server, { termMs: 5, killMs: 10 }), /did not exit/);
});

test('capture rejects an HTTP response from a server without its run marker', () => {
  const response = { url: () => 'http://127.0.0.1:4173/', headers: () => ({}) };
  assert.throws(() => verifyCaptureResponse(response, 'run-123'), /unowned preview response/);
});

test('publishing a new capture replaces stale images, not just metrics', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'portfolio-capture-test-'));
  try {
    const destination = path.join(root, 'after');
    const staging = path.join(root, '.capture-new');
    await fs.mkdir(destination);
    await fs.mkdir(staging);
    await fs.writeFile(path.join(destination, 'old.png'), 'old');
    await fs.writeFile(path.join(staging, 'new.png'), 'new');
    await publishCapture(staging, destination);
    assert.deepEqual(await fs.readdir(destination), ['new.png']);
    await assert.rejects(fs.access(staging), { code: 'ENOENT' });
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});

test('a failed publication restores the previous complete capture', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'portfolio-capture-test-'));
  try {
    const destination = path.join(root, 'after');
    await fs.mkdir(destination);
    await fs.writeFile(path.join(destination, 'old.png'), 'old');
    await assert.rejects(publishCapture(path.join(root, 'missing-stage'), destination), { code: 'ENOENT' });
    assert.deepEqual(await fs.readdir(destination), ['old.png']);
    assert.equal(await fs.readFile(path.join(destination, 'old.png'), 'utf8'), 'old');
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});

function pngFixture(width, height) {
  const header = Buffer.alloc(24);
  for (const [index, byte] of [137, 80, 78, 71, 13, 10, 26, 10].entries()) header[index] = byte;
  header.writeUInt32BE(13, 8);
  header.write('IHDR', 12, 'ascii');
  header.writeUInt32BE(width, 16);
  header.writeUInt32BE(height, 20);
  return header;
}

test('published capture metrics match the actual PNG dimensions', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'portfolio-metrics-test-'));
  try {
    await fs.writeFile(path.join(root, 'home-390-dark.png'), pngFixture(390, 7598));
    await fs.writeFile(path.join(root, 'metrics.json'), JSON.stringify([
      { route: '/', theme: 'dark', file: 'preview/after/home-390-dark.png', viewport: [390, 844], height: 7598 }
    ]));
    assert.equal(await verifyCaptureMetrics(root), 1);
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});

test('capture metrics reject any PNG dimension drift', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'portfolio-metrics-test-'));
  try {
    await fs.writeFile(path.join(root, 'home-390-dark.png'), pngFixture(390, 9999));
    await fs.writeFile(path.join(root, 'metrics.json'), JSON.stringify([
      { route: '/', theme: 'dark', file: 'home-390-dark.png', viewport: [390, 844], height: 7598 }
    ]));
    await assert.rejects(verifyCaptureMetrics(root), /height drift/);
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});

test('the owned built-site server signals readiness and marks its responses', async () => {
  const marker = 'capture-test-marker';
  const server = spawn(process.execPath, ['scripts/serve-site.cjs'], {
    stdio: ['ignore', 'ignore', 'pipe', 'ipc'],
    env: { ...process.env, PORTFOLIO_CAPTURE_RUN: marker }
  });
  try {
    await waitForReady(server, 15000);
    const response = await fetch('http://127.0.0.1:4173/');
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('x-portfolio-capture-run'), marker);
  } finally {
    await stopServer(server);
  }
});
