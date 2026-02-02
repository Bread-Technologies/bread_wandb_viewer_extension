import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import * as protobuf from 'protobufjs';

export interface RunScanResult {
    filePath: string;
    runId: string;
    runName: string;
    project?: string;
    lastModified: number;
    isVisible: boolean;
}

export interface FileChangeEvent {
    type: 'added' | 'modified' | 'deleted';
    filePath: string;
    metadata?: RunScanResult;
}

const DEBOUNCE_MS = 1500;

/**
 * Recursively scan a folder for all .wandb files
 */
export async function scanFolderForRuns(folderPath: string): Promise<RunScanResult[]> {
    const results: RunScanResult[] = [];

    async function scanDirectory(dirPath: string): Promise<void> {
        try {
            const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });

            for (const entry of entries) {
                const fullPath = path.join(dirPath, entry.name);

                if (entry.isDirectory()) {
                    // Recursively scan subdirectories
                    await scanDirectory(fullPath);
                } else if (entry.isFile() && entry.name.endsWith('.wandb')) {
                    // Found a .wandb file
                    try {
                        const metadata = await quickParseMetadata(fullPath);
                        results.push(metadata);
                    } catch (error) {
                        console.error(`Failed to parse metadata from ${fullPath}:`, error);
                    }
                }
            }
        } catch (error) {
            console.error(`Failed to scan directory ${dirPath}:`, error);
        }
    }

    await scanDirectory(folderPath);
    return results;
}

/**
 * Quickly extract run metadata without full parsing
 * Only reads the file header to get runId and runName
 */
export async function quickParseMetadata(filePath: string): Promise<RunScanResult> {
    const stats = await fs.promises.stat(filePath);

    // Extract runId from filename as fallback
    let runId = path.basename(filePath, '.wandb').replace('run-', '');
    let runName = runId;
    let project: string | undefined = undefined;

    try {
        // Read only first 16KB to find RunRecord (avoid reading entire file)
        const buffer = Buffer.alloc(16384);
        const fd = await fs.promises.open(filePath, 'r');
        await fd.read(buffer, 0, 16384, 0);
        await fd.close();

        // Parse protobuf records from the header
        const records = readRecordsFromBuffer(buffer);

        // Look for RunRecord to extract metadata
        for (const recordData of records) {
            try {
                const record = await decodeRecord(recordData);
                if (record && record.run) {
                    runId = record.run.run_id || runId;
                    runName = record.run.display_name || record.run.run_id || runId;
                    project = record.run.project;
                    break; // Found what we need
                }
            } catch (error) {
                // Skip malformed records
                continue;
            }
        }
    } catch (error) {
        // If parsing fails, use filename-based values
        console.warn(`Could not parse metadata from ${filePath}, using filename:`, error);
    }

    return {
        filePath,
        runId,
        runName,
        project,
        lastModified: stats.mtimeMs,
        isVisible: true // Auto-select by default
    };
}

/**
 * Watch a folder for changes to .wandb files
 */
export function watchFolder(
    folderPath: string,
    callback: (event: FileChangeEvent) => void
): vscode.Disposable {
    const watchedFiles = new Map<string, number>(); // filePath -> lastModified
    let debounceTimer: NodeJS.Timeout | null = null;
    const pendingEvents = new Map<string, FileChangeEvent>();

    // Initial scan to populate watchedFiles
    scanFolderForRuns(folderPath).then(runs => {
        runs.forEach(run => {
            watchedFiles.set(run.filePath, run.lastModified);
        });
    });

    // Watch the folder recursively
    const watcher = fs.watch(folderPath, { recursive: true }, (eventType, filename) => {
        if (!filename || !filename.endsWith('.wandb')) {
            return;
        }

        const fullPath = path.join(folderPath, filename);

        // Debounce: collect events and process after delay
        if (debounceTimer) {
            clearTimeout(debounceTimer);
        }

        debounceTimer = setTimeout(async () => {
            try {
                const exists = fs.existsSync(fullPath);

                if (!exists && watchedFiles.has(fullPath)) {
                    // File was deleted
                    watchedFiles.delete(fullPath);
                    callback({
                        type: 'deleted',
                        filePath: fullPath
                    });
                } else if (exists) {
                    const stats = await fs.promises.stat(fullPath);
                    const lastModified = watchedFiles.get(fullPath);

                    if (lastModified === undefined) {
                        // New file
                        const metadata = await quickParseMetadata(fullPath);
                        watchedFiles.set(fullPath, metadata.lastModified);
                        callback({
                            type: 'added',
                            filePath: fullPath,
                            metadata
                        });
                    } else if (stats.mtimeMs > lastModified) {
                        // File was modified
                        const metadata = await quickParseMetadata(fullPath);
                        watchedFiles.set(fullPath, metadata.lastModified);
                        callback({
                            type: 'modified',
                            filePath: fullPath,
                            metadata
                        });
                    }
                }
            } catch (error) {
                console.error(`Error processing file change for ${fullPath}:`, error);
            }
        }, DEBOUNCE_MS);
    });

    return {
        dispose: () => {
            if (debounceTimer) {
                clearTimeout(debounceTimer);
            }
            watcher.close();
        }
    };
}

/**
 * Read protobuf records from a buffer (LevelDB log format)
 */
function readRecordsFromBuffer(buffer: Buffer): Buffer[] {
    const records: Buffer[] = [];
    const RECORD_HEADER_SIZE = 7;
    const FILE_HEADER_SIZE = 7;

    let offset = FILE_HEADER_SIZE; // Skip ":W&B" + 3 bytes header

    while (offset < buffer.length - RECORD_HEADER_SIZE) {
        // Read record header
        const checksum = buffer.readUInt32LE(offset);
        const length = buffer.readUInt16LE(offset + 4);
        const type = buffer.readUInt8(offset + 6);

        offset += RECORD_HEADER_SIZE;

        if (offset + length > buffer.length) {
            break; // Reached end of available data
        }

        // Extract record data
        const recordData = buffer.slice(offset, offset + length);
        records.push(recordData);

        offset += length;

        // Only read a few records (we're just looking for RunRecord)
        if (records.length >= 10) {
            break;
        }
    }

    return records;
}

/**
 * Decode a protobuf record
 */
async function decodeRecord(data: Buffer): Promise<any> {
    // Load protobuf schema (reuse from wandbParser.ts pattern)
    const protoRoot = await loadProtoSchema();
    const RecordType = protoRoot.lookupType('wandb_internal.Record');

    return RecordType.decode(data);
}

/**
 * Load protobuf schema (similar to wandbParser.ts)
 */
let cachedProtoRoot: protobuf.Root | null = null;

async function loadProtoSchema(): Promise<protobuf.Root> {
    if (cachedProtoRoot) {
        return cachedProtoRoot;
    }

    // Build protobuf schema programmatically (minimal version for RunRecord)
    const root = new protobuf.Root();

    // Define minimal schema needed for quick metadata extraction
    const wandbInternal = root.define('wandb_internal');

    wandbInternal.add(new protobuf.Type('Record')
        .add(new protobuf.Field('num', 1, 'int64'))
        .add(new protobuf.Field('run', 17, 'RunRecord'))
    );

    wandbInternal.add(new protobuf.Type('RunRecord')
        .add(new protobuf.Field('run_id', 1, 'string'))
        .add(new protobuf.Field('project', 3, 'string'))
        .add(new protobuf.Field('display_name', 8, 'string'))
    );

    cachedProtoRoot = root;
    return root;
}
