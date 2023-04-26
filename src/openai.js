// import { Configuration, OpenAIApi } from "openai"
// import config from "config"
// import { createReadStream } from 'fs'

// class OpenAi {
//     roles = {
//         ASSISTANT: 'assistant',
//         USER: "user",
//         SYSTEM: 'system'
//     }
//     constructor(apiKey) {
//         const configuration = new Configuration({
//             apiKey
//         })
//         this.openai = new OpenAIApi(configuration)
//     }

//     async chat(messages) {
//         try {
//             const response = await this.openai.createChatCompletion({
//                 model: 'gpt-3.5-turbo',
//                 messages,
//             })
//             return response.data.choices[0].message
//         } catch (error) {
//             console.log(`Error in openai.js  chat()  ${error.message}`);
//         }
//     }

// async transcription(filePath) {
//     try {

//         const response = await this.openai.createTranscription(
//             createReadStream(filePath),
//             'whisper-1'
//         )
//         return response.data.text
//     } catch (error) {
//         console.log(`Error in openai.js transcription() ${error.message}`);
//     }
// }
// }

// export const openai = new OpenAi(config.get('OPENAI_KEY'))

import { Configuration, OpenAIApi } from "openai";
import config from "config";
import { createReadStream } from "fs";

class OpenAi {
    roles = {
        ASSISTANT: "assistant",
        USER: "user",
        SYSTEM: "system",
    };

    constructor(apiKey) {
        const configuration = new Configuration({
            apiKey,
        });
        this.openai = new OpenAIApi(configuration);
    }

    async chat(messages, maxRetries = 3, delay = 500) {
        let lastError;

        for (let i = 0; i < maxRetries; i++) {
            try {
                const response = await this.openai.createChatCompletion({
                    model: "gpt-3.5-turbo",
                    messages,
                });
                return response.data.choices[0].message;
            } catch (error) {
                lastError = error;
                if (error.status && error.status === 400) {
                    console.log(
                        `Retry attempt ${i + 1} failed with status code 400. Retrying after ${delay}ms...`
                    );
                    await new Promise((resolve) => setTimeout(resolve, delay));
                    delay *= 2; // Exponential backoff
                } else {
                    console.log(`Error in openai.js chat(): ${error.message}`);
                    break;
                }
            }
        }

        // If all retries fail, throw an error
        throw new Error(`Max retries reached. chat() failed: ${lastError.message}`);
    }

    async transcription(filePath) {
        try {

            const response = await this.openai.createTranscription(
                createReadStream(filePath),
                'whisper-1'
            )
            return response.data.text
        } catch (error) {
            console.log(`Error in openai.js transcription() ${error.message}`);
        }
    }
}

export const openai = new OpenAi(config.get("OPENAI_KEY"));