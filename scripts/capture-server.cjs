function waitForReady(server, timeoutMs = 15000) {
  return new Promise((resolve, reject) => {
    if (server.exitCode !== null || server.signalCode !== null) {
      reject(new Error('Preview server exited before readiness'));
      return;
    }
    const cleanup = () => {
      clearTimeout(timer);
      server.off('message', onMessage);
      server.off('exit', onExit);
      server.off('error', onError);
    };
    const onMessage = message => {
      if (message?.type === 'ready') { cleanup(); resolve(); }
    };
    const onExit = () => { cleanup(); reject(new Error('Preview server exited before readiness')); };
    const onError = error => { cleanup(); reject(error); };
    const timer = setTimeout(() => {
      cleanup(); reject(new Error('Preview server did not signal readiness'));
    }, timeoutMs);
    server.on('message', onMessage);
    server.once('exit', onExit);
    server.once('error', onError);
  });
}

async function stopServer(server, { termMs = 3000, killMs = 1000 } = {}) {
  if (server.exitCode !== null || server.signalCode !== null) return;
  await new Promise((resolve, reject) => {
    let termTimer, killTimer, settled = false;
    const finish = error => {
      if (settled) return;
      settled = true;
      clearTimeout(termTimer);
      clearTimeout(killTimer);
      server.off('exit', onExit);
      server.off('error', onError);
      if (error) reject(error);
      else resolve();
    };
    const onExit = () => finish();
    const onError = error => finish(error);
    server.once('exit', onExit);
    server.once('error', onError);
    termTimer = setTimeout(() => {
      if (settled) return;
      if (server.exitCode !== null || server.signalCode !== null) return finish();
      try { server.kill('SIGKILL'); } catch (error) { return finish(error); }
      if (!settled) killTimer = setTimeout(() => finish(new Error('Preview server did not exit after SIGKILL')), killMs);
    }, termMs);
    try { server.kill('SIGTERM'); } catch (error) { finish(error); }
  });
}

function verifyCaptureResponse(response, marker) {
  if (response.headers()['x-portfolio-capture-run'] !== marker) {
    throw new Error(`unowned preview response: ${response.url()}`);
  }
}

module.exports = { waitForReady, stopServer, verifyCaptureResponse };
