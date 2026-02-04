/**
 * Helper utilities for telemetry tracking in Bread W&B Viewer
 */

/**
 * Categorize file size into buckets for telemetry
 * @param bytes File size in bytes
 * @returns Size category string
 */
export function getFileSizeCategory(bytes: number): string {
    if (bytes < 1024 * 1024) return 'small'; // < 1MB
    if (bytes < 10 * 1024 * 1024) return 'medium'; // 1-10MB
    if (bytes < 100 * 1024 * 1024) return 'large'; // 10-100MB
    if (bytes < 1024 * 1024 * 1024) return 'xlarge'; // 100MB-1GB
    return 'huge'; // > 1GB
}

/**
 * Categorize row count into buckets for telemetry
 * @param count Number of rows
 * @returns Count category string
 */
export function getRowCountCategory(count: number): string {
    if (count < 100) return 'tiny';
    if (count < 1000) return 'small';
    if (count < 10000) return 'medium';
    if (count < 100000) return 'large';
    return 'huge';
}

/**
 * Sanitize user input for telemetry (search terms, etc.)
 * Never sends actual input, only categorizes by length
 * @param input User input string
 * @returns Length category string
 */
export function sanitizeUserInput(input: string): string {
    if (!input || input.length === 0) return 'empty';
    if (input.length < 5) return 'short';
    if (input.length < 20) return 'medium';
    return 'long';
}

/**
 * Get format from file extension
 * @param filePath File path or name
 * @returns Format string
 */
export function getFormatFromPath(filePath: string): string {
    const ext = filePath.split('.').pop()?.toLowerCase();
    return ext || 'unknown';
}

/**
 * Categorize duration for telemetry
 * @param durationMs Duration in milliseconds
 * @returns Duration category
 */
export function getDurationCategory(durationMs: number): string {
    if (durationMs < 100) return 'fast'; // < 100ms
    if (durationMs < 1000) return 'moderate'; // 100ms-1s
    if (durationMs < 5000) return 'slow'; // 1-5s
    return 'very-slow'; // > 5s
}

/**
 * Get metric count as string for telemetry
 * @param count Number of metrics
 * @returns Metric count as string
 */
export function bucketMetricCount(count: number): string {
    return count.toString();
}

/**
 * Categorize metric name by common patterns in ML training
 * @param name Metric name
 * @returns Category string
 */
export function categorizeMetricName(name: string): string {
    const lowerName = name.toLowerCase();

    if (lowerName.includes('loss')) return 'loss';
    if (lowerName.includes('acc') || lowerName.includes('accuracy')) return 'accuracy';
    if (lowerName.includes('lr') || lowerName.includes('learning_rate')) return 'lr';
    if (lowerName.includes('gpu')) return 'gpu';
    if (lowerName.includes('cpu')) return 'cpu';
    if (lowerName.includes('memory') || lowerName.includes('mem')) return 'memory';
    if (lowerName.includes('time') || lowerName.includes('duration')) return 'time';
    if (lowerName.includes('step') || lowerName.includes('epoch')) return 'step';

    return 'other';
}

/**
 * Get token count as string for telemetry
 * @param tokens Number of tokens
 * @returns Token count as string
 */
export function bucketTokenCount(tokens: number): string {
    return tokens.toString();
}

/**
 * Get run count as string for telemetry
 * @param count Number of runs
 * @returns Run count as string
 */
export function bucketRunCount(count: number): string {
    return count.toString();
}
