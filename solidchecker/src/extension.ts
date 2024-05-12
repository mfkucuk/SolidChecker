import * as vscode from 'vscode';
import { beautifyAnswer, sendEndPrompt, sendInitialPrompt, sendOneFilePrompt } from './gemini';

// panels
import { welcomeWebviewPanel } from './panel/welcomeWebviewPanel';
import { resultWebviewPanel } from './panel/resultWebviewPanel';
import { configWebviewPanel, updateConfigPanel } from './panel/configWebviewPanel';

// lib
import { updateIncludeFile } from './lib/updateIncludeFile';
import { updateIgnoreFile } from './lib/updateIgnoreFile';
import { updateSettingsFile } from './lib/updateSettingsFile';
import { fetchAllFiles } from './lib/fileManipulation';
import { sleep } from './lib/sleep';

const settingsTemplateData = require('./settings_template/settings_template.json');

export async function activate(context: vscode.ExtensionContext) {

	vscode.window.showInformationMessage('SolidChecker extension is active!');

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

		if (!scFolderExists) {
			vscode.workspace.fs.createDirectory(scDirectoryUri);

			updateSettingsFile(settingsTemplateData, scDirectoryUri);

			updateIgnoreFile(settingsTemplateData, scDirectoryUri);

			updateIncludeFile(settingsTemplateData, scDirectoryUri);
		}

		const welcomePage = vscode.window.createWebviewPanel(
			'welcomeSolidChecker',
			'Welcome To SolidChecker',
			vscode.ViewColumn.One,
			{},
		);

		welcomePage.webview.html = welcomeWebviewPanel();
	}
	else {
		vscode.window.showErrorMessage('No workspace is open!');
	}

	let runDisposable = vscode.commands.registerCommand('solidchecker.runSolidChecker', async () => {

		if (workspaceFolder) {
			const ignoreUri = vscode.Uri.joinPath(workspaceFolder.uri, '.solidchecker/.scignore');
			const includeUri = vscode.Uri.joinPath(workspaceFolder.uri, '.solidchecker/.scinclude');
			const ignoreTemplateData = await vscode.workspace.fs.readFile(ignoreUri);
			const includeTemplateData = await vscode.workspace.fs.readFile(includeUri);
			const files = await fetchAllFiles(includeTemplateData.toString(), ignoreTemplateData.toString());
			
			if (Object.entries(files).length === 0) {
				vscode.window.showWarningMessage(`No files were supplied for the specified language`);
				return;
			}

			const settingsUri = vscode.Uri.joinPath(workspaceFolder.uri, '.solidchecker/settings.json');
			const settingsContent = await vscode.workspace.fs.readFile(settingsUri);
            const settingsJson = JSON.parse(settingsContent.toString());

			await sendInitialPrompt(settingsJson);

			let fileCount = 0;
			await vscode.window.withProgress({
				location: vscode.ProgressLocation.Notification,
				cancellable: false,
				title: 'Running Solid Checker'
			}, async (progress) => {
				
				for ( const [fileName, filePath] of Object.entries(files) ) {
					await sleep(1500);
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
			
			answerPanel.webview.html = resultWebviewPanel(beautifyAnswer(answer));
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
			configPanel.webview.html = configWebviewPanel(parsedJson);
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
							updateIgnoreFile(message.settings, scDirectoryUri);
							updateIncludeFile(message.settings, scDirectoryUri);

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