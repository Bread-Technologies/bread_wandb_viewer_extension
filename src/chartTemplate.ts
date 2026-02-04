/**
 * Unified chart template for both single-run and multi-run views
 * Consolidates all Chart.js rendering logic into one clean implementation
 */

/**
 * Returns unified chart CSS styles
 */
export function getChartStyles(): string {
    return `
        * { box-sizing: border-box; }

        body.modal-open { overflow: hidden; }

        .controls-bar {
            padding: 15px 20px;
            background: var(--vscode-editor-background);
            border-bottom: 1px solid var(--vscode-panel-border, #444);
            display: flex;
            gap: 15px;
            align-items: center;
            flex-wrap: wrap;
        }

        .control-group {
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .control-group label {
            font-size: 0.9em;
            white-space: nowrap;
        }

        .control-group input[type="text"] {
            background: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            border: 1px solid var(--vscode-input-border);
            padding: 4px 8px;
            border-radius: 3px;
            font-size: 0.9em;
            width: 200px;
        }

        .control-group input[type="text"]:focus {
            outline: 1px solid var(--vscode-focusBorder);
        }

        .control-group input[type="checkbox"] {
            cursor: pointer;
            width: 16px;
            height: 16px;
        }

        input[type="range"] {
            width: 120px;
            cursor: pointer;
            -webkit-appearance: none;
            appearance: none;
            background: transparent;
            height: 20px;
        }

        input[type="range"]::-webkit-slider-runnable-track {
            height: 4px;
            background: #444;
            border-radius: 2px;
        }

        input[type="range"]::-webkit-slider-thumb {
            -webkit-appearance: none;
            width: 14px;
            height: 14px;
            background: #888;
            border-radius: 50%;
            margin-top: -5px;
            cursor: pointer;
        }

        input[type="range"]::-webkit-slider-thumb:hover { background: #aaa; }

        input[type="range"]::-moz-range-track {
            height: 4px;
            background: #444;
            border-radius: 2px;
        }

        input[type="range"]::-moz-range-thumb {
            width: 14px;
            height: 14px;
            background: #888;
            border-radius: 50%;
            border: none;
            cursor: pointer;
        }

        input[type="range"]::-moz-range-thumb:hover { background: #aaa; }
        input[type="range"]:focus { outline: none; }

        .smoothing-value {
            min-width: 35px;
            text-align: right;
            font-family: monospace;
            font-size: 0.9em;
        }

        .toggle-btn {
            background: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
            border: 1px solid var(--vscode-button-border);
            padding: 4px 10px;
            cursor: pointer;
            border-radius: 3px;
            font-size: 0.85em;
        }

        .toggle-btn:hover {
            background: var(--vscode-button-secondaryHoverBackground);
        }

        .toggle-btn.active {
            background: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
        }

        .axis-toggles {
            display: flex;
            gap: 8px;
        }

        .ai-context-btn {
            background: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            padding: 6px 12px;
            border-radius: 3px;
            cursor: pointer;
            font-size: 13px;
            position: relative;
        }

        .ai-context-btn:hover {
            background: var(--vscode-button-hoverBackground);
        }

        .ai-context-menu {
            position: absolute;
            background: var(--vscode-menu-background);
            border: 1px solid var(--vscode-menu-border);
            border-radius: 3px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            z-index: 1000;
            margin-top: 2px;
            min-width: 180px;
            right: 0;
        }

        .ai-context-menu button {
            display: block;
            width: 100%;
            padding: 8px 16px;
            text-align: left;
            background: transparent;
            border: none;
            cursor: pointer;
            color: var(--vscode-menu-foreground);
            font-size: 13px;
        }

        .ai-context-menu button:hover {
            background: var(--vscode-menu-selectionBackground);
        }

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
            color: var(--vscode-foreground);
            border-bottom: 2px solid transparent;
        }

        .tab:hover { background: var(--vscode-list-hoverBackground); }
        .tab.active { border-bottom-color: var(--vscode-focusBorder, #007acc); }
        .tab-content { display: none; }
        .tab-content.active { display: block; }

        .metric-group {
            margin-bottom: 30px;
        }

        .metric-group.hidden { display: none; }

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

        .chart-container, .metric-card {
            background: var(--vscode-editor-inactiveSelectionBackground, #252526);
            padding: 15px;
            border-radius: 8px;
            min-height: 250px;
            position: relative;
        }

        .chart-container.hidden, .metric-card.hidden { display: none; }

        .chart-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 10px;
        }

        .chart-title, .metric-title {
            font-size: 1em;
            font-weight: 600;
        }

        .chart-wrapper {
            position: relative;
            height: 200px;
        }

        .btn-small, .btn-fullscreen {
            background: transparent;
            border: 1px solid var(--vscode-button-border);
            color: var(--vscode-foreground);
            padding: 4px 8px;
            border-radius: 3px;
            cursor: pointer;
            font-size: 14px;
            opacity: 0.7;
            transition: opacity 0.2s;
        }

        .btn-small:hover, .btn-fullscreen:hover { opacity: 1; }

        .no-data {
            text-align: center;
            padding: 40px;
            color: var(--vscode-descriptionForeground, #888);
        }

        /* Modal */
        .modal {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: var(--vscode-editor-background);
            z-index: 1000;
            padding: 20px;
            flex-direction: column;
        }

        .modal.active { display: flex; }

        .modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
        }

        .modal-title {
            font-size: 1.4em;
            font-weight: 600;
        }

        .modal-controls {
            display: flex;
            align-items: center;
            gap: 15px;
        }

        .modal-close {
            background: none;
            border: none;
            color: var(--vscode-foreground);
            font-size: 24px;
            cursor: pointer;
            padding: 5px 10px;
        }

        .modal-close:hover { color: var(--vscode-errorForeground, #f48771); }

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

        .zoom-hint {
            font-size: 0.75em;
            color: var(--vscode-descriptionForeground, #666);
            font-style: italic;
        }
    `;
}

