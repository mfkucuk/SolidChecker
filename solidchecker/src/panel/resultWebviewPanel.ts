export function resultWebviewContent(answer: string) {
    return `
	<!DOCTYPE html>
    <html lang="en">
        <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Solid Checker</title>
        <style>
            body, h1, h2, p, .container {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }

            body {
                font-family: 'Arial', sans-serif;
                line-height: 1.6;
                color: #333;
                background-color: #f4f4f4;
                padding: 20px;
            }

            .container {
                max-width: 800px;
                margin: 0 auto;
                background: #fff;
                padding: 20px;
                box-shadow: 0 0 10px rgba(0,0,0,0.1);
                border-radius: 8px;
            }

            h1, h2 {
                color: #0056b3;
            }

            h1 {
                font-size: 24px;
                margin-bottom: 10px;
                
            }

            h2 {
                font-size: 20px;
                margin-bottom: 5px;
            }

            p {
                font-size: 16px;
                color: #666;
                margin-bottom: 20px; 
            }

            .title {
                text-align: center;
                font-size: 40px;
                color: #004085;
                margin: 20px 0;
            }

        </style>
        </head>
        <body>
            <h1 class="title">SolidChecker</h1>
            <div class="container">
                <h1>Result Panel</h1>
                <p>${answer}</p>
            </div>
        </body>
    </html>
    `;
}