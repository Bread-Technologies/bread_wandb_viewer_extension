/**
 * Shared types for AI Context generation
 */

export interface AIContextOptions {
    includeFullData: boolean;
    maxMetrics: number;
    maxDataPoints: number;
    fileReferences: boolean;
}

export interface MetricSummary {
    initial: number;
    final: number;
    min: number;
    max: number;
    mean: number;
    trend: '↑' | '↓' | '→' | '~';
    convergenceStep?: number;
    anomaly?: string;
}

export interface ConfigComparison {
    common: Record<string, any>;
    differences: Record<string, Record<string, any>>;
    metadata: {
        totalParams: number;
        commonCount: number;
        differingCount: number;
    };
}

export interface ContextMetadata {
    timestamp: string;
    runCount: number;
    folderPath: string;
    tokenEstimate: number;
}
