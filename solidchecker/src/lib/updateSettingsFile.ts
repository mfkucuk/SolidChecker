import * as vscode from 'vscode';

export async function updateSettingsFile(settings: any, directoryUri: vscode.Uri) {
	let settingsTemplateDataStr = '{';
	
	for (const key in settings) {
		if (typeof settings[key] === 'boolean' || typeof settings[key] === 'number') {
			settingsTemplateDataStr += `"${key}": ${settings[key]},`;
			continue;
		}

		settingsTemplateDataStr += `"${key}": "${settings[key]}",`;
	}

	settingsTemplateDataStr = settingsTemplateDataStr.slice(0, settingsTemplateDataStr.length - 1);
	settingsTemplateDataStr += '}'; 

	const settingsContent = new TextEncoder().encode(settingsTemplateDataStr);
	const newSettingsUri = vscode.Uri.joinPath(directoryUri, 'settings.json');
	vscode.workspace.fs.writeFile(newSettingsUri, settingsContent);
}