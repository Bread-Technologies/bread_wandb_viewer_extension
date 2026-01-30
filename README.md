# W&B Run Viewer

View your Weights & Biases training runs locally without leaving VS Code.

![W&B Viewer Screenshot](https://raw.githubusercontent.com/Bread-Technologies/bread_wandb_viewer_extension/main/screenshot.png)

## Why?

I got tired of switching to my browser every time I wanted to check on a training run. This extension lets you open `.wandb` files directly and see your metrics as interactive charts.

## Features

- **Just click a .wandb file** - Opens automatically with the custom viewer
- **Live updates** - Charts refresh as new data comes in during training
- **Fullscreen mode** - Click the expand button on any chart
- **Zoom & pan** - Drag to zoom, shift+drag to pan, double-click to reset
- **EMA smoothing** - Adjustable smoothing slider in fullscreen mode
- **Grouped metrics** - Automatically organizes metrics by prefix (loss/, train/, etc.)

## Usage

1. Open any folder containing W&B run data
2. Click on a `.wandb` file in the explorer
3. That's it

The viewer shows:
- **Training Metrics** - Everything you logged with `wandb.log()`
- **System Metrics** - GPU usage, memory, etc.
- **Configuration** - Your run config and hyperparameters

## Installation

Install from the VS Code marketplace, or grab the `.vsix` from releases and run:

```
code --install-extension wandb-viewer-0.1.0.vsix
```

## Notes

- This reads the binary `.wandb` files directly using protobuf - no wandb CLI or API needed
- Works completely offline
- Tested with wandb SDK 0.15+ file format

## Issues?

Open an issue on GitHub. PRs welcome.
