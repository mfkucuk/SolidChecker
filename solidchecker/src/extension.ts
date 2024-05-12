import * as vscode from 'vscode';
import { beautifyAnswer, sendEndPrompt, sendInitialPrompt, sendOneFilePrompt } from './gemini';

import * as path from 'path';
import { readFileSync } from 'fs';

const settingsTemplateData = require('./settings_template/settings_template.json');

export async function activate(context: vscode.ExtensionContext) {

	vscode.window.showInformationMessage('Congratulations, your extension "solidchecker" is now active!');

	const workspaceFolder = vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders[0];

	if (workspaceFolder) {
		const scDirectoryUri = vscode.Uri.joinPath(workspaceFolder.uri, '.solidchecker');
		
		let scFolderExists = false;
		const rootFolder = await vscode.workspace.fs.readDirectory(workspaceFolder.uri);
		for (const element in rootFolder) {
			if (rootFolder[element][0] === '.solidchecker') {
				scFolderExists = true;
				break;
			}
		} 

		if (! scFolderExists) {
			vscode.workspace.fs.createDirectory(scDirectoryUri);

			updateSettingsFile(scDirectoryUri);

			updateIgnoreFile(scDirectoryUri);

			updateIncludeFile(scDirectoryUri);
		}

	}
	else {
		vscode.window.showErrorMessage('No workspace is open!');
	}

	let runDisposable = vscode.commands.registerCommand('solidchecker.runSolidChecker', async () => {

		if(workspaceFolder) {
			const ignoreUri = vscode.Uri.joinPath(workspaceFolder.uri, '.solidchecker/.scignore');
			const includeUri = vscode.Uri.joinPath(workspaceFolder.uri, '.solidchecker/.scinclude')
			const ignoreTemplateData = await vscode.workspace.fs.readFile(ignoreUri);
			const includeTemplateData = await vscode.workspace.fs.readFile(includeUri);
			const files = await fetchAllFiles(includeTemplateData.toString(), ignoreTemplateData.toString());
                        
			await sendInitialPrompt();

			let fileCount = 0;
			await vscode.window.withProgress({
				location: vscode.ProgressLocation.Notification,
				cancellable: false,
				title: 'Running Solid Checker'
			}, async (progress) => {
				
				for ( const [fileName, filePath] of Object.entries(files) ) {
					await sleep(1000);
					await sendOneFilePrompt(fileName, filePath);
					
					fileCount++;
					progress.report({ increment: (1 / Object.entries(files).length) * 100, message: `Analyzing file ${fileCount} of ${Object.entries(files).length}` });
				}
			});

			
	
			const answer = await sendEndPrompt();
	
			const answerPanel = vscode.window.createWebviewPanel(
				'runSolidChecker',
				'Solid Checker',
				vscode.ViewColumn.One,
				{},
			);
			
			answerPanel.webview.html = getResultWebviewContent(beautifyAnswer(answer));
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
							
							const newSettingsUri = vscode.Uri.joinPath(workspaceFolder.uri, '.solidchecker/settings.json');
							const newSettingsContent = new TextEncoder().encode(JSON.stringify(message.settings, null, 4));
							vscode.workspace.fs.writeFile(newSettingsUri, newSettingsContent);
							vscode.window.showInformationMessage('Settings saved successfully!');
							const scDirectoryUri = vscode.Uri.joinPath(workspaceFolder.uri, '.solidchecker');
							updateConfigPanel(configPanel, context); 
							setIgnoreFile(message.settings, scDirectoryUri);
							setIncludeFile(message.settings, scDirectoryUri);

							
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
		<style>
			body {
				background: rgba(0, 0, 0, 0.6);
				font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
				display: flex;
				justify-content: center;
				align-items: center;
				height: 100vh;
				margin: 0;
			}
			.container {
				background-color: #222;
				padding: 40px;
				border-radius: 10px;
				box-shadow: 0 12px 24px rgba(0,0,0,0.3);
				width: 600px;
			}
			h1 {
				color: #eee;
				text-align: center;
				margin-bottom: 30px;
				font-size: 28px;
			}
			.option {
				background-color: #2b2b2b;
				border-radius: 8px;
				padding: 10px;
				margin-bottom: 12px;
				transition: background-color 0.3s, transform 0.2s;
			}
			.option:hover {
				background-color: #333; 
				
			}
			label {
				color: #ddd;
				font-size: 18px;
				display: block;
				margin-bottom: 8px;
			}
			.principle-letter {
				transition: all 0.3s ease;
				font-weight: normal;
				margin-right: 10px;
			}
			input[type="checkbox"] {
				accent-color: #4CAF50;
				width: 20px;
				height: 20px;
				border-radius: 5px;
				margin-right: 10px;
			}
			input[type="checkbox"]:checked + .principle-letter {
				font-weight: bold;
				color: #4CAF50;
				transform: scale(1.2);
			}
			select {
				width: 50%;
				padding: 10px;
				border-radius: 5px;
				background: #555;
				color: white;
				border: none;
				font-size: 16px;
				margin-top: 8px;
			}
			button {
				background-color: #007BFF;
				color: white;
				border: none;
				padding: 15px 30px;
				text-align: center;
				text-decoration: none;
				display: block;
				font-size: 18px;
				margin: 20px auto;
				cursor: pointer;
				border-radius: 8px;
				transition: background-color 0.3s, transform 0.2s;
			}
			button:hover {
				background-color: #0056b3;
				transform: scale(1.05);
			}
		</style>
	</head>
	<body>
		<div class="container">
			<h1>SolidChecker Options</h1>
			<div class="option"><label><input type="checkbox" id="sPrinciple" ${settings.checkForS ? 'checked' : ''}><span class="principle-letter">S: </span>Single Responsibility Principle</label></div>
			<div class="option"><label><input type="checkbox" id="oPrinciple" ${settings.checkForO ? 'checked' : ''}><span class="principle-letter">O: </span>Open-Closed Principle</label></div>
			<div class="option"><label><input type="checkbox" id="lPrinciple" ${settings.checkForL ? 'checked' : ''}><span class="principle-letter">L: </span>Liskov Substitution Principle</label></div>
			<div class="option"><label><input type="checkbox" id="iPrinciple" ${settings.checkForI ? 'checked' : ''}><span class="principle-letter">I: </span>Interface Segregation Principle</label></div>
			<div class="option"><label><input type="checkbox" id="dPrinciple" ${settings.checkForD ? 'checked' : ''}><span class="principle-letter">D: </span>Dependency Inversion Principle</label></div>
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
		</div>
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

const fetchAllFiles = async (includeTemplateData:string, ignoreTemplateData:string): Promise<{ [fileName: string]: string }> => {
    const fileNamesAndContents: { [fileName: string]: string } = {};

    const files = await vscode.workspace.findFiles(transformIgnoreFile(includeTemplateData), transformIgnoreFile(ignoreTemplateData), 10000);

    await Promise.all(files.map(async (fileUri: vscode.Uri) => {
        const content = await vscode.workspace.fs.readFile(fileUri);
		const fileName = path.basename(fileUri.fsPath);

        fileNamesAndContents[fileName] = content.toString();
    }));

    return fileNamesAndContents;
};

function transformIgnoreFile(content: string): string {
	const lines = content.split(/\r?\n/);
      
	const filteredLines = lines.filter(line => !line.startsWith('#') && line !== '' );
    
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

async function updateIncludeFile(directoryUri: vscode.Uri) {
	const includeTemplateData = readFileSync(`${__dirname}/../src/include_templates/.${settingsTemplateData.projectType}includetemplate`, 'utf-8');
	
	const includeContent = new TextEncoder().encode(includeTemplateData);
	const newIncludeUri = vscode.Uri.joinPath(directoryUri, '.scinclude');
	vscode.workspace.fs.writeFile(newIncludeUri, includeContent);
}

async function setIncludeFile(settings: any, directoryUri: vscode.Uri) {
    const includeTemplateData = readFileSync(`${__dirname}/../src/include_templates/.${settings.projectType}includetemplate`, 'utf-8');
    const includeContent = new TextEncoder().encode(includeTemplateData);
	const newIncludeUri = vscode.Uri.joinPath(directoryUri, '.scinclude');
	vscode.workspace.fs.writeFile(newIncludeUri, includeContent);

}



export const sleep = (delay: number) => new Promise((resolve) => setTimeout(resolve, delay));