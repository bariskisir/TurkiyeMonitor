// Collects selected macroeconomic indicators from the TUIK data portal.

import type { TuikStats } from '../domain/types.js';
import httpClient from '../services/http-client.js';

type TuikApiItem = {
  value?: string | number;
  date?: string;
  graphics?: Array<{ title?: string }>;
};

/** Fetches CPI, unemployment, GDP, and confidence indicators from TUIK. */
export async function fetch(): Promise<TuikStats> {
  const response = await httpClient.get<{ data?: TuikApiItem[] } | TuikApiItem[]>('https://veriportali.tuik.gov.tr/api/tr/press/indicators', {
    headers: { 'X-Requested-With': 'XMLHttpRequest' },
  });
  const items = Array.isArray(response.data) ? response.data : response.data.data ?? [];
  const result: TuikStats = {};

  assignIndicator(result, 'cpi', findByTitle(items, ['Tüketici Fiyat Endeksi']));
  assignIndicator(result, 'unemployment', findByTitle(items, ['İşsizlik']));
  assignIndicator(result, 'gdp', findByTitle(items, ['Gayrisafi Yurt İçi Hasıla', 'GSYH', 'Büyüme']));
  assignIndicator(result, 'consumerConfidence', findByTitle(items, ['Tüketici Güven']));

  if (!result.cpi && !result.unemployment && !result.gdp && !result.consumerConfidence) {
    throw new Error('No TUIK indicators found');
  }

  return result;
}

/** Finds the first TUIK item whose title contains one of the requested terms. */
function findByTitle(items: TuikApiItem[], titleParts: string[]): TuikApiItem | undefined {
  return items.find((item) => {
    const title = item.graphics?.[0]?.title || '';
    return titleParts.some((part) => title.includes(part));
  });
}

/** Assigns a TUIK item to the normalized result when it has usable fields. */
function assignIndicator(result: TuikStats, key: keyof TuikStats, item: TuikApiItem | undefined): void {
  if (item?.value === undefined || !item.date) {
    return;
  }

  result[key] = {
    value: item.value,
    period: item.date,
  };
}
