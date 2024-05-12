export function welcomeWebviewPanel() {
    return `
    <!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to Solid Checker</title>
    <style>
        body, h1, h2, p, .container {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Arial', sans-serif;
            line-height: 1.6;
            color: #fff;
            background-color: rgba(0, 0, 0, 0.6);
            padding: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
        }

        .container {
            max-width: 800px;
            background: #333;
            padding: 20px;
            box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
            border-radius: 8px;
        }

        h1, h2 {
            color: #4CAF50;
        }

        h1 {
            font-size: 28px;
            margin-bottom: 20px;
            text-align: center;
        }

        h2 {
            font-size: 22px;
            margin-top: 20px;
            margin-bottom: 10px;
            color: #FFD700;
        }

        p {
            font-size: 16px;
            color: #bbb;
            margin-bottom: 15px;
        }

        .links, .solid-principles, .repo-link {
            background: #444;
            padding: 15px;
            border-radius: 5px;
            margin-top: 20px;
        }

        a {
            color: #4CAF50;
            text-decoration: none;
            margin-right: 10px;
            transition: transform 0.3s ease, color 0.3s ease;
            display: inline-block;
            padding: 10px 15px;
            border-radius: 4px;
        }

        a:hover {
            transform: scale(1.1);
            color: #FFD700;
            background-color: #282828;
        }

        ul {
            padding-left: 20px;
        }

        li {
            margin-bottom: 10px;
        }

        strong {
            color: #FFD700;
        }

        .repo-link {
            display: flex;
            align-items: center;
            justify-content: center;
           
        }

        .repo-link a {
            width: 30%;
            text-align: center;
           
        }

        .repo-link a:hover {
           
            color: #FFD700;
        
        }
        
        

    </style>
    </head>
    <body>
        <div class="container">
            <h1>Welcome to SolidChecker</h1>
            <p>SolidChecker is a powerful tool designed to help you evaluate the quality of your code based on the SOLID principles - five principles of object-oriented programming intended to make software designs more understandable, flexible, and maintainable.</p>
            <div class="links">
                <p>Learn more about SOLID principles:</p>
                <a href="https://en.wikipedia.org/wiki/SOLID" target="_blank">Wikipedia</a>
                <a href="https://www.baeldung.com/solid-principles" target="_blank">Baeldung</a>
                <a href="https://www.geeksforgeeks.org/ood-principles-solid/" target="_blank">GeeksforGeeks</a>
            </div>
            <div class="solid-principles">
                <h2>SOLID Principles:</h2>
                <ul>
                    <li><strong>S - Single Responsibility Principle (SRP):</strong> A class should have only one reason to change.</li>
                    <li><strong>O - Open/Closed Principle (OCP):</strong> Software entities (classes, modules, functions, etc.) should be open for extension but closed for modification.</li>
                    <li><strong>L - Liskov Substitution Principle (LSP):</strong> Objects of a superclass should be replaceable with objects of its subclasses without affecting the correctness of the program.</li>
                    <li><strong>I - Interface Segregation Principle (ISP):</strong> Clients should not be forced to depend on interfaces they do not use.</li>
                    <li><strong>D - Dependency Inversion Principle (DIP):</strong> High-level modules should not depend on low-level modules. Both should depend on abstractions. Abstractions should not depend on details. Details should depend on abstractions.</li>
                </ul>
            </div>
            <div class="repo-link">
                <a href="https://github.com/mfkucuk/SolidChecker" target="_blank">Visit the GitHub Repo</a>
            </div>
        </div>
    </body>
</html>

    `;
}