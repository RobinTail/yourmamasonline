import Telegraf, {ContextMessageUpdate} from 'telegraf';
import {config} from './config';
import {describeNumber} from './lib/api';
import {parsePhoneNumber} from './lib/phone-number';
import createLogger from './logger';

const logger = createLogger();

async function listen(bot: Telegraf<ContextMessageUpdate>) {
  bot.start((ctx) => ctx.reply('Отправьте мне номер телефона без пробелов и дефисов.'));
  bot.on('text', async (ctx) => {
    const text = ctx.message && ctx.message.text ? ctx.message.text : '';
    const phoneNumber = parsePhoneNumber(text);
    if (!phoneNumber) {
      return await ctx.reply('Не нахожу номера телефона в вашем сообщении.');
    }
    await describeNumber(ctx, phoneNumber);
  });
  bot.on('message', async (ctx) => await ctx.reply('Напишите текстом, пожалуйста'));
  return bot;
}

async function start() {
  const bot = new Telegraf(config.token);
  const botInfo = await bot.telegram.getMe();
  logger.info('Bot information', botInfo);
  bot.startPolling();
  return await listen(bot);
}

start().catch(logger.error);
