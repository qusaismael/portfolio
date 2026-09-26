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

module.exports = { publishCapture };
