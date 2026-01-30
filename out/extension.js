"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const wandbParser_1 = require("./wandbParser");
const webviewPanel_1 = require("./webviewPanel");
function activate(context) {
    console.log('W&B Viewer extension activated');
    // Register custom editor for .wandb files
    context.subscriptions.push(WandbEditorProvider.register(context));
    // Also keep the command for right-click on folders
    const viewRunCommand = vscode.commands.registerCommand('wandb-viewer.viewRun', async (uri) => {
        let folderPath;
        if (uri) {
            folderPath = uri.fsPath;
        }
        else {
            const selected = await vscode.window.showOpenDialog({
                canSelectFiles: false,
                canSelectFolders: true,
                canSelectMany: false,
                title: 'Select W&B Run Directory'
            });
            if (!selected || selected.length === 0) {
                return;
            }
            folderPath = selected[0].fsPath;
        }
        if (!(0, wandbParser_1.isWandbRunDirectory)(folderPath)) {
            vscode.window.showErrorMessage('This folder does not contain a W&B run (.wandb file not found)');
            return;
        }
        const runFiles = (0, wandbParser_1.getRunFiles)(folderPath);
        if (!runFiles.wandbFile) {
            vscode.window.showErrorMessage('Could not find .wandb file');
            return;
        }
        try {
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: 'Loading W&B run...',
                cancellable: false
            }, async () => {
                const runData = (0, wandbParser_1.parseWandbFile)(runFiles.wandbFile);
                const logMetrics = runFiles.outputLog
                    ? (0, wandbParser_1.parseOutputLog)(runFiles.outputLog)
                    : {};
                webviewPanel_1.WandbViewerPanel.createOrShow(context.extensionUri, runData, logMetrics, folderPath, runFiles.outputLog);
            });
        }
        catch (error) {
            vscode.window.showErrorMessage(`Failed to parse W&B run: ${error instanceof Error ? error.message : String(error)}`);
        }
    });
    context.subscriptions.push(viewRunCommand);
}
/**
 * Custom editor provider for .wandb files
 */