/**
 * Returns unified chart JavaScript code
 */
export function getChartScript(): string {
    return `
        // ==================== CONSTANTS ====================
        const CHART_COLORS = [
            '#4dc9f6', '#f67019', '#f53794', '#537bc4', '#acc236',
            '#166a8f', '#00a950', '#58595b', '#8549ba', '#ff6384'
        ];

        // ==================== STATE ====================
        let chartInstances = {};
        let modalChart = null;
        let globalSmoothing = 0;
        let showRaw = true;
        let logX = false;
        let logY = false;
        let modalLogX = false;
        let modalLogY = false;
        let aiContextMenuOpen = false;

        // ==================== CORE FUNCTIONS ====================

        /**
         * EMA smoothing algorithm
         */
        function applySmoothing(values, factor) {
            if (factor === 0 || values.length === 0) return values;

            const smoothed = [];
            let last = values[0];

            for (let i = 0; i < values.length; i++) {
                const smoothedValue = factor * last + (1 - factor) * values[i];
                smoothed.push(smoothedValue);
                last = smoothedValue;
            }

            return smoothed;
        }

        /**
         * Create unified Chart.js chart
         */
        function createUnifiedChart(ctx, datasets, metricName, options = {}) {
            // Calculate max dataset size for decimation
            const maxPoints = Math.max(...datasets.map(d => d.data ? d.data.length : 0), 0);

            return new Chart(ctx, {
                type: 'line',
                data: {
                    datasets
                },
                options: {
                    parsing: {
                        xAxisKey: 'x',
                        yAxisKey: 'y'
                    },
                    decimation: maxPoints > 500 ? {
                        enabled: true,
                        algorithm: 'lttb',
                        samples: 250,
                        threshold: 500
                    } : {
                        enabled: false
                    },
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: { intersect: false, mode: 'index' },
                    plugins: {
                        legend: {
                            display: true,
                            position: 'top',
                            labels: {
                                color: '#d4d4d4',
                                usePointStyle: true,
                                padding: 10,
                                font: { size: options.isModal ? 12 : 11 },
                                filter: (item) => !item.text.includes(' (raw)')
                            }
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    const label = context.dataset.label || '';
                                    const value = context.parsed.y;
                                    const decimals = options.isModal ? 6 : 4;
                                    const formatted = Math.abs(value) < 0.001 || Math.abs(value) > 10000
                                        ? value.toExponential(decimals)
                                        : value.toFixed(decimals);
                                    return label + ': ' + formatted;
                                }
                            }
                        },
                        ...(options.enableZoom && {
                            zoom: {
                                zoom: {
                                    drag: {
                                        enabled: true,
                                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                        borderColor: 'rgba(255, 255, 255, 0.4)',
                                        borderWidth: 1
                                    },
                                    mode: 'xy'
                                }
                            }
                        })
                    },
                    scales: {
                        x: {
                            type: 'linear',
                            title: {
                                display: true,
                                text: 'Step',
                                color: '#aaa',
                                font: { size: options.isModal ? 14 : 12, weight: 'bold' }
                            },
                            grid: { color: '#333' },
                            ticks: { color: '#aaa', font: { size: options.isModal ? 12 : 11 } }
                        },
                        y: {
                            type: 'linear',
                            title: {
                                display: true,
                                text: metricName,
                                color: '#aaa',
                                font: { size: options.isModal ? 14 : 12, weight: 'bold' }
                            },
                            grid: { color: '#333' },
                            ticks: {
                                color: '#aaa',
                                font: { size: options.isModal ? 12 : 11 },
                                callback: function(value) {
                                    const decimals = options.isModal ? 4 : 2;
                                    
                                    // Always use exponential for very small or very large numbers
                                    if (Math.abs(value) < 0.001 || Math.abs(value) > 10000) {
                                        return value.toExponential(2);
                                    }
                                    
                                    // For values in normal range, check if toFixed would show significant digits
                                    const formatted = value.toFixed(decimals);
                                    const asNumber = parseFloat(formatted);
                                    
                                    // If toFixed rounds to zero but value isn't actually zero, use exponential
                                    if (asNumber === 0 && value !== 0) {
                                        return value.toExponential(2);
                                    }
                                    
                                    return formatted;
                                }
                            }
                        }
                    },
                    ...(options.onClick && { onClick: options.onClick })
                }
            });
        }

        /**
         * Update chart with smoothing
         */
        function updateChartSmoothing(chart, smoothing, showRawData = true) {
            if (!chart || !chart.data.datasets) return;

            const originals = chart.data.datasets.filter(d => d._isOriginal);
            if (originals.length === 0) return;

            if (smoothing === 0) {
                chart.data.datasets = originals.map(d => ({
                    label: d._runName,
                    data: d._originalData,
                    borderColor: d._originalColor,
                    backgroundColor: d._originalColor + '20',
                    fill: true,
                    tension: 0.1,
                    pointRadius: d._originalData.length > 100 ? 0 : 2,
                    pointHoverRadius: 4,
                    borderWidth: 2,
                    _originalData: d._originalData,
                    _originalColor: d._originalColor,
                    _runName: d._runName,
                    _isOriginal: true
                }));
            } else {
                const newDatasets = [];

                originals.forEach(d => {
                    const values = d._originalData.map(p => p.y);
                    const smoothed = applySmoothing(values, smoothing);

                    if (showRawData) {
                        newDatasets.push({
                            label: d._runName + ' (raw)',
                            data: d._originalData,
                            borderColor: d._originalColor + '4D',
                            backgroundColor: 'transparent',
                            fill: false,
                            tension: 0.1,
                            pointRadius: 0,
                            pointHoverRadius: 3,
                            borderWidth: 1,
                            _originalData: d._originalData,
                            _originalColor: d._originalColor,
                            _runName: d._runName,
                            _isOriginal: false
                        });
                    }

                    newDatasets.push({
                        label: d._runName,
                        data: smoothed.map((y, i) => ({ x: d._originalData[i].x, y })),
                        borderColor: d._originalColor,
                        backgroundColor: d._originalColor + '20',
                        fill: true,
                        tension: 0.1,
                        pointRadius: d._originalData.length > 100 ? 0 : 2,
                        pointHoverRadius: 4,
                        borderWidth: 2,
                        _originalData: d._originalData,
                        _originalColor: d._originalColor,
                        _runName: d._runName,
                        _isOriginal: true
                    });
                });

                chart.data.datasets = newDatasets;
            }

            chart.update('none');
        }

        /**
         * Update chart axes
         */
        function updateChartAxes(chart, logXAxis, logYAxis) {
            if (!chart) return;
            chart.options.scales.x.type = logXAxis ? 'logarithmic' : 'linear';
            chart.options.scales.y.type = logYAxis ? 'logarithmic' : 'linear';
            chart.update();
        }

        // ==================== GLOBAL CONTROLS ====================

        function updateGlobalSmoothing() {
            const value = parseFloat(document.getElementById('globalSmoothing').value);
            document.getElementById('globalSmoothingValue').textContent = value.toFixed(2);
            globalSmoothing = value;

            const showRawGroup = document.getElementById('showRawGroup');
            if (showRawGroup) {
                showRawGroup.style.display = value > 0 ? 'flex' : 'none';
            }

            Object.values(chartInstances).forEach(chart => {
                updateChartSmoothing(chart, value, showRaw);
            });
        }

        function trackGlobalSmoothing() {
            const value = parseFloat(document.getElementById('globalSmoothing').value);

            vscode.postMessage({
                command: 'telemetry',
                eventName: 'chart.smoothingChanged',
                properties: {
                    smoothingValue: value.toFixed(2),
                    scope: 'global'
                }
            });
        }

        function toggleShowRaw() {
            showRaw = !showRaw;
            document.getElementById('showRawBtn').classList.toggle('active', showRaw);

            // Track raw data toggle
            vscode.postMessage({
                command: 'telemetry',
                eventName: 'chart.rawDataToggled',
                properties: { enabled: showRaw.toString(), scope: 'global' }
            });

            Object.values(chartInstances).forEach(chart => {
                updateChartSmoothing(chart, globalSmoothing, showRaw);
            });
        }

        function toggleLogAxis(axis) {
            if (axis === 'x') {
                logX = !logX;
                document.getElementById('logXBtn').classList.toggle('active', logX);
            } else {
                logY = !logY;
                document.getElementById('logYBtn').classList.toggle('active', logY);
            }

            // Track log scale toggle
            const enabled = axis === 'x' ? logX : logY;
            vscode.postMessage({
                command: 'telemetry',
                eventName: 'chart.logScaleToggled',
                properties: { axis: axis, enabled: enabled.toString(), scope: 'global' }
            });

            Object.values(chartInstances).forEach(chart => {
                updateChartAxes(chart, logX, logY);
            });
        }

        function filterMetrics() {
            const searchText = document.getElementById('searchInput').value;
            let regex;

            try {
                regex = new RegExp(searchText, 'i');
            } catch (e) {
                regex = { test: (str) => str.toLowerCase().includes(searchText.toLowerCase()) };
            }

            const selector = '.chart-container, .metric-card';
            let matchCount = 0;
            document.querySelectorAll(selector).forEach(container => {
                const titleEl = container.querySelector('.chart-title, .metric-title');
                if (titleEl) {
                    const title = titleEl.textContent;
                    const matches = !searchText || regex.test(title);
                    container.classList.toggle('hidden', !matches);
                    if (matches) matchCount++;
                }
            });

            document.querySelectorAll('.metric-group').forEach(group => {
                const visibleCharts = group.querySelectorAll(selector + ':not(.hidden)');
                group.classList.toggle('hidden', visibleCharts.length === 0 && searchText);
            });

            // Track metric filtering (debounce to avoid spam)
            if (searchText) {
                clearTimeout(window.filterDebounce);
                window.filterDebounce = setTimeout(() => {
                    vscode.postMessage({
                        command: 'telemetry',
                        eventName: 'ui.metricFiltered',
                        properties: { matchCount: matchCount.toString(), hasText: 'true' }
                    });
                }, 1000);
            }
        }

        function showAIContextMenu(event) {
            if (event) {
                event.stopPropagation();
            }
            const menu = document.getElementById('aiContextMenu');
            aiContextMenuOpen = !aiContextMenuOpen;
            menu.style.display = aiContextMenuOpen ? 'block' : 'none';
        }

        function generateAIContext(action) {
            vscode.postMessage({ command: 'generateAIContext', action: action });
            document.getElementById('aiContextMenu').style.display = 'none';
            aiContextMenuOpen = false;
        }

        // Close AI context menu when clicking outside
        document.addEventListener('click', (e) => {
            if (aiContextMenuOpen && !e.target.closest('.ai-context-btn') && !e.target.closest('.ai-context-menu')) {
                document.getElementById('aiContextMenu').style.display = 'none';
                aiContextMenuOpen = false;
            }
        });

        // ==================== MODAL CONTROLS ====================

        function updateModalSmoothing() {
            const value = parseFloat(document.getElementById('modalSmoothing').value);
            document.getElementById('modalSmoothingValue').textContent = value.toFixed(2);
            updateChartSmoothing(modalChart, value, true);
        }

        function trackModalSmoothing() {
            const value = parseFloat(document.getElementById('modalSmoothing').value);

            vscode.postMessage({
                command: 'telemetry',
                eventName: 'chart.smoothingChanged',
                properties: {
                    smoothingValue: value.toFixed(2),
                    scope: 'modal'
                }
            });
        }

        function toggleModalLogAxis(axis) {
            if (axis === 'x') {
                modalLogX = !modalLogX;
                document.getElementById('modalLogXBtn').classList.toggle('active', modalLogX);
            } else {
                modalLogY = !modalLogY;
                document.getElementById('modalLogYBtn').classList.toggle('active', modalLogY);
            }

            // Track modal log scale toggle
            const enabled = axis === 'x' ? modalLogX : modalLogY;
            vscode.postMessage({
                command: 'telemetry',
                eventName: 'chart.logScaleToggled',
                properties: { axis: axis, enabled: enabled.toString(), scope: 'modal' }
            });

            updateChartAxes(modalChart, modalLogX, modalLogY);
        }

        function closeFullscreen() {
            document.getElementById('fullscreenModal').classList.remove('active');
            document.body.classList.remove('modal-open');
            if (modalChart) {
                modalChart.destroy();
                modalChart = null;
            }
        }

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') closeFullscreen();
        });

        // Double-click to reset zoom in modal
        const modalCanvas = document.getElementById('modalChart');
        if (modalCanvas) {
            modalCanvas.addEventListener('dblclick', () => {
                if (modalChart) {
                    // Track zoom reset
                    vscode.postMessage({
                        command: 'telemetry',
                        eventName: 'chart.zoomReset',
                        properties: { method: 'doubleClick' }
                    });
                    modalChart.resetZoom();
                }
            });
        }

        // Tab switching
        document.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', () => {
                const targetId = tab.dataset.tab || tab.getAttribute('data-tab');

                // Track tab switching
                if (targetId) {
                    vscode.postMessage({
                        command: 'telemetry',
                        eventName: 'ui.tabSwitched',
                        properties: { tab: targetId }
                    });
                }

                document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
                document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
                tab.classList.add('active');
                const target = document.getElementById(targetId);
                if (target) target.classList.add('active');
            });
        });
    `;
}

