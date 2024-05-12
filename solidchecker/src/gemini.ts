import { ChatSession, GoogleGenerativeAI, HarmCategory } from '@google/generative-ai';
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

        And when I tell you "ALL FILES SENT", then you can continue processing the data and send me this information in exactly this format,
        (FORMAT IS IMPORTANT):

        Do not take the things between curly braces literally.
        **1. General Summary**
        
        **2. Detailed Analysis**
            !!2.x {Principle name}!!
            
        **3. Code suggestions** (in this part actually write code)`;
    
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

    const subHeadPattern = /!!(.*?)!!/g;

    const bulletPointPattern = /\*(.*?)/g;

    const classPattern = /`(.*?)`/g;

    let parsedText = text.replace(boldPattern, '<h2>$1</h2>');

    parsedText = parsedText.replace(codePattern, '<div class="code-container"><pre>$1</pre></div>');

    parsedText = parsedText.replace(subHeadPattern, '<h3>$1</h3>');

    parsedText = parsedText.replace(bulletPointPattern, '');

    parsedText = parsedText.replace(classPattern, '<span class="method">$1</span>');
    

    return `<p>${parsedText}</p>`;
}