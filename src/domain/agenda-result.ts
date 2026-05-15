// Defines the normalized agenda snapshot returned by all collectors.

import type { AgendaResultData, AgendaResultLike } from './types.js';

/** Represents a complete agenda snapshot with nullable sections. */
export class AgendaResult implements AgendaResultLike {
  exchangeRates;
  stocks;
  crypto;
  fuelPrices;
  tuikStats;
  economicNews;
  twitterTrends;
  politics;
  eksiSozluk;
  earthquakes;
  youtubeTrends;
  weather;
  magnificentSevenStocks;
  timestamp;

  /** Creates a normalized agenda result from partial collector output. */
  constructor(data: Partial<AgendaResultData> = {}) {
    this.exchangeRates = data.exchangeRates ?? null;
    this.stocks = data.stocks ?? null;
    this.crypto = data.crypto ?? null;
    this.fuelPrices = data.fuelPrices ?? null;
    this.tuikStats = data.tuikStats ?? null;
    this.economicNews = data.economicNews ?? null;
    this.twitterTrends = data.twitterTrends ?? null;
    this.politics = data.politics ?? null;
    this.eksiSozluk = data.eksiSozluk ?? null;
    this.earthquakes = data.earthquakes ?? null;
    this.youtubeTrends = data.youtubeTrends ?? null;
    this.weather = data.weather ?? null;
    this.magnificentSevenStocks = data.magnificentSevenStocks ?? null;
    this.timestamp = data.timestamp ?? new Date().toISOString();
  }

  /** Serializes the agenda result into a plain JSON-safe object. */
  toJSON(): AgendaResultData {
    return {
      exchangeRates: this.exchangeRates,
      stocks: this.stocks,
      crypto: this.crypto,
      fuelPrices: this.fuelPrices,
      tuikStats: this.tuikStats,
      economicNews: this.economicNews,
      twitterTrends: this.twitterTrends,
      politics: this.politics,
      eksiSozluk: this.eksiSozluk,
      earthquakes: this.earthquakes,
      youtubeTrends: this.youtubeTrends,
      weather: this.weather,
      magnificentSevenStocks: this.magnificentSevenStocks,
      timestamp: this.timestamp,
    };
  }

  /** Recreates an agenda result from a JSON-safe object. */
  static fromJSON(json: Partial<AgendaResultData>): AgendaResult {
    return new AgendaResult(json);
  }
}