/**
 * Returns the controls bar HTML
 */
export function getControlsBarHtml(): string {
    return `
        <div class="controls-bar">
            <div class="control-group">
                <label for="searchInput">Search:</label>
                <input type="text" id="searchInput" placeholder="Filter metrics (regex)..." oninput="filterMetrics()">
            </div>
            <div class="control-group smoothing-control">
                <label for="globalSmoothing">Smoothing:</label>
                <input type="range" id="globalSmoothing" min="0" max="0.99" step="0.01" value="0" oninput="updateGlobalSmoothing()" onchange="trackGlobalSmoothing()">
                <span class="smoothing-value" id="globalSmoothingValue">0.00</span>
            </div>
            <div class="control-group" id="showRawGroup" style="display: none;">
                <button class="toggle-btn active" id="showRawBtn" onclick="toggleShowRaw()">Show Raw</button>
            </div>
            <div class="control-group">
                <label>Axes:</label>
                <div class="axis-toggles">
                    <button class="toggle-btn" id="logXBtn" onclick="toggleLogAxis('x')">Log X</button>
                    <button class="toggle-btn" id="logYBtn" onclick="toggleLogAxis('y')">Log Y</button>
                </div>
            </div>
            <div class="control-group" style="margin-left: auto;">
                <button class="ai-context-btn" onclick="showAIContextMenu(event)">
                    🤖 Generate AI Context ▼
                </button>
                <div class="ai-context-menu" id="aiContextMenu" style="display:none">
                    <button onclick="generateAIContext('copy')">Copy to Clipboard</button>
                    <button onclick="generateAIContext('save')">Save to File...</button>
                </div>
            </div>
        </div>
    `;
}

/**
 * Returns the fullscreen modal HTML
 */
export function getModalHtml(): string {
    return `
        <div id="fullscreenModal" class="modal">
            <div class="modal-header">
                <div class="modal-title" id="modalTitle"></div>
                <div class="modal-controls">
                    <div class="smoothing-control">
                        <label for="modalSmoothing">Smoothing:</label>
                        <input type="range" id="modalSmoothing" min="0" max="0.99" step="0.01" value="0" oninput="updateModalSmoothing()" onchange="trackModalSmoothing()">
                        <span class="smoothing-value" id="modalSmoothingValue">0.00</span>
                    </div>
                    <div class="axis-toggles">
                        <button class="toggle-btn" id="modalLogXBtn" onclick="toggleModalLogAxis('x')">Log X</button>
                        <button class="toggle-btn" id="modalLogYBtn" onclick="toggleModalLogAxis('y')">Log Y</button>
                    </div>
                    <span class="zoom-hint">Drag to zoom • Double-click to reset</span>
                    <button class="modal-close" onclick="closeFullscreen()">&times;</button>
                </div>
            </div>
            <div class="modal-content">
                <canvas id="modalChart" class="modal-chart"></canvas>
            </div>
        </div>
    `;
}
