# Bread Wandb Viewer

Compare and visualize your Weights & Biases training runs locally without leaving VS Code.

![Bread Wandb Viewer Screenshot](https://raw.githubusercontent.com/Bread-Technologies/bread_wandb_viewer_extension/main/screenshot.png)

## Why?

Switching to your browser to compare training runs is slow. This extension lets you view and compare multiple runs side-by-side with interactive charts, all from VS Code.

## How to use

**To compare multiple runs:**
1. Right-click any folder containing W&B runs in the VS Code explorer
2. Select "Bread Wandb Viewer"
3. Select which runs to compare using the sidebar checkboxes

**To view a single run:**
- Click any `.wandb` file to open it directly

## Features

- **Compare runs** - View multiple runs overlaid on the same charts
- **Interactive selection** - Toggle runs on/off to compare different combinations
- **Live updates** - Charts refresh automatically during training
- **Fullscreen charts** - Click any chart to expand it
- **Zoom & pan** - Drag to zoom, shift+drag to pan, double-click to reset
- **EMA smoothing** - Adjustable smoothing with optional raw data overlay
- **Grouped metrics** - Automatically organizes metrics by prefix (loss/, train/, etc.)
- **Metadata view** - Compare hyperparameters and config across runs

## Installation

Install from the VS Code marketplace, or download the `.vsix` from releases:

```bash
code --install-extension wandb-viewer-0.2.0.vsix
```

## Notes

- Reads binary `.wandb` files directly using protobuf - no wandb CLI or API needed
- Works completely offline
- Tested with wandb SDK 0.15+ file format

## Issues?

Open an issue on GitHub. PRs welcome.
