# ⚠️ This repository is superseded

**What this was:** a VS Code extension running flamapy 1.x operations over `.uvl` files
through Pyodide (dormant since 2023; the committed wheels are flamapy 1.1.3).

**What replaces it:** the flamapy IDE core inside VS Code — planned as
[`flamapy-ide`](https://github.com/flamapy/flamapy-ide) `apps/vscode/`, sharing the same
Pyodide execution model and React components as the browser IDE (flamapy 3.1 roadmap,
Track B.3).

**Migration:** use the [flamapy IDE](https://ide.flamapy.org) today; the VS Code
extension will reappear built on the IDE's shared core.

**Last working version:** flamapy 1.1.3 (Pyodide 0.24).
