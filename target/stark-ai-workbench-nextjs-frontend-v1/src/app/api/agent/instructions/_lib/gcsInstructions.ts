/**
 * GCS instructions helpers — BIM-005 (Mission Control LIVE).
 *
 * THE BACKUP LAW (I3): every save first copies the current object to a
 * timestamped `.bak` under `versions/`, THEN writes the new text. Only a
 * clean not-found (fresh agent — nothing to back up) skips the backup; any
 * other backup failure ABORTS the save. There is NO delete capability in
 * this module, by design.
 *
 * The Storage client is injected so units test the law without touching GCS.
 * Credentials: ADC — `new Storage()` resolves the local gcloud ADC login in
 * dev and the attached service account when deployed. No credential env vars.
 *
 * Path convention (I4, from the service's BACKEND_SWAP_NOTES):
 *   {BASE_FOLDER}/{agent}/{agent}_instructions.txt
 * Paths are derived server-side from manifest-validated agent names — the
 * client never transmits a path.
 */

import type { Storage } from '@google-cloud/storage';

export function instructionsPath(baseFolder: string, agentName: string): string {
  return `${baseFolder}/${agentName}/${agentName}_instructions.txt`;
}

export function backupPath(
  baseFolder: string,
  agentName: string,
  isoTimestamp: string,
): string {
  return `${baseFolder}/${agentName}/versions/${agentName}_instructions.txt.${isoTimestamp}.bak`;
}

/** GCS not-found errors carry code 404 (object doesn't exist yet). */
function isNotFound(e: unknown): boolean {
  return (
    typeof e === 'object' &&
    e !== null &&
    'code' in e &&
    (e as { code: unknown }).code === 404
  );
}

/** Download the current instructions text. Throws on any GCS failure. */
export async function readInstructions(
  storage: Storage,
  bucketName: string,
  baseFolder: string,
  agentName: string,
): Promise<string> {
  const [contents] = await storage
    .bucket(bucketName)
    .file(instructionsPath(baseFolder, agentName))
    .download();
  return contents.toString('utf-8');
}

/**
 * The law, executable: backup first, write second.
 * Returns the backup object path, or null when there was nothing to back up
 * (clean not-found — the agent's very first save).
 * Any non-404 backup failure throws BEFORE any write happens.
 */
export async function saveWithBackup(
  storage: Storage,
  bucketName: string,
  baseFolder: string,
  agentName: string,
  content: string,
): Promise<string | null> {
  const bucket = storage.bucket(bucketName);
  const current = bucket.file(instructionsPath(baseFolder, agentName));
  const backupObjectPath = backupPath(
    baseFolder,
    agentName,
    new Date().toISOString(),
  );

  let backedUp: string | null = backupObjectPath;
  try {
    await current.copy(bucket.file(backupObjectPath));
  } catch (e) {
    if (!isNotFound(e)) {
      // Backup failed for a real reason → the save MUST NOT proceed.
      throw e;
    }
    backedUp = null; // fresh agent: nothing to back up is not a failure
  }

  await current.save(content, { contentType: 'text/plain' });
  return backedUp;
}
