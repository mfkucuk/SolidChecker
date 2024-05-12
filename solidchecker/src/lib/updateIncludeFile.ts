import * as vscode from 'vscode';

import { readFileSync } from "fs";

export async function updateIncludeFile(settings: any, directoryUri: vscode.Uri) {
    const includeTemplateData = readFileSync(`${__dirname}/../src/include_templates/.${settings.projectType}includetemplate`, 'utf-8');
    const includeContent = new TextEncoder().encode(includeTemplateData);
	const newIncludeUri = vscode.Uri.joinPath(directoryUri, '.scinclude');
	vscode.workspace.fs.writeFile(newIncludeUri, includeContent);

}