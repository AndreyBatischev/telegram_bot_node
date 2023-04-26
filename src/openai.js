import { Configuration, OpenAIApi } from "openai"
import config from "config"
import { createReadStream } from 'fs'

class OpenAi {
    roles = {
        ASSISTANT: 'assistent',
        USER: "user",
        SYSTEM: 'system'
    }
    constructor(apiKey) {
        const configuratio = new Configuration({
            apiKey
        })
        this.openai = new OpenAIApi(configuratio)
    }

    async chat(messages) {
        try {
            const response = await this.openai.createChatCompletion({
                model: 'gpt-3.5-turbo',
                messages,
            })
            return response.data.choices[0].message
        } catch (error) {
            console.log(`Error in openai.js  chat()  ${error.message}`);
        }
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

export const openai = new OpenAi(config.get('OPENAI_KEY'))