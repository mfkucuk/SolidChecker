// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { beautifyAnswer, sendEndPrompt, sendInitialPrompt, sendOneFilePrompt } from './gemini';

import * as path from 'path';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "solidchecker" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let runDisposable = vscode.commands.registerCommand('solidchecker.runSolidChecker', async () => {
		// The code you place here will be executed every time your command is executed

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

// This method is called when your extension is deactivated
export function deactivate() {}

function getResultWebviewContent(answer: string) {
	return `<!DOCTYPE html>
  <html lang="en">
  <head>
	  <meta charset="UTF-8">
	  <meta name="viewport" content="width=device-width, initial-scale=1.0">
	  <title>Solid Checker</title>
  </head>
  <body>
	  ${answer}
  </body>
  </html>`;
}

function getConfigWebviewContent() {
	return `<!DOCTYPE html>
	<html>
		<head>
			<title>Solid Checker Config</title>
		</head>
		<body>
			<h1>Config Panel</h1>
		</body>
	</html>`;
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

