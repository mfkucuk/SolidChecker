import * as vscode from 'vscode';
import { beautifyAnswer, sendEndPrompt, sendInitialPrompt, sendOneFilePrompt } from './gemini';

import * as path from 'path';
import { readFileSync } from 'fs';
import { log } from 'console';
import { isGeneratorFunction } from 'util/types';

const settingsTemplateData = require('./settings_template/settings_template.json');

export async function activate(context: vscode.ExtensionContext) {

	vscode.window.showInformationMessage('Congratulations, your extension "solidchecker" is now active!');

	const workspaceFolder = vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders[0];

	if (workspaceFolder) {
		const scDirectoryUri = vscode.Uri.joinPath(workspaceFolder.uri, '.solidchecker');

		if (! await vscode.workspace.fs.stat(scDirectoryUri)) {
			vscode.workspace.fs.createDirectory(scDirectoryUri);

			updateSettingsFile(scDirectoryUri);

			updateIgnoreFile(scDirectoryUri);
		}

	}
	else {
		vscode.window.showErrorMessage('No workspace is open!');
	}

	let runDisposable = vscode.commands.registerCommand('solidchecker.runSolidChecker', async () => {

		if(workspaceFolder) {
			const ignoreUri = vscode.Uri.joinPath(workspaceFolder.uri, '.solidchecker/.scignore');
			const ignoreTemplateData = await vscode.workspace.fs.readFile(ignoreUri);
			const files = await fetchAllFiles(ignoreTemplateData.toString());
			await sendInitialPrompt();

			for ( const [fileName, filePath] of Object.entries(files) ) {
				await sendOneFilePrompt(fileName, filePath);
			}
	
			const answer = await sendEndPrompt();
	
			const answerPanel = vscode.window.createWebviewPanel(
				'runSolidChecker',
				'Solid Checker',
				vscode.ViewColumn.One,
				{},
			);
			
			answerPanel.webview.html = getResultWebviewContent(beautifyAnswer(answer));
			vscode.window.showInformationMessage('gello')
			vscode.window.showInformationMessage(files.toString());
		}
	});

	let configDisposable = vscode.commands.registerCommand('solidchecker.configSolidChecker', async () => {
		
		const configPanel = vscode.window.createWebviewPanel(
			'configSolidChecker',
			'Solid Checker Config',
			vscode.ViewColumn.One,
			{enableScripts: true},
		);
		
		
		
		const workspaceFolder = vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders[0];
		if(workspaceFolder) {
			const SettingsUri = vscode.Uri.joinPath(workspaceFolder.uri, '.solidchecker/settings.json');
			const SettingsFile = await vscode.workspace.fs.readFile(SettingsUri);
		const parsedJson = JSON.parse(SettingsFile.toString());
		configPanel.webview.html = getConfigWebviewContent(parsedJson);
		configPanel.webview.onDidReceiveMessage(
			message => {
				switch (message.command) {
					case 'saveSettings':
						console.log("hello");
						const newSettingsUri = vscode.Uri.joinPath(workspaceFolder.uri, '.solidchecker/settings.json');
						const newSettingsContent = new TextEncoder().encode(JSON.stringify(message.settings, null, 4));
						vscode.workspace.fs.writeFile(newSettingsUri, newSettingsContent);
						vscode.window.showInformationMessage('Settings saved successfully!');
                        const scDirectoryUri = vscode.Uri.joinPath(workspaceFolder.uri, '.solidchecker');
                    	updateConfigPanel(configPanel, context); 
                        setIgnoreFile(message.settings, scDirectoryUri);

						
						break;
				}
			},
			undefined,
			context.subscriptions
		);
		
			
		}
		
	});

	context.subscriptions.push(runDisposable);
	context.subscriptions.push(configDisposable);
}


export function deactivate() {}

function getResultWebviewContent(answer: string) {
    return `
	<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Solid Checker</title>
    <style>
        body, h1, h2, p, .container {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Arial', sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f4f4f4;
            padding: 20px;
        }

        .container {
            max-width: 800px;
            margin: 0 auto;
            background: #fff;
            padding: 20px;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
            border-radius: 8px;
        }

        h1, h2 {
            color: #0056b3;
        }

        h1 {
            font-size: 24px;
            margin-bottom: 10px;
			
        }

        h2 {
            font-size: 20px;
            margin-bottom: 5px;
        }

        p {
            font-size: 16px;
            color: #666;
            margin-bottom: 20px; 
        }

        .title {
            text-align: center;
            font-size: 40px;
            color: #004085;
            margin: 20px 0;
        }

			</style>
		</head>
		<body>
			<h1 class="title">SolidChecker</h1>
			<div class="container">
				<h1>Result Panel</h1>
				<p>${answer}</p>
			</div>
		</body>
		</html>



    `;
}

