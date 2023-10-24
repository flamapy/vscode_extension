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

let statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
        statusBarItem.text = "$(sync~spin) Processing...";


async function getPyodideInstance() {
    if (!globalPyodideInstance) {
        globalPyodideInstance = await loadPyodide();
    }
    return globalPyodideInstance;
}

async function ensurePackagesLoaded(pyodide) {
    if (!packagesLoaded) {
        statusBarItem.show();

        await pyodide.loadPackage(['micropip']);
        const micropip = pyodide.pyimport("micropip");


        //Now we install our custom wheels for antlr4 so its wasm compatible
        await micropip.install("https://github.com/flamapy/tutorial/raw/wasm-UVL/files/antlr4_python3_runtime-4.7.2-py3-none-any.whl");
        await micropip.install("uvlparser==1.0.2");
		await micropip.install("afmparser==1.0.0");
		await pyodide.runPythonAsync(`
        import micropip
        await micropip.install("flamapy-fm-dist", deps=False)#this is to avoid problems with deps later on
        await micropip.install("flamapy==1.1.3", deps=False);
        await micropip.install("flamapy-fm==1.1.3", deps=False);
        await micropip.install("flamapy-sat");
        `)
        //Let's install Flama starting with the UVLparser
        
        //This function installs the flamapy-fm distribution but without its dependencies as fire wont work on wasm
        //Note that the code of python has a different identation to avoid problems with tabs.
        packagesLoaded = true;
        statusBarItem.hide();
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
    if(packagesLoaded==false){
        vscode.window.showWarningMessage('Pyodide and Flama are not yet loaded. Please wait!');
        return null
    }
    await ensurePackagesLoaded(pyodide);

    // Example usage:
    let uvl_file = getActiveFileContent();
    if ( uvl_file== null){
        vscode.window.showWarningMessage('No active UVL file. Cannot execute the operation!');
        return null
    }
    pyodide.FS.writeFile("uvlfile.uvl", uvl_file, { encoding: "utf8" });
   
    return pyodide.runPythonAsync(
        `
        from flamapy.interfaces.python.FLAMAFeatureModel import FLAMAFeatureModel
        fm = FLAMAFeatureModel("uvlfile.uvl")
        `+code
    );
}

class ButtonProvider {
    getTreeItem(element) {
        return element;
    }

    getChildren(element) {
        if (!element) {
            return [
                this.createButton('Products', 'flamapy.products'),
                this.createButton('Valid', 'flamapy.valid'),
                this.createButton('Atomic Sets', 'flamapy.atomic_sets'),
                this.createButton('Avg Branching Factor', 'flamapy.average_branching_factor'),
                this.createButton('Count Leafs', 'flamapy.count_leafs'),
                this.createButton('Estimated #Configurations', 'flamapy.estimated_number_of_products'),
                this.createButton('Leaf feature lists', 'flamapy.leaf_features'),
                this.createButton('Max Depth', 'flamapy.max_depth'),
                this.createButton('Core Features', 'flamapy.core_features'),
                this.createButton('Dead Features', 'flamapy.dead_features'),
                this.createButton('Error detection', 'flamapy.error_detection'),
                this.createButton('False Optional Features', 'flamapy.false_optional_features'),
                this.createButton('#Configurations', 'flamapy.products_number')
            ];
        }
        return [];
    }

    createButton(label, command) {
        const treeItem = new vscode.TreeItem(label, vscode.TreeItemCollapsibleState.None);
        treeItem.command = { 
            command: command,
            title: label,
            arguments: [] 
        };
        return treeItem;
    }
}

function createCommand(id,code,result_header){
    let command = vscode.commands.registerCommand(id, function () {
        
        statusBarItem.show();
        
        exec_python(code).then((result) => {
            if (result != null) {
                const panel = vscode.window.createWebviewPanel(
                    'resultDisplay', 
                    result_header, 
                    vscode.ViewColumn.Two, 
                    {}
                );
                panel.webview.html = `<html><body>`+result+`</body></html>`;
        }
        statusBarItem.hide()
        });
    
    });
    return command
}
function activate(context) {
    const provider = new ButtonProvider();
    vscode.window.registerTreeDataProvider('flamaView', provider);
    vscode.commands.executeCommand('setContext', 'flamaPackagesLoaded', false);

    //This is to start loading pyodide asap
    (async () => {
        try {
            vscode.window.showInformationMessage('Loading Pyodide and Flama packages');

            const pyodide = await getPyodideInstance();
            ensurePackagesLoaded(pyodide).then(() => {
                vscode.window.showInformationMessage('Done Loading Pyodide and Flama packages');
            })
        } catch (error) {
            console.error("Error initializing Pyodide and Flama:", error);
        }
    })();

    let flamapy_products = createCommand(
        'flamapy.products',
        `
        
        result=fm.products()
        "<br>".join([f'P({i}): {p}' for i, p in enumerate(result, 1)])    
        `,
        'Products Result')

    let flamapy_valid = createCommand(
        'flamapy.valid',
        `
        result=fm.valid()
        "The feature model is valid? " + str(result)
        `,
        'Valid Result')

    let flamapy_dead_features = createCommand(
        'flamapy.dead_features',
        `
        result=fm.dead_features()
        "<br>".join([f'F({i}): {p}' for i, p in enumerate(result, 1)])    
        ` ,
        'Dead Features Result')

    let flamapy_false_optional_features = createCommand(
        'flamapy.false_optional_features',
        `
        result=fm.false_optional_features()
        "<br>".join([f'F({i}): {p}' for i, p in enumerate(result, 1)])    
        `,
        'False Optional Features Result')
    
    let flamapy_core_features = createCommand(
        'flamapy.core_features',
        `
        result=fm.core_features()
        "<br>".join([f'F({i}): {p}' for i, p in enumerate(result, 1)])    
        `,
        'Core Features Result')
    
    let flamapy_atomic_sets = createCommand(
        'flamapy.atomic_sets',
        `
        result=fm.atomic_sets()
        "<br>".join([f'AS({i}): {p}' for i, p in enumerate(result, 1)])    
        `,
        'Atomix Sets Result')
        
    let flamapy_average_branching_factor = createCommand(
        'flamapy.average_branching_factor',
        `
        result=fm.average_branching_factor()
        "<br>"+str(result)
        `,
        'Avg Branching Factor Result')

    let flamapy_count_leafs = createCommand(
        'flamapy.count_leafs',
        `
        result=fm.count_leafs()
        "<br>"+str(result)
        `,
        'Count leafs Result')

    let flamapy_estimated_number_of_products = createCommand(
        'flamapy.estimated_number_of_products',
        `
        result=fm.estimated_number_of_products()
        "<br>"+str(result)
        `,
        'Estimated #Configurations Result')        

    let flamapy_leaf_features = createCommand(
        'flamapy.leaf_features',
        `
        result=fm.leaf_features()
        "<br>".join([f'AS({i}): {p}' for i, p in enumerate(result, 1)])    
        `,
        'Leaf Features Result')        
    let flamapy_max_depth = createCommand(
        'flamapy.max_depth',
        `
        result=fm.max_depth()
        "<br>"+str(result)
        `,
        'Max Depth Result')     
    let flamapy_error_detection = createCommand(
        'flamapy.error_detection',
        `
        result=fm.max_depth()
        "<br>"+str(result)
        `,
        'Errors Result') 

    let flamapy_products_number = createCommand(
        'flamapy.products_number',
        `
        result=fm.products_number()
        "<br>"+str(result)
        `,
        '#Configurations Result')  


    context.subscriptions.push(flamapy_products)
    context.subscriptions.push(flamapy_valid)
    context.subscriptions.push(flamapy_atomic_sets)
    context.subscriptions.push(flamapy_average_branching_factor)
    context.subscriptions.push(flamapy_count_leafs)
    context.subscriptions.push(flamapy_estimated_number_of_products)
    context.subscriptions.push(flamapy_leaf_features)
    context.subscriptions.push(flamapy_max_depth)
    context.subscriptions.push(flamapy_core_features)
    context.subscriptions.push(flamapy_dead_features)
    context.subscriptions.push(flamapy_error_detection)
    context.subscriptions.push(flamapy_false_optional_features)
    context.subscriptions.push(flamapy_products_number)
}

function deactivate() {}    

module.exports = {
    activate,
    deactivate
};



