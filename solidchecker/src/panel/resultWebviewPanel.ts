export function resultWebviewPanel(answer: string) {
    return `
	<!DOCTYPE html>
	<html lang="en">
	<head>
		<meta charset="UTF-8">
		<meta name="viewport" content="width=device-width, initial-scale=1.0">
		<title>Solid Checker</title>
		<style>
			body {
				background: rgba(0, 0, 0, 0.6);
				font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
				display: flex;
				justify-content: center;
				overflow: auto
				height: 100vh;
				margin: 0;
				color: #fff;
			}
			.container {
				background-color: #222; 
				padding: 40px;
				border-radius: 12px;
				box-shadow: 0 12px 24px rgba(0,0,0,0.3);
				width: 70%;
				max-width: 800px;
				margin-top: 40px; 
			}
			.title {
				font-size: 28px;
				color: #4CAF50; 
				text-align: center;
				margin-bottom: 20px; 
			}
			h2 {
				color: #4CAF50; 
				text-align: left; 
				font-size: 22px; 
			}
			p {
				color: #ccc; 
				font-size: 16px;
				line-height: 1.6;
			}
			.code-container {
				background-color: #1e1e1e; 
				padding: 15px;
				border-radius: 5px;
				margin: 20px 0;
				overflow-x: auto;
			}
			pre {
				margin: 0;
				font-family: 'Courier New', Courier, monospace;
				color: #9CFA54;
			}
		</style>
	</head>
	<body>
		<div class="container">
			<h1 class="title">SolidChecker Results</h1>
			<div class="result-panel">
				<p>${answer}</p>
			</div>
		</div>
	</body>
	</html>
    `;
}