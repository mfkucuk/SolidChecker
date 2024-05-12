import * as vscode from 'vscode';

import { readFileSync } from 'fs';

export async function updateIgnoreFile(settings: any, directoryUri: vscode.Uri) {
    const ignoreTemplateData = readFileSync(`${__dirname}/../src/ignore_templates/.${settings.projectType}ignoretemplate`, 'utf-8');
    const ignoreContent = new TextEncoder().encode(ignoreTemplateData);
	const newIgnoreUri = vscode.Uri.joinPath(directoryUri, '.scignore');
	vscode.workspace.fs.writeFile(newIgnoreUri, ignoreContent);

}