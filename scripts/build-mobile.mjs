import { existsSync, renameSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const apiDirectory = resolve('app/api');
const backupDirectory = resolve('.mobile-api-backup');

if (!existsSync(apiDirectory)) {
  throw new Error('app/api was not found; refusing to create an incomplete mobile build.');
}
if (existsSync(backupDirectory)) {
  throw new Error('.mobile-api-backup already exists. Restore app/api before retrying.');
}

renameSync(apiDirectory, backupDirectory);

try {
  const result = spawnSync('npx', ['next', 'build'], {
    stdio: 'inherit',
    env: { ...process.env, CAPACITOR_BUILD: 'true' },
    shell: process.platform === 'win32',
  });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exitCode = result.status || 1;
} finally {
  renameSync(backupDirectory, apiDirectory);
}