function getConfigWebviewContent(settings: any) {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Solid Checker Config</title>
    </head>
    <body>
        <h1>Config Panel</h1>
        <ol>
            <li><label><input type="checkbox" id="sPrinciple" ${settings.checkForS ? 'checked' : ''}> S: Single Responsibility Principle</label></li>
            <li><label><input type="checkbox" id="oPrinciple" ${settings.checkForO ? 'checked' : ''}> O: Open-Closed Principle</label></li>
            <li><label><input type="checkbox" id="lPrinciple" ${settings.checkForL ? 'checked' : ''}> L: Liskov Substitution Principle</label></li>
            <li><label><input type="checkbox" id="iPrinciple" ${settings.checkForI ? 'checked' : ''}> I: Interface Segregation Principle</label></li>
            <li><label><input type="checkbox" id="dPrinciple" ${settings.checkForD ? 'checked' : ''}> D: Dependency Inversion Principle</label></li>
        </ol>
        <div>
            <label for="languageSelect">Select Language:</label>
            <select id="languageSelect">
                <option value="java" ${settings.projectType === "java" ? "selected" : ""}>Java</option>
                <option value="python" ${settings.projectType === "python" ? "selected" : ""}>Python</option>
                <option value="javascript" ${settings.projectType === "javascript" ? "selected" : ""}>JavaScript</option>
                <option value="c" ${settings.projectType === "c" ? "selected" : ""}>C</option>
                <option value="cpp" ${settings.projectType === "cpp" ? "selected" : ""}>C++</option>
                <option value="csharp" ${settings.projectType === "csharp" ? "selected" : ""}>C#</option>
            </select>
        </div>
        <button onclick="saveSettings()">Save Changes</button>
        <script>
            const vscode = acquireVsCodeApi();
            function saveSettings() {
                const settings = {
                    checkForS: document.getElementById('sPrinciple').checked,
                    checkForO: document.getElementById('oPrinciple').checked,
                    checkForL: document.getElementById('lPrinciple').checked,
                    checkForI: document.getElementById('iPrinciple').checked,
                    checkForD: document.getElementById('dPrinciple').checked,
                    projectType: document.getElementById('languageSelect').value
                };
                vscode.postMessage({ command: 'saveSettings', settings });
            }
        </script>
    </body>
    </html>
    `;
}

// Fetch all files in the workspace

async function updateConfigPanel(webviewPanel: vscode.WebviewPanel, context: vscode.ExtensionContext) {
	const workspaceFolder = vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders[0];
    if (workspaceFolder) {
		const settingsUri = vscode.Uri.joinPath(workspaceFolder.uri, '.solidchecker/settings.json');
        try {
			const settingsContent = await vscode.workspace.fs.readFile(settingsUri);
            const settingsJson = JSON.parse(settingsContent.toString());
            webviewPanel.webview.html = getConfigWebviewContent(settingsJson);
        } catch (error) {
			vscode.window.showErrorMessage('Failed to load settings: ' + error);
        }
    }
}

const fetchAllFiles = async (ignoreTemplateData:string): Promise<{ [fileName: string]: string }> => {
    const fileNamesAndContents: { [fileName: string]: string } = {};

    const files = await vscode.workspace.findFiles('**/*', transformIgnoreFile(ignoreTemplateData), 10000);

    await Promise.all(files.map(async (fileUri: vscode.Uri) => {
        const content = await vscode.workspace.fs.readFile(fileUri);
		const fileName = path.basename(fileUri.fsPath);

        fileNamesAndContents[fileName] = content.toString();
    }));

    return fileNamesAndContents;
};

function transformIgnoreFile(content: string): string {
	// Split the file content into lines
	const lines = content.split(/\r?\n/);  // Handle both Windows and Unix line endings
  
	// Filter out lines starting with a hashtag (#)
	const filteredLines = lines.filter(line => !line.startsWith('#'));
  
	vscode.window.showInformationMessage(`{${filteredLines.join(',')}}`);
	// Join the filtered lines with commas and enclose in curly brackets
	return `{${filteredLines.join(',')}}`;
    
  }

async function updateSettingsFile(directoryUri: vscode.Uri) {
	let settingsTemplateDataStr = '{';
	
	for (const key in settingsTemplateData) {
		if (typeof settingsTemplateData[key] === 'boolean' || typeof settingsTemplateData[key] === 'number') {
			settingsTemplateDataStr += `"${key}": ${settingsTemplateData[key]},`;
			continue;
		}

		settingsTemplateDataStr += `"${key}": "${settingsTemplateData[key]}",`;
	}

	settingsTemplateDataStr = settingsTemplateDataStr.slice(0, settingsTemplateDataStr.length - 1);
	settingsTemplateDataStr += '}'; 

	const settingsContent = new TextEncoder().encode(settingsTemplateDataStr);
	const newSettingsUri = vscode.Uri.joinPath(directoryUri, 'settings.json');
	vscode.workspace.fs.writeFile(newSettingsUri, settingsContent);
}

async function updateIgnoreFile(directoryUri: vscode.Uri) {
	const ignoreTemplateData = readFileSync(`${__dirname}/../src/ignore_templates/.${settingsTemplateData.projectType}ignoretemplate`, 'utf-8');
	
	const ignoreContent = new TextEncoder().encode(ignoreTemplateData);
	const newIgnoreUri = vscode.Uri.joinPath(directoryUri, '.scignore');
	vscode.workspace.fs.writeFile(newIgnoreUri, ignoreContent);
}

async function setIgnoreFile(settings: any, directoryUri: vscode.Uri) {
    const ignoreTemplateData = readFileSync(`${__dirname}/../src/ignore_templates/.${settings.projectType}ignoretemplate`, 'utf-8');
    const ignoreContent = new TextEncoder().encode(ignoreTemplateData);
	const newIgnoreUri = vscode.Uri.joinPath(directoryUri, '.scignore');
	vscode.workspace.fs.writeFile(newIgnoreUri, ignoreContent);

}