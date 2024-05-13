# SolidChecker
A VSCode extention that enables you to write code by obeying SOLID principles.

## How to run
To run the extension, follow these steps:
* Clone the repo, open it with **VSCode**
* Navigate to the `SolidChecker/solidchecker` folder,
* Run `npm install` to install the dependencies,
* In the src directory create a file named `apiKey.ts` and add your Gemini API key as follows:
```typescript
export const apiKey = '<YOUR_GEMINI_API_KEY>';
```
* Then, navigate to `src/extension.ts` and hit **F5**.
* You will be opening a Debug VSCode with our extension being activated.

## How to use
There are two main commands use can run using the Command Palette (<kbd>control</kbd> + <kbd>shift</kbd> + <kbd>p</kbd>):
* **Solid Checker: Run** (<kbd>control</kbd> + <kbd>alt</kbd> + <kbd>r</kbd>) and,
* **Solid Checker: Config** (<kbd>control</kbd> + <kbd>alt</kbd> + <kbd>c</kbd>)

Also, you can run config command by clicking on the **wrench icon** and run command by clicking on the **robot icon**.

### Config: SolidChecker command
This command will open the following panel:
![alt text](config.png)

This is the configuration panel for SolidChecker. Here, the user can change how the extension behaves. The two options are changing which of the SOLID principles the project will be analyzed for and which language the extension will be run for.

### Run: SolidChecker command
This command will start the analysis and when the analysis is done, this screen will pop-up:
![alt text](result1.png)
![alt text](result2.png)
![alt text](result3.png)
