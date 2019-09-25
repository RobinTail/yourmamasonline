import * as cheerio from 'cheerio';
import MemoryCache = require('fast-memory-cache');
import fetch from 'node-fetch';
import Telegraf, {ContextMessageUpdate} from 'telegraf';
import {config} from './config';
import createLogger from './logger';

const apiUrl = 'https://www.neberitrubku.ru/nomer-telefona';
const logger = createLogger();
const cache = new MemoryCache();

interface NumberDescription {
  main: string[];
  topRates: string[];
  reviews: {
    author: string;
    message: string;
  }[];
}

type PhoneNumber = string[11];

function isPhoneNumber(value: any): value is PhoneNumber {
  return typeof value === 'string' && value.length === 11 && value[0] === '8';
}

function ensurePhoneNumber(value: any): PhoneNumber | null {
  return isPhoneNumber(value) ? value : null;
}

function parsePhoneNumber(text: string): PhoneNumber | null {
  let regex;
  regex = text.match(/(\+?7|8)(\d{10})/);
  if (regex) {
    return ensurePhoneNumber(`8${regex[2]}`);
  }
  regex = text.match(/(\+?7|8)([\d\s\-\(\)\.]+)/);
  if (regex) {
    return ensurePhoneNumber(`8${regex[2].replace(/[^\d]/g, '')}`);
  }
  return null;
}

async function getNumberDescription(phoneNumber: PhoneNumber): Promise<NumberDescription> {
  const cachedData: NumberDescription | undefined = cache.get(phoneNumber);
  if (cachedData) {
    return cachedData;
  }
  const rawData = await (await fetch(`${apiUrl}/${phoneNumber}`)).text();
  const $ = cheerio.load(rawData);
  const main = $('#pageContent .mainInfo .number').text().split(/[\n\r]/)
    .map((text) => text.replace(/\s+/g, ' ').trim())
    .filter((text) => text);
  const topRates = $('#pageContent .mainInfo .description')
    .find('.ratings, .categories')
    .find('ul > .active').toArray()
    .map((element) => $(element).text().trim())
    .filter((text) => text);
  const reviews = $('#pageContent .reviews .review').slice(1, config.numberOfReviews + 1).toArray()
    .map((element) => ({
      author: $(element).find('.reviewer span').eq(1).text().trim() || 'Аноним',
      message: $(element).find('.review_comment').text().trim()
    }))
    .filter((rates) => rates.message);
  const numberInformation = {main, topRates, reviews};
  cache.set(phoneNumber, numberInformation, config.cacheExpirationSeconds);
  return numberInformation;
}

async function describeNumber(ctx: ContextMessageUpdate, phoneNumber: PhoneNumber | null) {
  if (phoneNumber) {
    const numberDescription = await getNumberDescription(phoneNumber);
    await ctx.reply(
      `${numberDescription.main.join('\n')}\n\n` +
      (numberDescription.topRates.length ? `Оценка:\n${numberDescription.topRates.join('\n')}\n\n` : '') +
      (
        numberDescription.reviews.length ? (
          `Отзывы:\n` +
          numberDescription.reviews.map((review) => `${review.author}: ${review.message}`).join('\n')
        ) : ''
      )
    );
  }
}

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
