import * as vscode from 'vscode';

import path from "path";

export const fetchAllFiles = async (includeTemplateData:string, ignoreTemplateData:string): Promise<{ [fileName: string]: string }> => {
    const fileNamesAndContents: { [fileName: string]: string } = {};

    const files = await vscode.workspace.findFiles(transformFile(includeTemplateData), transformFile(ignoreTemplateData), 10000);

    await Promise.all(files.map(async (fileUri: vscode.Uri) => {
        const content = await vscode.workspace.fs.readFile(fileUri);
		const fileName = path.basename(fileUri.fsPath);

        fileNamesAndContents[fileName] = content.toString();
    }));

    return fileNamesAndContents;
};

function transformFile(content: string): string {
	const lines = content.split(/\r?\n/);
      
	const filteredLines = lines.filter(line => !line.startsWith('#') && line !== '' );
    
	return `{${filteredLines.join(',')}}`;    
}