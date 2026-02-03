/**
 * Smart number formatting that handles very small and very large numbers
 * Uses scientific notation for extreme values, fixed decimals for normal range
 */

/**
 * Format a number intelligently based on its magnitude
 * - Very small (|x| < 0.0001): scientific notation (e.g., "2.02e-6")
 * - Very large (|x| > 10000): scientific notation (e.g., "1.23e+5")
 * - Normal range: up to 4 significant figures (e.g., "0.1234", "12.34", "1234")
 */
export function formatNumber(value: number): string {
    if (!isFinite(value)) {
        return String(value); // NaN, Infinity, -Infinity
    }

    const absValue = Math.abs(value);

    // Very small numbers: use scientific notation
    if (absValue > 0 && absValue < 0.0001) {
        return value.toExponential(2); // e.g., "2.02e-6"
    }

    // Very large numbers: use scientific notation
    if (absValue >= 10000) {
        return value.toExponential(2); // e.g., "1.23e+5"
    }

    // Zero
    if (absValue === 0) {
        return '0';
    }

    // Normal range: use up to 4 significant figures
    // Determine how many decimal places to show
    if (absValue >= 100) {
        return value.toFixed(1).replace(/\.0$/, ''); // e.g., "123.4" or "123"
    } else if (absValue >= 10) {
        return value.toFixed(2).replace(/\.?0+$/, ''); // e.g., "12.34" or "12.3"
    } else if (absValue >= 1) {
        return value.toFixed(3).replace(/\.?0+$/, ''); // e.g., "1.234" or "1.23"
    } else {
        // 0.0001 <= |x| < 1
        return value.toFixed(4).replace(/\.?0+$/, ''); // e.g., "0.1234" or "0.001"
    }
}

/**
 * Format a number for CSV output (always use consistent precision)
 * Uses scientific notation for extreme values to avoid loss of precision
 */
export function formatNumberForCSV(value: number): string {
    if (!isFinite(value)) {
        return String(value);
    }

    const absValue = Math.abs(value);

    // Use scientific notation for very small or very large numbers
    if ((absValue > 0 && absValue < 0.0001) || absValue >= 10000) {
        return value.toExponential(6); // Higher precision for CSV
    }

    // Normal range: use fixed decimals
    return value.toFixed(6).replace(/\.?0+$/, '');
}