class WandbEditorProvider {
    constructor(context) {
        this.context = context;
    }
    static register(context) {
        const provider = new WandbEditorProvider(context);
        return vscode.window.registerCustomEditorProvider(WandbEditorProvider.viewType, provider, {
            webviewOptions: {
                retainContextWhenHidden: true
            },
            supportsMultipleEditorsPerDocument: false
        });
    }
    async openCustomDocument(uri, _openContext, _token) {
        return { uri, dispose: () => { } };
    }
    async resolveCustomEditor(document, webviewPanel, _token) {
        const wandbFilePath = document.uri.fsPath;
        const runDir = path.dirname(wandbFilePath);
        // File watcher for live updates
        let fileWatcher = null;
        let debounceTimer = null;
        const DEBOUNCE_MS = 1000; // Wait 1 second after last change before updating
        // Find the logo - first check extension's media folder
        let logoBase64 = '';
        const extensionMediaPath = path.join(this.context.extensionPath, 'media', 'bread_alpha.png');
        if (fs.existsSync(extensionMediaPath)) {
            const logoData = fs.readFileSync(extensionMediaPath);
            logoBase64 = logoData.toString('base64');
        }
        // Fallback: check workspace folders
        if (!logoBase64) {
            const workspaceFolders = vscode.workspace.workspaceFolders;
            if (workspaceFolders) {
                for (const folder of workspaceFolders) {
                    const logoPath = path.join(folder.uri.fsPath, 'bread_alpha.png');
                    if (fs.existsSync(logoPath)) {
                        const logoData = fs.readFileSync(logoPath);
                        logoBase64 = logoData.toString('base64');
                        break;
                    }
                }
            }
        }
        // Fallback: check parent directories of the wandb file
        if (!logoBase64) {
            let searchDir = runDir;
            for (let i = 0; i < 5; i++) {
                const logoPath = path.join(searchDir, 'bread_alpha.png');
                if (fs.existsSync(logoPath)) {
                    const logoData = fs.readFileSync(logoPath);
                    logoBase64 = logoData.toString('base64');
                    break;
                }
                searchDir = path.dirname(searchDir);
            }
        }
        webviewPanel.webview.options = {
            enableScripts: true
        };
        try {
            const runData = (0, wandbParser_1.parseWandbFile)(wandbFilePath);
            const runFiles = (0, wandbParser_1.getRunFiles)(runDir);
            const logMetrics = runFiles.outputLog
                ? (0, wandbParser_1.parseOutputLog)(runFiles.outputLog)
                : {};
            webviewPanel.webview.html = this.getHtmlContent(webviewPanel.webview, runData, logMetrics, runDir, runFiles.outputLog, logoBase64);
            webviewPanel.webview.onDidReceiveMessage(async (message) => {
                switch (message.command) {
                    case 'openOutputLog':
                        if (runFiles.outputLog) {
                            const doc = await vscode.workspace.openTextDocument(runFiles.outputLog);
                            await vscode.window.showTextDocument(doc, vscode.ViewColumn.Beside);
                        }
                        else {
                            vscode.window.showWarningMessage('Output log not found');
                        }
                        break;
                    case 'openFile':
                        const filePath = path.join(runDir, message.file);
                        const fileDoc = await vscode.workspace.openTextDocument(filePath);
                        await vscode.window.showTextDocument(fileDoc, vscode.ViewColumn.Beside);
                        break;
                }
            });
            // Set up file watcher for live updates
            const refreshData = () => {
                try {
                    console.log('[W&B Viewer] File changed, re-parsing...');
                    const newRunData = (0, wandbParser_1.parseWandbFile)(wandbFilePath);
                    const newLogMetrics = runFiles.outputLog
                        ? (0, wandbParser_1.parseOutputLog)(runFiles.outputLog)
                        : {};
                    // Merge metrics
                    const allMetrics = { ...newRunData.metrics };
                    for (const [key, values] of Object.entries(newLogMetrics)) {
                        if (!allMetrics[key] || allMetrics[key].length === 0) {
                            allMetrics[key] = values;
                        }
                    }
                    // Send updated data to webview
                    webviewPanel.webview.postMessage({
                        command: 'updateData',
                        trainingMetrics: allMetrics,
                        systemMetrics: newRunData.systemMetrics
                    });
                }
                catch (error) {
                    console.error('[W&B Viewer] Error refreshing data:', error);
                }
            };
            // Watch for file changes
            try {
                fileWatcher = fs.watch(wandbFilePath, (eventType) => {
                    if (eventType === 'change') {
                        // Debounce to avoid rapid updates
                        if (debounceTimer) {
                            clearTimeout(debounceTimer);
                        }
                        debounceTimer = setTimeout(refreshData, DEBOUNCE_MS);
                    }
                });
            }
            catch (error) {
                console.error('Could not set up file watcher:', error);
            }
            // Cleanup watcher when panel is disposed
            webviewPanel.onDidDispose(() => {
                if (fileWatcher) {
                    fileWatcher.close();
                    fileWatcher = null;
                }
                if (debounceTimer) {
                    clearTimeout(debounceTimer);
                    debounceTimer = null;
                }
            });
        }
        catch (error) {
            webviewPanel.webview.html = `
                <html>
                <body style="padding: 20px; font-family: sans-serif; color: #d4d4d4; background: #1e1e1e;">
                    <h2>Error loading W&B run</h2>
                    <p>${error instanceof Error ? error.message : String(error)}</p>
                </body>
                </html>
            `;
        }
    }
    getHtmlContent(webview, runData, logMetrics, runDir, outputLogPath, logoBase64) {
        const pathModule = require('path');
        // Merge metrics
        const allMetrics = { ...runData.metrics };
        for (const [key, values] of Object.entries(logMetrics)) {
            if (!allMetrics[key] || allMetrics[key].length === 0) {
                allMetrics[key] = values;
            }
        }
        // Group metrics
        const metricGroups = this.groupMetrics(allMetrics);
        const systemGroups = this.groupMetrics(runData.systemMetrics);
        // Load metadata
        let metadata = {};
        const metadataPath = pathModule.join(runDir, 'files', 'wandb-metadata.json');
        if (fs.existsSync(metadataPath)) {
            try {
                metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
            }
            catch { }
        }
        const projectName = runData.project || 'Unknown Project';
        const runName = runData.runName || runData.runId;
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>W&B Run Viewer</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/chartjs-plugin-zoom"></script>
    <style>
        * { box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            padding: 20px;
            background: var(--vscode-editor-background, #1e1e1e);
            color: var(--vscode-editor-foreground, #d4d4d4);
            margin: 0;
        }
        .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
            flex-wrap: wrap;
            gap: 15px;
        }
        .header-left {
            display: flex;
            align-items: center;
            gap: 15px;
        }
        .logo {
            width: 32px;
            height: 32px;
            object-fit: contain;
            opacity: 0.85;
        }
        .title-section {
            display: flex;
            flex-direction: column;
            gap: 4px;
        }
        .project-name {
            font-size: 0.85em;
            color: var(--vscode-descriptionForeground, #888);
            line-height: 1.4;
        }
        h1 { margin: 0; font-size: 1.4em; color: var(--vscode-foreground, #fff); line-height: 1.3; }
        .run-id {
            font-size: 0.75em;
            color: var(--vscode-descriptionForeground, #666);
            font-family: monospace;
            line-height: 1.4;
            margin-top: 2px;
        }
        .btn {
            background: var(--vscode-button-background, #0e639c);
            color: var(--vscode-button-foreground, #fff);
            border: none;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
        }
        .btn:hover { background: var(--vscode-button-hoverBackground, #1177bb); }
        .btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .btn-small {
            padding: 4px 8px;
            font-size: 12px;
        }
        .metadata {
            background: var(--vscode-editor-inactiveSelectionBackground, #3a3d41);
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
        }
        .metadata h3 { margin: 0 0 10px 0; font-size: 1em; }
        .metadata-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
            gap: 10px;
        }
        .metadata-item { font-size: 0.85em; }
        .metadata-label { color: var(--vscode-descriptionForeground, #888); }
        .tabs {
            display: flex;
            gap: 4px;
            margin-bottom: 20px;
            border-bottom: 1px solid var(--vscode-panel-border, #444);
            flex-wrap: wrap;
        }
        .tab {
            padding: 8px 16px;
            cursor: pointer;
            border: none;
            background: transparent;
            color: var(--vscode-foreground, #d4d4d4);
            border-bottom: 2px solid transparent;
        }
        .tab:hover { background: var(--vscode-list-hoverBackground, #2a2d2e); }
        .tab.active { border-bottom-color: var(--vscode-focusBorder, #007acc); }
        .tab-content { display: none; }
        .tab-content.active { display: block; }
        .metric-group { margin-bottom: 30px; }
        .metric-group h3 {
            margin: 0 0 15px 0;
            font-size: 1.1em;
            border-bottom: 1px solid var(--vscode-panel-border, #444);
            padding-bottom: 8px;
        }
        .charts-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
            gap: 20px;
        }
        .chart-container {
            background: var(--vscode-editor-inactiveSelectionBackground, #252526);
            padding: 15px;
            border-radius: 8px;
            min-height: 250px;
            position: relative;
        }
        .chart-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 10px;
        }
        .chart-title { font-size: 1em; font-weight: 600; }
        .chart-wrapper { position: relative; height: 200px; }
        .no-data { text-align: center; padding: 40px; color: var(--vscode-descriptionForeground, #888); }
        .config-item {
            background: var(--vscode-editor-inactiveSelectionBackground, #252526);
            padding: 10px 15px;
            margin-bottom: 8px;
            border-radius: 4px;
        }
        .config-key { font-weight: bold; color: var(--vscode-symbolIcon-variableForeground, #75beff); }
        .config-value { font-family: monospace; font-size: 0.85em; margin-top: 5px; word-break: break-all; white-space: pre-wrap; max-height: 200px; overflow-y: auto; }

        /* Fullscreen modal */
        body.modal-open {
            overflow: hidden;
        }
        .modal {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: var(--vscode-editor-background, #1e1e1e);
            z-index: 1000;
            padding: 20px;
            box-sizing: border-box;
        }
        .modal.active { display: flex; flex-direction: column; }
        .modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
        }
        .modal-title { font-size: 1.4em; font-weight: 600; color: #fff; }
        .modal-controls {
            display: flex;
            align-items: center;
            gap: 15px;
        }
        .smoothing-control {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 0.85em;
            color: #888;
        }
        .smoothing-control input[type="range"] {
            width: 120px;
            cursor: pointer;
            -webkit-appearance: none;
            appearance: none;
            background: transparent;
            height: 20px;
        }
        .smoothing-control input[type="range"]::-webkit-slider-runnable-track {
            height: 4px;
            background: #444;
            border-radius: 2px;
        }
        .smoothing-control input[type="range"]::-webkit-slider-thumb {
            -webkit-appearance: none;
            appearance: none;
            width: 14px;
            height: 14px;
            background: #888;
            border-radius: 50%;
            margin-top: -5px;
            cursor: pointer;
        }
        .smoothing-control input[type="range"]::-webkit-slider-thumb:hover {
            background: #aaa;
        }
        .smoothing-control input[type="range"]::-moz-range-track {
            height: 4px;
            background: #444;
            border-radius: 2px;
        }
        .smoothing-control input[type="range"]::-moz-range-thumb {
            width: 14px;
            height: 14px;
            background: #888;
            border-radius: 50%;
            border: none;
            cursor: pointer;
        }
        .smoothing-control input[type="range"]::-moz-range-thumb:hover {
            background: #aaa;
        }
        .smoothing-control input[type="range"]:focus {
            outline: none;
        }
        .smoothing-control #smoothingValue {
            min-width: 35px;
            text-align: right;
            font-family: monospace;
        }
        .zoom-hint {
            font-size: 0.75em;
            color: #666;
            font-style: italic;
        }
        .modal-close {
            background: none;
            border: none;
            color: #fff;
            font-size: 24px;
            cursor: pointer;
            padding: 5px 10px;
        }
        .modal-close:hover { color: #f67019; }
        .modal-content {
            flex: 1;
            position: relative;
            min-height: 0;
            overflow: hidden;
        }
        .modal-chart {
            position: absolute;
            top: 0;
            left: 0;
            width: 100% !important;
            height: 100% !important;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="header-left">
            ${logoBase64 ? `<img src="data:image/png;base64,${logoBase64}" alt="Logo" class="logo">` : ''}
            <div class="title-section">
                <div class="project-name">${projectName}</div>
                <h1>${runName}</h1>
                <div class="run-id">ID: ${runData.runId}</div>
            </div>
        </div>
        <button class="btn" onclick="openOutputLog()" ${!outputLogPath ? 'disabled' : ''}>
            View Output Log
        </button>
    </div>

    ${metadata.gpu || metadata.python ? `
    <div class="metadata">
        <h3>Run Information</h3>
        <div class="metadata-grid">
            ${metadata.gpu ? `<div class="metadata-item"><span class="metadata-label">GPU:</span> ${metadata.gpu}</div>` : ''}
            ${metadata.gpu_count ? `<div class="metadata-item"><span class="metadata-label">GPU Count:</span> ${metadata.gpu_count}</div>` : ''}
            ${metadata.python ? `<div class="metadata-item"><span class="metadata-label">Python:</span> ${metadata.python}</div>` : ''}
            ${metadata.host ? `<div class="metadata-item"><span class="metadata-label">Host:</span> ${metadata.host}</div>` : ''}
            ${metadata.startedAt ? `<div class="metadata-item"><span class="metadata-label">Started:</span> ${new Date(metadata.startedAt).toLocaleString()}</div>` : ''}
        </div>
    </div>
    ` : ''}

    <div class="tabs">
        <button class="tab active" data-tab="training">Training Metrics</button>
        <button class="tab" data-tab="system">System Metrics</button>
        <button class="tab" data-tab="config">Configuration</button>
    </div>

    <div id="training" class="tab-content active">
        ${this.generateMetricGroupsHtml(metricGroups, 'training')}
    </div>

    <div id="system" class="tab-content">
        ${this.generateMetricGroupsHtml(systemGroups, 'system')}
    </div>

    <div id="config" class="tab-content">
        ${this.generateConfigHtml(runData.config)}
    </div>

    <!-- Fullscreen Modal -->
    <div id="fullscreenModal" class="modal">
        <div class="modal-header">
            <div class="modal-title" id="modalTitle"></div>
            <div class="modal-controls">
                <div class="smoothing-control">
                    <label for="smoothingSlider">Smoothing:</label>
                    <input type="range" id="smoothingSlider" min="0" max="0.99" step="0.01" value="0">
                    <span id="smoothingValue">0</span>
                </div>
                <button id="resetZoomBtn" class="btn btn-small" onclick="resetZoom()" style="display: none;">Reset Zoom</button>
                <span class="zoom-hint">Drag to zoom • Shift+drag to pan</span>
                <button class="modal-close" onclick="closeFullscreen()">&times;</button>
            </div>
        </div>
        <div class="modal-content">
            <canvas id="modalChart" class="modal-chart"></canvas>
        </div>
    </div>

    <script>
        const vscode = acquireVsCodeApi();
        let modalChart = null;
        let currentModalData = null;
        let currentModalKey = null;
        let currentModalColorIndex = 0;

        // EMA smoothing function
        function applySmoothing(data, smoothingFactor) {
            if (smoothingFactor === 0 || data.length === 0) return data;

            const smoothed = [];
            let lastSmoothed = data[0];

            for (let i = 0; i < data.length; i++) {
                const smoothedValue = smoothingFactor * lastSmoothed + (1 - smoothingFactor) * data[i];
                smoothed.push(smoothedValue);
                lastSmoothed = smoothedValue;
            }

            return smoothed;
        }

        // Update chart with new smoothing value
        function updateChartSmoothing(smoothingFactor) {
            if (!modalChart || !currentModalData) return;

            const smoothedValues = applySmoothing(
                currentModalData.map(d => d.value),
                smoothingFactor
            );

            modalChart.data.datasets[0].data = smoothedValues;
            modalChart.update({ duration: 0, lazy: true });
        }

        // Smoothing slider event listener
        document.getElementById('smoothingSlider').addEventListener('input', function(e) {
            const value = parseFloat(e.target.value);
            document.getElementById('smoothingValue').textContent = value.toFixed(2);
            updateChartSmoothing(value);
        });

        document.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
                document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
                tab.classList.add('active');
                document.getElementById(tab.dataset.tab).classList.add('active');
            });
        });

        function openOutputLog() {
            vscode.postMessage({ command: 'openOutputLog' });
        }

        function openFullscreen(metricKey, dataType) {
            const data = dataType === 'training' ? trainingMetrics[metricKey] : systemMetrics[metricKey];
            if (!data) return;

            // Store current data for smoothing
            currentModalData = data;
            currentModalKey = metricKey;

            // Reset smoothing slider
            document.getElementById('smoothingSlider').value = 0;
            document.getElementById('smoothingValue').textContent = '0.00';

            document.getElementById('modalTitle').textContent = metricKey;
            document.getElementById('fullscreenModal').classList.add('active');
            document.body.classList.add('modal-open');

            // Destroy previous chart if exists
            if (modalChart) {
                modalChart.destroy();
            }

            const ctx = document.getElementById('modalChart');
            const colorIndex = Object.keys(dataType === 'training' ? trainingMetrics : systemMetrics).indexOf(metricKey);
            currentModalColorIndex = colorIndex;

            modalChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: data.map(d => d.step),
                    datasets: [{
                        label: metricKey,
                        data: data.map(d => d.value),
                        borderColor: colors[colorIndex % colors.length],
                        backgroundColor: colors[colorIndex % colors.length] + '20',
                        fill: true,
                        tension: 0.1,
                        pointRadius: data.length > 100 ? 0 : 3,
                        pointHoverRadius: 5
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: { intersect: false, mode: 'index' },
                    plugins: {
                        legend: { display: true, position: 'top' },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    let value = context.parsed.y;
                                    if (Math.abs(value) < 0.001 || Math.abs(value) > 10000) {
                                        return metricKey + ': ' + value.toExponential(6);
                                    }
                                    return metricKey + ': ' + value.toFixed(6);
                                }
                            }
                        },
                        zoom: {
                            zoom: {
                                drag: {
                                    enabled: true,
                                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                    borderColor: 'rgba(255, 255, 255, 0.4)',
                                    borderWidth: 1
                                },
                                mode: 'xy',
                                onZoomComplete: function() {
                                    // Show reset button when zoomed
                                    document.getElementById('resetZoomBtn').style.display = 'block';
                                }
                            },
                            pan: {
                                enabled: true,
                                mode: 'xy',
                                modifierKey: 'shift'
                            }
                        }
                    },
                    scales: {
                        x: {
                            title: { display: true, text: 'Step', color: '#aaa', font: { size: 14, weight: 'bold' } },
                            grid: { color: '#333' },
                            ticks: { color: '#aaa', font: { size: 12 } }
                        },
                        y: {
                            title: { display: true, text: metricKey, color: '#aaa', font: { size: 14, weight: 'bold' } },
                            grid: { color: '#333' },
                            ticks: {
                                color: '#aaa',
                                font: { size: 12 },
                                callback: function(value) {
                                    if (Math.abs(value) < 0.001 || Math.abs(value) > 10000) return value.toExponential(2);
                                    return value.toFixed(4);
                                }
                            }
                        }
                    }
                }
            });
        }

        function closeFullscreen() {
            document.getElementById('fullscreenModal').classList.remove('active');
            document.body.classList.remove('modal-open');
            document.getElementById('resetZoomBtn').style.display = 'none';
            currentModalData = null;
            currentModalKey = null;
            if (modalChart) {
                modalChart.destroy();
                modalChart = null;
            }
        }

        function resetZoom() {
            if (modalChart) {
                modalChart.resetZoom();
                document.getElementById('resetZoomBtn').style.display = 'none';
            }
        }

        // Close modal with Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') closeFullscreen();
        });

        // Double-click to reset zoom
        document.getElementById('modalChart').addEventListener('dblclick', function() {
            resetZoom();
        });

        // Resize modal chart when window resizes
        window.addEventListener('resize', function() {
            if (modalChart) {
                modalChart.resize();
            }
        });

        const colors = ['#4dc9f6', '#f67019', '#f53794', '#537bc4', '#acc236', '#166a8f', '#00a950', '#58595b', '#8549ba', '#ff6384'];
        let trainingMetrics = ${JSON.stringify(allMetrics)};
        let systemMetrics = ${JSON.stringify(runData.systemMetrics)};

        // Store chart instances for live updates
        const chartInstances = {};

        // Listen for data updates from extension
        window.addEventListener('message', event => {
            const message = event.data;
            if (message.command === 'updateData') {
                console.log('[W&B Viewer] Live update received, refreshing charts...');
                trainingMetrics = message.trainingMetrics;
                systemMetrics = message.systemMetrics;
                updateAllCharts();
            }
        });

        function updateAllCharts() {
            // Update training metric charts
            for (const [metric, data] of Object.entries(trainingMetrics)) {
                const canvasId = 'chart-training-' + metric.replace(/[^a-zA-Z0-9]/g, '_');
                updateChart(canvasId, metric, data);
            }

            // Update system metric charts
            for (const [metric, data] of Object.entries(systemMetrics)) {
                const canvasId = 'chart-system-' + metric.replace(/[^a-zA-Z0-9]/g, '_');
                updateChart(canvasId, metric, data);
            }

            // Update modal chart if open
            if (modalChart && currentModalKey) {
                const data = trainingMetrics[currentModalKey] || systemMetrics[currentModalKey];
                if (data) {
                    currentModalData = data;
                    const smoothingFactor = parseFloat(document.getElementById('smoothingSlider').value);
                    const values = data.map(d => d.value);
                    const smoothedValues = applySmoothing(values, smoothingFactor);

                    modalChart.data.labels = data.map(d => d.step);
                    modalChart.data.datasets[0].data = smoothedValues;
                    modalChart.update({ duration: 0, lazy: true });
                }
            }
        }

        function updateChart(canvasId, label, data) {
            const chart = chartInstances[canvasId];
            if (chart && data && data.length > 0) {
                chart.data.labels = data.map(d => d.step);
                chart.data.datasets[0].data = data.map(d => d.value);
                chart.data.datasets[0].pointRadius = data.length > 50 ? 0 : 3;
                chart.update({ duration: 0, lazy: true });
            }
        }

        function createChart(canvasId, label, data, colorIndex = 0) {
            const ctx = document.getElementById(canvasId);
            if (!ctx || !data || data.length === 0) return;

            const chart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: data.map(d => d.step),
                    datasets: [{
                        label: label,
                        data: data.map(d => d.value),
                        borderColor: colors[colorIndex % colors.length],
                        backgroundColor: colors[colorIndex % colors.length] + '20',
                        fill: true,
                        tension: 0.1,
                        pointRadius: data.length > 50 ? 0 : 3,
                        pointHoverRadius: 5
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: { intersect: false, mode: 'index' },
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    let value = context.parsed.y;
                                    if (Math.abs(value) < 0.001 || Math.abs(value) > 10000) {
                                        return label + ': ' + value.toExponential(4);
                                    }
                                    return label + ': ' + value.toFixed(4);
                                }
                            }
                        }
                    },
                    scales: {
                        x: {
                            title: { display: true, text: 'Step', color: '#aaa', font: { size: 12, weight: 'bold' } },
                            grid: { color: '#333' },
                            ticks: { color: '#aaa', font: { size: 11 } }
                        },
                        y: {
                            title: { display: true, text: label, color: '#aaa', font: { size: 12, weight: 'bold' } },
                            grid: { color: '#333' },
                            ticks: {
                                color: '#aaa',
                                font: { size: 11 },
                                callback: function(value) {
                                    if (Math.abs(value) < 0.001 || Math.abs(value) > 10000) return value.toExponential(2);
                                    return value.toFixed(2);
                                }
                            }
                        }
                    }
                }
            });

            // Store chart instance for live updates
            chartInstances[canvasId] = chart;
        }

        let chartIndex = 0;
        for (const [metric, data] of Object.entries(trainingMetrics)) {
            createChart('chart-training-' + metric.replace(/[^a-zA-Z0-9]/g, '_'), metric, data, chartIndex++);
        }
        chartIndex = 0;
        for (const [metric, data] of Object.entries(systemMetrics)) {
            createChart('chart-system-' + metric.replace(/[^a-zA-Z0-9]/g, '_'), metric, data, chartIndex++);
        }
    </script>
</body>
</html>`;
    }
    groupMetrics(metrics) {
        const groups = {};
        for (const [key, values] of Object.entries(metrics)) {
            if (!values || values.length === 0)
                continue;
            // Extract group name from the metric's natural hierarchy
            // e.g., "loss/mean" -> "loss", "gpu.0.memory" -> "gpu.0", "entropy" -> "entropy"
            const groupName = this.extractGroupName(key);
            if (!groups[groupName])
                groups[groupName] = {};
            groups[groupName][key] = values;
        }
        // Sort groups: alphabetically, but with common training metrics first
        const result = [];
        const allGroupNames = Object.keys(groups).sort((a, b) => {
            // Priority groups come first (if they exist)
            const priority = ['loss', 'accuracy', 'lr', 'optim', 'perf', 'time', 'step'];
            const aIdx = priority.findIndex(p => a.toLowerCase().startsWith(p));
            const bIdx = priority.findIndex(p => b.toLowerCase().startsWith(p));
            if (aIdx !== -1 && bIdx !== -1)
                return aIdx - bIdx;
            if (aIdx !== -1)
                return -1;
            if (bIdx !== -1)
                return 1;
            // GPU groups come after priority groups but before others
            const aIsGpu = a.toLowerCase().startsWith('gpu');
            const bIsGpu = b.toLowerCase().startsWith('gpu');
            if (aIsGpu && bIsGpu)
                return a.localeCompare(b);
            if (aIsGpu)
                return 1;
            if (bIsGpu)
                return 1;
            return a.localeCompare(b);
        });
        for (const name of allGroupNames) {
            result.push({ name, metrics: groups[name] });
        }
        return result;
    }
    /**
     * Extract the group name from a metric key based on its natural structure.
     * Uses the first path component (before / or .) as the group.
     * This is robust because it uses the metric's own naming, not hardcoded patterns.
     */
    extractGroupName(key) {
        // Handle hierarchical names with / (e.g., "loss/mean" -> "loss")
        if (key.includes('/')) {
            return key.split('/')[0];
        }
        // Handle dot-separated names (e.g., "gpu.0.memory" -> "gpu.0")
        if (key.includes('.')) {
            const parts = key.split('.');
            // For gpu.X.metric, group by gpu.X
            if (parts[0] === 'gpu' && parts.length >= 3) {
                return `gpu.${parts[1]}`;
            }
            // For other dot-separated names, use first component
            return parts[0];
        }
        // Handle underscore-separated names with common prefixes
        // e.g., "train_loss" -> "train", "val_accuracy" -> "val"
        if (key.includes('_')) {
            const parts = key.split('_');
            const commonPrefixes = ['train', 'val', 'test', 'eval'];
            if (commonPrefixes.includes(parts[0])) {
                return parts[0];
            }
        }
        // For simple names without hierarchy, use the full name as the group
        // This keeps related metrics together (e.g., standalone "loss", "lr", "epoch")
        return key;
    }
    generateMetricGroupsHtml(groups, prefix) {
        if (groups.length === 0)
            return '<div class="no-data">No metrics found</div>';
        return groups.map(group => `
            <div class="metric-group">
                <h3>${group.name}</h3>
                <div class="charts-grid">
                    ${Object.keys(group.metrics).map(key => {
            const safeKey = key.replace(/[^a-zA-Z0-9]/g, '_');
            return `
                        <div class="chart-container">
                            <div class="chart-header">
                                <div class="chart-title">${key}</div>
                                <button class="btn btn-small" onclick="openFullscreen('${key.replace(/'/g, "\\'")}', '${prefix}')">⛶</button>
                            </div>
                            <div class="chart-wrapper">
                                <canvas id="chart-${prefix}-${safeKey}"></canvas>
                            </div>
                        </div>
                    `;
        }).join('')}
                </div>
            </div>
        `).join('');
    }
    generateConfigHtml(config) {
        if (Object.keys(config).length === 0)
            return '<div class="no-data">No configuration found</div>';
        return Object.entries(config).map(([key, value]) => `
            <div class="config-item">
                <div class="config-key">${key}</div>
                <div class="config-value">${typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}</div>
            </div>
        `).join('');
    }
}
WandbEditorProvider.viewType = 'wandb-viewer.wandbFile';
function deactivate() { }
//# sourceMappingURL=extension.js.map