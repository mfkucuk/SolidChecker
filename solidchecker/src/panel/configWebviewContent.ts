export function configWebviewContent(settings: any) {
    return `
	<!DOCTYPE html>
	<html>
	<head>
		<title>Solid Checker Options</title>
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
				width: 25%;
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