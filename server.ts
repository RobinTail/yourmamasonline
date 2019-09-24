import * as cheerio from 'cheerio';
import MemoryCache = require('fast-memory-cache');
import fetch from 'node-fetch';
import Telegraf, {ContextMessageUpdate} from 'telegraf';
import {config} from './config';

const apiUrl = 'https://www.neberitrubku.ru/nomer-telefona';
const logger = console.log;
const cache = new MemoryCache();

interface NumberDescription {
  main: string[];
  topRates: string[];
  reviews: {
    author: string;
    message: string;
  }[];
}

async function getNumberDescription(phoneNumber: string): Promise<NumberDescription> {
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

async function describeNumber(ctx: ContextMessageUpdate, phoneNumber: string | null) {
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
  bot.hears(/(\+?7|8)(\d{10})/,
    async (ctx) => await describeNumber(ctx, ctx.match ? `8${ctx.match[2]}` : null));
  return bot;
}

async function start() {
  const bot = new Telegraf(config.token);
  const botInfo = await bot.telegram.getMe();
  logger(botInfo);
  bot.startPolling();
  return await listen(bot);
}

start().catch(logger);
