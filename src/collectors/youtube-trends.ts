// Collects trending YouTube videos for Turkiye from yttrendz.com.

import * as cheerio from 'cheerio';
import type { AnyNode } from 'domhandler';
import type { YoutubeVideo } from '../domain/types.js';
import httpClient from '../services/http-client.js';

/** Fetches YouTube trend videos for Turkiye. */
export async function fetch(): Promise<YoutubeVideo[]> {
  const response = await httpClient.get<string>('https://yttrendz.com/youtube-trends/turkey');
  const $ = cheerio.load(response.data);
  const videos: YoutubeVideo[] = [];

  $('.feed-box-wp .feed-box').each((_, box) => {
    if (videos.length >= 5) {
      return;
    }

    const parsedVideo = parseVideoBox($, $(box), videos.length + 1);

    if (parsedVideo) {
      videos.push(parsedVideo);
    }
  });

  if (videos.length === 0) {
    throw new Error('No YouTube trends found');
  }

  return videos;
}

/** Parses a yttrendz video card into a normalized video record. */
function parseVideoBox($: cheerio.CheerioAPI, box: cheerio.Cheerio<AnyNode>, fallbackRank: number): YoutubeVideo | null {
  const rank = box.find('.feed-count span').text().trim();
  const titleElement = box.find('.feed-title a').first();
  const title = titleElement.attr('title') || titleElement.text().trim();

  if (!title) {
    return null;
  }

  return {
    rank: Number.parseInt(rank, 10) || fallbackRank,
    title,
    views: box.find('.feed-view-figure').first().text().trim() || '-',
    channel: box.find('.feed-author').first().text().replace('Upload by :', '').replace('Upload by:', '').trim() || '-',
    date: box.find('.feed-date').first().text().replace('on ', '').trim() || '-',
    videoId: titleElement.attr('data-videoid') || '',
  };
}
