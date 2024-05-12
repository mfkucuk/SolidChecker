import { ChatSession, GoogleGenerativeAI } from '@google/generative-ai';
import { apiKey } from './apiKey';

const genAI = new GoogleGenerativeAI(apiKey);

const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
let chat: ChatSession;

export async function sendInitialPrompt(settings: any): Promise<string> {

    const initialPrompt = `I want you to check the ${settings.projectType} project I am about to send you to see whether it fits these SOLID principles or not:
    
    ${settings.checkForS ? 'Single Responsibility Principle (SRP)' : ''}
    ${settings.checkForO ? 'Open/Closed Principle (OCP)' : ''}
    ${settings.checkForL ? 'Liskov Substitution Principle (LSP)' : ''}
    ${settings.checkForI ? 'Interface Segregation Principle (ISP)' : ''}
    ${settings.checkForD ? 'Dependency Inversion Principle (DIP)' : ''}

    Since the project is too big I am going to send it to you following this rule:

    [START FILE {filename}]
    {the file contents}
    [END FILE {filename}]

    Then you just answer and nothing else: Received file {filename}

    And when I tell you "ALL FILES SENT", then you can continue processing the data and send me this information:

    If there is a part violating the SOLID principles, in which file there is a violation? What is the line number in that file the violation occurs (THIS IS IMPORTANT), and then your suggestions for fixing it.`;
    
    chat = model.startChat();
    
    const result = await chat.sendMessage(initialPrompt); 
    
    return result.response.text();
}

export async function sendOneFilePrompt(fileName: string, fileContents: string): Promise<string> {
    const prompt = `[START FILE ${fileName}]\n${fileContents}\n[END FILE ${fileName}]`;

    const result = await chat.sendMessage(prompt);

    return result.response.text();
}

export async function sendEndPrompt() {
    const result = await chat.sendMessage('ALL FILES SENT');

    return result.response.text();
}

export function beautifyAnswer(text: string): string {

    const boldPattern = /\*\*(.*?)\*\*/g;

    const codePattern = /```(.*?)```/gs;

    let parsedText = text.replace(boldPattern, '<h2>$1</h2>');

    parsedText = parsedText.replace(codePattern, '<div class="code-container"><pre>$1</pre></div>');

    return `<p>${parsedText}</p>`;
}