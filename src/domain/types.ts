// Contains shared domain types for collectors, formatters, and the CLI runner.

export type Language = 'tr' | 'en';

export type SectionKey =
  | 'exchangeRates'
  | 'stocks'
  | 'crypto'
  | 'fuelPrices'
  | 'tuikStats'
  | 'economicNews'
  | 'twitterTrends'
  | 'politics'
  | 'eksiSozluk'
  | 'earthquakes'
  | 'youtubeTrends'
  | 'weather'
  | 'magnificentSevenStocks';

export type ResultKey = SectionKey;

export type Collector<T> = {
  fetch: () => Promise<T>;
};

export type TranslationBundle = {
  appTitle: string;
  fetchingModule: string;
  moduleComplete: string;
  moduleFailed: string;
  remaining: string;
  errorOccurred: string;
  sections: Record<SectionKey, string>;
  noData: string;
  fuelNote: string;
  tuikCpi: string;
  tuikUnemployment: string;
  tuikCpiLabel: string;
  tuikUnemploymentLabel: string;
  tuikGdpLabel: string;
  tuikConsumerConfidenceLabel: string;
  months: Record<number, string>;
  generatedAt: string;
};

export type MarketQuote = {
  name: string;
  ticker?: string;
  last?: string;
  price?: string;
  changePercent?: string;
};

export type FuelPrice = {
  productName: string;
  amount: number;
};

export type TuikIndicator = {
  value: string | number;
  period: string;
};

export type TuikStats = {
  cpi?: TuikIndicator;
  unemployment?: TuikIndicator;
  gdp?: TuikIndicator;
  consumerConfidence?: TuikIndicator;
};

export type NewsItem = {
  title: string;
  url: string;
};

export type TrendTopic = {
  rank?: number;
  topic?: string;
  title?: string;
  tweets?: string;
  entries?: string;
  url?: string;
};

export type Earthquake = {
  magnitude: number;
  location: string;
  depth: string;
  time: string;
};

export type YoutubeVideo = {
  rank: number;
  title: string;
  views: string;
  channel: string;
  date: string;
  videoId: string;
};

export type WeatherForecast = {
  city: string;
  condition: string;
  range: string;
};

export type AgendaResultData = {
  exchangeRates: MarketQuote[] | null;
  stocks: MarketQuote[] | null;
  crypto: MarketQuote[] | null;
  fuelPrices: FuelPrice[] | null;
  tuikStats: TuikStats | null;
  economicNews: NewsItem[] | null;
  twitterTrends: TrendTopic[] | null;
  politics: NewsItem[] | null;
  eksiSozluk: TrendTopic[] | null;
  earthquakes: Earthquake[] | null;
  youtubeTrends: YoutubeVideo[] | null;
  weather: WeatherForecast[] | null;
  magnificentSevenStocks: MarketQuote[] | null;
  timestamp: string;
};

export type AgendaResultLike = AgendaResultData;
