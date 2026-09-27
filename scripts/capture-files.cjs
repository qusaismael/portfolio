const fs = require('node:fs/promises');
const path = require('node:path');
const { randomUUID } = require('node:crypto');

async function publishCapture(staging, destination) {
  const previous = path.join(path.dirname(destination), `.${path.basename(destination)}-previous-${randomUUID()}`);
  let hadPrevious = false;
  try {
    await fs.rename(destination, previous);
    hadPrevious = true;
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  try {
    await fs.rename(staging, destination);
  } catch (error) {
    if (hadPrevious) await fs.rename(previous, destination);
    throw error;
  }
  if (hadPrevious) await fs.rm(previous, { recursive: true, force: true });
}

async function verifyCaptureMetrics(directory) {
  const records = JSON.parse(await fs.readFile(path.join(directory, 'metrics.json'), 'utf8'));
  const pngSignature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  for (const record of records) {
    const file = path.join(directory, path.basename(record.file));
    const handle = await fs.open(file, 'r');
    try {
      const header = Buffer.alloc(24);
      const { bytesRead } = await handle.read(header, 0, header.length, 0);
      if (bytesRead !== 24) throw new Error(`truncated ${file}`);
      if (!header.subarray(0, 8).equals(pngSignature)) throw new Error(`not a PNG: ${file}`);
      if (header.readUInt32BE(16) !== record.viewport[0]) throw new Error(`width drift: ${file}`);
      if (header.readUInt32BE(20) !== record.height) throw new Error(`height drift: ${file}`);
    } finally {
      await handle.close();
    }
  }
  return records.length;
}

module.exports = { publishCapture, verifyCaptureMetrics };
