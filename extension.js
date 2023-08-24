// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
/**
 * @param {vscode.ExtensionContext} context
 */

const vscode = require('vscode');
const { loadPyodide } = require("pyodide");

// Use a dynamic import for node-fetch
let fetchInstance;

import('node-fetch').then(fetchModule => {
    fetchInstance = fetchModule.default;
    globalThis.fetch = fetchInstance;
});

let globalPyodideInstance = null;
let packagesLoaded = false;

async function getPyodideInstance() {
    if (!globalPyodideInstance) {
        globalPyodideInstance = await loadPyodide();
    }
    return globalPyodideInstance;
}

async function ensurePackagesLoaded(pyodide) {
    if (!packagesLoaded) {
        await pyodide.loadPackage(['micropip']);
        const micropip = pyodide.pyimport("micropip");


        //Now we install our custom wheels for antlr4 so its wasm compatible
        await micropip.install("https://github.com/flamapy/tutorial/raw/wasm-UVL/files/antlr4_python3_runtime-4.7.2-py3-none-any.whl");
        
        //Let's install Flama starting with the UVLparser
        await micropip.install("uvlparser");
        await micropip.install("flamapy-fm");
        await micropip.install("flamapy-sat");
        
        //This function installs the flamapy-fm distribution but without its dependencies as fire wont work on wasm
        //Note that the code of python has a different identation to avoid problems with tabs.
        await pyodide.runPythonAsync(`
        import micropip
        await micropip.install("flamapy-fm-dist", deps=False)#this is to avoid problems with deps later on
        `)
        packagesLoaded = true;
    }
}


function getActiveFileContent() {
    const editor = vscode.window.activeTextEditor;
    if (editor) {
        const document = editor.document;
        return document.getText();  // This returns the entire content of the file
    } else {
        console.error("No active editor!");
        return null;
    }
}

async function exec_python(code) {
    const pyodide = await getPyodideInstance();
    
    // Ensure packages are loaded
    await ensurePackagesLoaded(pyodide);

    // Example usage:
    let uvl_file = getActiveFileContent();

    pyodide.FS.writeFile("uvlfile.uvl", uvl_file, { encoding: "utf8" });
   
    return pyodide.runPythonAsync(
        code
    );
}

function activate(context) {
    let products = vscode.commands.registerCommand('flamapy.products', function () {
        exec_python(
        `
        from flamapy.interfaces.python.FLAMAFeatureModel import FLAMAFeatureModel
    
        fm = FLAMAFeatureModel("uvlfile.uvl")
        result=fm.products()
        "<br>".join([f'P({i}): {p}' for i, p in enumerate(result, 1)])    
        `        
        ).then((result) => {
            const panel = vscode.window.createWebviewPanel(
                'resultDisplay', 
                'Products Result', 
                vscode.ViewColumn.Two, 
                {}
            );
            
            panel.webview.html = `<html><body>`+result+`</body></html>`;
        });
    });

    context.subscriptions.push(products);


    let valid = vscode.commands.registerCommand('flamapy.valid', function () {
        exec_python(
        `
        from flamapy.interfaces.python.FLAMAFeatureModel import FLAMAFeatureModel
    
        fm = FLAMAFeatureModel("uvlfile.uvl")
        result=fm.valid()
        "The feature model is valid? " + str(result)
        `        
        ).then((result) => {
            const panel = vscode.window.createWebviewPanel(
                'resultDisplay', 
                'Valid Result', 
                vscode.ViewColumn.Two, 
                {}
            );
            
            panel.webview.html = `<html><body>`+result+`</body></html>`;
        });
        
    });

    context.subscriptions.push(valid);

    let dead_features = vscode.commands.registerCommand('flamapy.dead_features', function () {
        exec_python(
        `
        from flamapy.interfaces.python.FLAMAFeatureModel import FLAMAFeatureModel
    
        fm = FLAMAFeatureModel("uvlfile.uvl")
        result=fm.dead_features()
        "<br>".join([f'F({i}): {p}' for i, p in enumerate(result, 1)])    
        `        
        ).then((result) => {
            const panel = vscode.window.createWebviewPanel(
                'resultDisplay', 
                'Dead Features Result', 
                vscode.ViewColumn.Two, 
                {}
            );
            
            panel.webview.html = `<html><body>`+result+`</body></html>`;
        });
        
    });

    context.subscriptions.push(dead_features);

    let false_optional_features = vscode.commands.registerCommand('flamapy.false_optional_features', function () {
        exec_python(
        `
        from flamapy.interfaces.python.FLAMAFeatureModel import FLAMAFeatureModel
    
        fm = FLAMAFeatureModel("uvlfile.uvl")
        result=fm.false_optional_features()
        "<br>".join([f'F({i}): {p}' for i, p in enumerate(result, 1)])    
        `        
        ).then((result) => {
            const panel = vscode.window.createWebviewPanel(
                'resultDisplay', 
                'False Optional Features Result', 
                vscode.ViewColumn.Two, 
                {}
            );
            
            panel.webview.html = `<html><body>`+result+`</body></html>`;
        });
        
    });

    context.subscriptions.push(false_optional_features);
}

function deactivate() {}    

module.exports = {
    activate,
    deactivate
};



