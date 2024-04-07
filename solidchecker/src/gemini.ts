import { GoogleGenerativeAI } from '@google/generative-ai';
import { apiKey } from './apiKey';

const initialPrompt = `I want you to check the project I am about to send you to see whether it fits SOLID principles or not. 

Since the project is too big I am going to send it to you following this rule:

[START FILE {filename}]
{the file contents}
[END FILE {filename}]

Then you just answer and nothing else: Received file {filename}

And when I tell you "ALL FILES SENT", then you can continue processing the data and send me this information:

If there is a part violating the SOLID principles, in which file there is a violation? What is the line number in that file the violation occurs (THIS IS IMPORTANT), and then your suggestions for fixing it.`;

const genAI = new GoogleGenerativeAI(apiKey);

const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
const chat = model.startChat();

export async function sendInitialPrompt(): Promise<string> {
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
    const pattern = /\*\*(.*?)\*\*/g;

    const parsedText = text.replace(pattern, '<h1 style="color: #999999; text-align: center;>$1</h1>');

    return `<p style="color: #666666; text-align: justify;>${parsedText}</p>`;
}