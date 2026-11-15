import { readFile, realpath, stat } from "node:fs/promises";
import { resolve, sep } from "node:path";
import { SnapshotStore, type DatasetSnapshot } from "./snapshot-store.js";
import { dataError } from "../../lib/errors.js";

/** Load a complete publication at startup. No request-controlled filenames or partial hot reloads. */
export async function loadSnapshots(
  directory: string,
  options: { chatEnabled?: boolean; production?: boolean } = {},
): Promise<SnapshotStore> {
  const root = await realpath(directory);
  const read = async (path: string, maxBytes: number) => {
    const actual = await realpath(resolve(root, path));
    if (!actual.startsWith(root + sep))
      throw dataError("snapshot file escapes dataset root");
    if ((await stat(actual)).size > maxBytes)
      throw dataError("snapshot file exceeds size limit");
    return JSON.parse(await readFile(actual, "utf8"));
  };
  const manifest = await read("current.json", 16_384);
  if (
    !manifest ||
    typeof manifest.currentVersion !== "string" ||
    !Array.isArray(manifest.availableVersions) ||
    manifest.availableVersions.length < 1 ||
    manifest.availableVersions.length > 8 ||
    manifest.availableVersions.some(
      (v: unknown) =>
        typeof v !== "string" || !/^[A-Za-z0-9][A-Za-z0-9._-]{0,79}$/.test(v),
    )
  ) {
    throw dataError("invalid current.json publication manifest");
  }
  const snapshots: DatasetSnapshot[] = [];
  for (const version of manifest.availableVersions) {
    const snapshot = await read(`${version}/dataset.json`, 32 * 1024 * 1024);
    if (snapshot.dataVersion !== version)
      throw dataError("snapshot filename/version mismatch");
    snapshots.push(snapshot);
  }
  return new SnapshotStore(snapshots, manifest.currentVersion, options);
}
