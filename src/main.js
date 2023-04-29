import { Telegraf, session } from "telegraf";
import config from "config";
import { message } from "telegraf/filters";
import { ogg } from './ogg.js'
import { openai } from './openai.js'

const INITIAL_SESSION = {
    message: [],
}


const bot = new Telegraf(config.get('TELEGRAM_TOKEN'))

bot.use(session())

bot.command('new', async (ctx) => {
    ctx.session = INITIAL_SESSION
    await ctx.reply("Жду твое голосовое или текстовое сообщение")
})
bot.command('start', async (ctx) => {
    ctx.session = INITIAL_SESSION
    await ctx.reply("Жду твое голосовое или текстовое сообщение")
})

bot.on(message('voice'), async (ctx) => {
    ctx.session ??= INITIAL_SESSION
    try {
        await ctx.reply(`Одну минутку, посмотрим что можно найти...`)
        const link = await ctx.telegram.getFileLink(ctx.message.voice.file_id)
        const userId = String(ctx.message.from.id)
        const oggPath = await ogg.create(link.href, userId)
        const mp3Path = await ogg.toMp3(oggPath, userId)

        const text = await openai.transcription(mp3Path)
        await ctx.reply(`Ваш запрос: ${text}`)

        ctx.session.message.push({
            role: openai.roles.USER,
            content: text
        })

        const response = await openai.chat(ctx.session.message)

        ctx.session.message.push({
            role: openai.roles.ASSISTANT,
            content: response.content
        })

        await ctx.reply(response.content)
    } catch (error) {
        console.log(`Error in bot.on message VOISE ${error}`);
    }
})
bot.on(message('text'), async (ctx) => {
    ctx.session ??= INITIAL_SESSION
    try {
        await ctx.reply(`Одну минутку, посмотрим что можно найти...`)

        ctx.session.message.push({
            role: openai.roles.USER,
            content: ctx.message.text
        })
        const response = await openai.chat(ctx.session.message)

        ctx.session.message.push({
            role: openai.roles.ASSISTANT,
            content: response.content
        })
        console.log(ctx.session.message);
        await ctx.reply(response.content)
    } catch (error) {
        console.log(`Error in bot.on message TEXT ${error}`);
    }
})



bot.launch()

process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))
