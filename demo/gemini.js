import 'dotenv/config';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({
    vertexai: true,
    project: process.env.PROJECT_ID,
    location: process.env.REGION,
});

const chat = ai.chats.create({model: process.env.MODEL_NAME});
const response = await chat.sendMessage({
  message: 'Hola'
});
console.log(response.text);