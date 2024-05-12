import * as vscode from 'vscode';
import { beautifyAnswer, sendEndPrompt, sendInitialPrompt, sendOneFilePrompt } from './gemini';

import * as path from 'path';
import { readFileSync } from 'fs';

// panels
import { welcomeWebviewPanel } from './panel/welcomeWebviewPanel';
import { resultWebviewPanel } from './panel/resultWebviewPanel';
import { configWebviewPanel } from './panel/configWebviewPanel';

const settingsTemplateData = require('./settings_template/settings_template.json');

export async function activate(context: vscode.ExtensionContext) {

	vscode.window.showInformationMessage('SolidChecker extention is active!');

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

			updateSettingsFile(scDirectoryUri);

			updateIgnoreFile(scDirectoryUri);

			updateIncludeFile(scDirectoryUri);
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



// Fetch all files in the workspace

async function updateConfigPanel(webviewPanel: vscode.WebviewPanel, context: vscode.ExtensionContext) {
	const workspaceFolder = vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders[0];
    if (workspaceFolder) {
		const settingsUri = vscode.Uri.joinPath(workspaceFolder.uri, '.solidchecker/settings.json');
        try {
			const settingsContent = await vscode.workspace.fs.readFile(settingsUri);
            const settingsJson = JSON.parse(settingsContent.toString());
            webviewPanel.webview.html = configWebviewPanel(settingsJson);
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