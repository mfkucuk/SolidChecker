import * as vscode from 'vscode';
import { beautifyAnswer, sendEndPrompt, sendInitialPrompt, sendOneFilePrompt } from './gemini';

import * as path from 'path';

export function activate(context: vscode.ExtensionContext) {

	vscode.window.showInformationMessage('Congratulations, your extension "solidchecker" is now active!');

	const workspaceFolder = vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders[0];

	if (workspaceFolder) {
		const newDirectoryUri = vscode.Uri.joinPath(workspaceFolder.uri, '.solidchecker');
		vscode.workspace.fs.createDirectory(newDirectoryUri);

		//const settingsContent = new TextEncoder().
		const newSettingsUri = vscode.Uri.joinPath(newDirectoryUri, 'settings.json');
		vscode.workspace.fs.writeFile(newSettingsUri, new Uint8Array(0));
		
		const newIgnoreUri = vscode.Uri.joinPath(newDirectoryUri, '.scignore');
		vscode.workspace.fs.writeFile(newIgnoreUri, new Uint8Array(0));
	}
	else {
		vscode.window.showErrorMessage('No workspace is open!');
	}



	let runDisposable = vscode.commands.registerCommand('solidchecker.runSolidChecker', async () => {

		const files = await fetchAllFiles();

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
	});

	let configDisposable = vscode.commands.registerCommand('solidchecker.configSolidChecker', async () => {
		
		const configPanel = vscode.window.createWebviewPanel(
			'configSolidChecker',
			'Solid Checker Config',
			vscode.ViewColumn.One,
			{},
		);

		configPanel.webview.html = getConfigWebviewContent();
	});

	context.subscriptions.push(runDisposable);
	context.subscriptions.push(configDisposable);
}

export function deactivate() {}

function getResultWebviewContent(answer: string) {
	return `<!DOCTYPE html>
	<html lang="en">
	<head>
		<meta charset="UTF-8">
		<meta name="viewport" content="width=device-width, initial-scale=1.0">
		<title>Solid Checker</title>
		<style>
			body {
				font-family: Arial, sans-serif;
				padding: 20px;
			}
			
			.container {
				max-width: 600px;
				margin: 0 auto;
			}
			
			h1 {
				color: #AAAAAA;
				text-align: center;
			}
			
			p {
				text-align: justify;
			}		
		</style>
	</head>
	<body style="font-family: Arial, sans-serif; padding: 20px;">
		<div className='container' style="max-width: 600px; margin: 0 auto;">
			<h1>Fuck Panel</h1>
			${answer}
		</div>
	</body>
	</html>
	`;
}

function getConfigWebviewContent() {
	return `<!DOCTYPE html>
	<html>
	<head>
		<title>Solid Checker Config</title>
		<style>
			body {
				font-family: Arial, sans-serif;
			}

			h1 {
				text-align: center;
			}

			ol {
				width: max-content;
				list-style: none; /* Remove default list styles */
				padding-left: 0; /* Remove default padding */
			}

			li {
				text-align: justify;
				margin-bottom: 10px; /* Add some spacing between list items */
			}

			label {
				display: inline-flex; /* Align checkboxes horizontally */
				align-items: center; /* Center items vertically */
			}

			input[type="checkbox"] {
				margin-right: 5px; /* Add spacing between checkbox and label text */
			}
	
			#dropArea {
				border: 2px dashed #ccc;
				border-radius: 5px;
				padding: 20px;
				text-align: center;
				margin: 20px auto;
				width: 300px;
				height: 200px;
			}
	
			#dropArea.highlight {
				border-color: #66ccff;
			}
	
			#fileInput {
				display: none;
			}
	
			/* Style for file input label */
			label {
				cursor: pointer;
				background-color: #007bff;
				color: #fff;
				padding: 10px 20px;
				border-radius: 5px;
			}
		</style>
	</head>
	<body>
		<h1>FUCK Panel</h1>

		<ol>
			<li><label><input type="checkbox"> S: Single Responsibility Principle</label></li>
			<li><label><input type="checkbox"> O: Open-Closed Principle</label></li>
			<li><label><input type="checkbox"> L: Liskov Substitution Principle</label></li>
			<li><label><input type="checkbox"> I: Interface Segregation Principle</label></li>
			<li><label><input type="checkbox"> D: Dependency Inversion Principle</label></li>
		</ol>

		<div id="dropArea">
			<label for="fileInput">Drag & Drop files here or Browse</label>
			<input type="file" id="fileInput" multiple">
		</div>
	</body>
	</html>
	`;
}

// Fetch all files in the workspace
const fetchAllFiles = async (): Promise<{ [fileName: string]: string }> => {
    const fileNamesAndContents: { [fileName: string]: string } = {};

    const files = await vscode.workspace.findFiles('**/*', '**/node_modules/**', 10000);

    await Promise.all(files.map(async (fileUri: vscode.Uri) => {
        const content = await vscode.workspace.fs.readFile(fileUri);
		const fileName = path.basename(fileUri.fsPath);

        fileNamesAndContents[fileName] = content.toString();
    }));

    return fileNamesAndContents;
};