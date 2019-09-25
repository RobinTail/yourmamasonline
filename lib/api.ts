import * as cheerio from 'cheerio';
import MemoryCache = require('fast-memory-cache');
import fetch from 'node-fetch';
import {ContextMessageUpdate} from 'telegraf';
import {config} from '../config';
import {PhoneNumber} from './phone-number';

const apiUrl = 'https://www.neberitrubku.ru/nomer-telefona';

const cache = new MemoryCache();

interface NumberDescription {
  main: string[];
  topRates: string[];
  reviews: {
    author: string;
    message: string;
  }[];
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

export async function describeNumber(ctx: ContextMessageUpdate, phoneNumber: PhoneNumber) {
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
