import { Company, SearchResult } from "./types";
import { MOCK_COMPANIES } from "./mockData";
import { qccSearch, qccDetail } from "./qccProvider";
import { cacheGet, cacheSet } from "./cache";
import {
  getCompanyById,
  searchCompaniesFromDb,
  upsertCompany,
  upsertCompanies,
} from "./companyRepo";

const PROVIDER = (process.env.DATA_PROVIDER || "mock").toLowerCase();
const TTL = parseInt(process.env.CACHE_TTL_SECONDS || "86400", 10);

function scoreCompany(c: Company, keyword: string): number {
  const kw = keyword.trim().toLowerCase();
  const name = (c.name || "").toLowerCase();
  const creditCode = (c.creditCode || "").toLowerCase();
  const legalPerson = (c.legalPerson || "").toLowerCase();

  if (!kw) return 0;
  if (creditCode === kw) return 100;
  if (name === kw) return 95;
  if (name.startsWith(kw)) return 90;
  if (name.includes(kw)) return 80;
  if (legalPerson === kw) return 70;
  if (legalPerson.includes(kw)) return 60;
  if (creditCode.includes(kw)) return 50;
  return 0;
}

function pickBestMatch(items: Company[], keyword: string): Company[] {
  return [...items]
    .map((item) => ({ item, score: scoreCompany(item, keyword) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 1)
    .map((entry) => entry.item);
}

function toBestSearchResult(items: Company[], keyword: string): SearchResult {
  const bestItems = pickBestMatch(items, keyword);
  return {
    items: bestItems,
    total: bestItems.length,
    page: 1,
    pageSize: 1,
  };
}

function mockSearch(keyword: string, _page: number, pageSize: number): SearchResult {
  const kw = keyword.trim();
  const matched = MOCK_COMPANIES.filter((c) => {
    if (!kw) return true;
    return (
      c.name.includes(kw) ||
      c.creditCode.includes(kw) ||
      c.legalPerson.includes(kw)
    );
  });

  const best = pickBestMatch(matched, kw);
  return {
    items: best,
    total: best.length,
    page: 1,
    pageSize: Math.max(1, Math.min(pageSize, 1)),
  };
}

function mockDetail(id: string): Company | null {
  return MOCK_COMPANIES.find((c) => c.id === id) || null;
}

export async function searchCompanies(
  keyword: string,
  page: number,
  pageSize: number
): Promise<SearchResult> {
  const cacheKey = `search:${PROVIDER}:${keyword}:${page}:${pageSize}`;
  const cached = cacheGet<SearchResult>(cacheKey);
  if (cached) return cached;

  if (PROVIDER !== "qcc") {
    const mockResult = mockSearch(keyword, page, pageSize);
    cacheSet(cacheKey, mockResult, TTL);
    return mockResult;
  }

  const dbMatches = searchCompaniesFromDb(keyword);
  if (dbMatches.length > 0) {
    const dbResult = toBestSearchResult(dbMatches, keyword);
    cacheSet(cacheKey, dbResult, TTL);
    return dbResult;
  }

  const apiResult = await qccSearch(keyword, page, pageSize);
  if (apiResult.items.length > 0) {
    upsertCompanies(apiResult.items);
  }

  const result = toBestSearchResult(apiResult.items, keyword);
  cacheSet(cacheKey, result, TTL);
  return result;
}

export async function getCompany(id: string): Promise<Company | null> {
  const cacheKey = `detail:${PROVIDER}:${id}`;
  const cached = cacheGet<Company | null>(cacheKey);
  if (cached !== null) return cached;

  if (PROVIDER !== "qcc") {
    const mockResult = mockDetail(id);
    if (mockResult) cacheSet(cacheKey, mockResult, TTL);
    return mockResult;
  }

  const localCompany = getCompanyById(id);
  if (localCompany) {
    cacheSet(cacheKey, localCompany, TTL);
    return localCompany;
  }

  const remoteCompany = await qccDetail(id);
  if (remoteCompany) {
    upsertCompany(remoteCompany);
    cacheSet(cacheKey, remoteCompany, TTL);
  }
  return remoteCompany;
}

export function currentProvider(): string {
  return PROVIDER;
}
