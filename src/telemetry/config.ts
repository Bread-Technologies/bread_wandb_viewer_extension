/**
 * Telemetry configuration for Bread W&B Viewer extension
 *
 * Azure Application Insights connection string for tracking user behavior,
 * performance metrics, and errors to improve the extension.
 *
 * Privacy: Only anonymous usage data is collected (no PII, run names, or metric values).
 * Users can opt-out via VS Code Settings > Telemetry Level > Off
 */

export const TELEMETRY_CONFIG = {
    /**
     * Application Insights connection string
     * This is public and read-only (can only send telemetry data)
     */
    appInsightsKey: 'InstrumentationKey=fd7ef1d8-4819-4a3d-9943-6ae35e4b2d21;IngestionEndpoint=https://westus2-2.in.applicationinsights.azure.com/;LiveEndpoint=https://westus2.livediagnostics.monitor.azure.com/;ApplicationId=0a51362d-9749-4dfa-92f8-d6bbfb966f74',

    /**
     * Enable/disable telemetry globally (still respects VS Code user setting)
     */
    enableTelemetry: true,

    /**
     * Enable performance tracking (timers, durations)
     */
    enablePerformanceTracking: true,

    /**
     * Enable error tracking
     */
    enableErrorTracking: true,

    /**
     * Event sampling rate (0.0 to 1.0)
     * 1.0 = 100% of events sent
     * 0.5 = 50% of events sent (random sampling)
     */
    eventSamplingRate: 1.0,

    /**
     * Error sampling rate (0.0 to 1.0)
     */
    errorSamplingRate: 1.0,
};

/**
 * Check if telemetry is configured
 */
export function isTelemetryConfigured(): boolean {
    return TELEMETRY_CONFIG.appInsightsKey.length > 0 && TELEMETRY_CONFIG.enableTelemetry;
}
