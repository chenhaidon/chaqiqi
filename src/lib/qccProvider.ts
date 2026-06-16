import crypto from "crypto";
import { Company, SearchResult } from "./types";

// ============================================================
// 企查查开放平台适配层
// ------------------------------------------------------------
// 注意:企查查接口存在多个版本,不同套餐返回字段命名略有差异。
// 下方的字段映射(mapToCompany)按常见的 v4 "企业关键字模糊搜索 / 企业工商照面"
// 字段编写,如与你账号实际返回不一致,只需调整 mapToCompany 即可,
// 上层代码无需改动。
//
// 鉴权方式(企查查标准):
//   Token = MD5(key + timespan + secretKey) 转大写
//   请求头: Token、Timespan
// ============================================================

const KEY = process.env.QCC_KEY || "";
const SECRET = process.env.QCC_SECRET_KEY || "";
const BASE_URL = process.env.QCC_BASE_URL || "https://api.qichacha.com";

function buildAuthHeaders(): Record<string, string> {
  const timespan = Math.floor(Date.now() / 1000).toString();
  const token = crypto
    .createHash("md5")
    .update(KEY + timespan + SECRET)
    .digest("hex")
    .toUpperCase();
  return { Token: token, Timespan: timespan };
}

// 将企查查返回的单条记录映射为内部 Company 结构。
// 字段做了容错:不同接口可能用 Name/CompanyName,No/CreditCode 等。
function mapToCompany(raw: any): Company {
  return {
    id: String(raw.KeyNo ?? raw.keyNo ?? raw.Id ?? ""),
    name: raw.Name ?? raw.CompanyName ?? "",
    status: raw.Status ?? raw.ShortStatus ?? raw.RegStatus ?? "未知",
    creditCode: raw.CreditCode ?? raw.No ?? raw.OrgNo ?? "",
    legalPerson: raw.OperName ?? raw.LegalPerson ?? raw.Oper?.Name ?? "",
    registeredCapital: raw.RegistCapi ?? raw.RegisteredCapital ?? "",
    establishDate: raw.StartDate ?? raw.EstablishDate ?? raw.TermStart ?? "",
    address: raw.Address ?? "",
    businessScope: raw.Scope ?? raw.BusinessScope ?? "",
    province: raw.Province ?? "",
  };
}

function isZhejiang(c: Company): boolean {
  const text = `${c.address}${c.province}`;
  return text.includes("浙江") || text.includes("浙");
}

async function qccRequest(pathName: string, params: Record<string, string>) {
  const url = new URL(pathName, BASE_URL);
  url.searchParams.set("key", KEY);
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }

  const res = await fetch(url.toString(), {
    method: "GET",
    headers: buildAuthHeaders(),
  });

  const text = await res.text();
  let json: any;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error(`企查查接口返回非 JSON (HTTP ${res.status}): ${text.slice(0, 200)}`);
  }

  if (!res.ok) {
    throw new Error(
      `企查查接口 HTTP ${res.status}: ${json?.Message ?? json?.msg ?? text.slice(0, 200)}`
    );
  }
  if (json.Status && json.Status !== "200") {
    throw new Error(
      `企查查接口业务错误 Status=${json.Status}: ${json.Message ?? json.msg ?? ""}`
    );
  }
  return json;
}

export async function qccSearch(
  keyword: string,
  page: number,
  pageSize: number
): Promise<SearchResult> {
  const candidates = [
    ["/FuzzySearch/GetList", { searchKey: keyword }],
    ["/FuzzySearch/GetList", { key: keyword }],
    ["/ECI/Search/GetList", { searchKey: keyword, pageIndex: String(page) }],
    ["/ECI/Search/GetList", { key: keyword, pageIndex: String(page) }],
    ["/ECIV4/SearchAdvance", { searchKey: keyword, pageIndex: String(page) }],
    ["/ECIV4/SearchAdvance", { keyword, pageIndex: String(page) }],
    ["/ECV4/Search", { searchKey: keyword, pageIndex: String(page) }],
    ["/ECV4/Search", { keyword, pageIndex: String(page) }],
  ] as const;

  let lastError: unknown;
  for (const [pathName, params] of candidates) {
    try {
      const json = await qccRequest(pathName, params);
      const rawList: any[] =
        json.Result ?? json.Paging?.Result ?? json.Data ?? json.List ?? [];
      let items = rawList.map(mapToCompany).filter((c) => c.name);
      items = items.filter(isZhejiang);
      const total = json.Paging?.TotalRecords ?? json.TotalRecords ?? items.length;
      return { items: items.slice(0, pageSize), total, page, pageSize };
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("企查查搜索接口不可用");
}

export async function qccDetail(id: string): Promise<Company | null> {
  const candidates = [
    ["/ECIInfoVerify/GetInfo", { keyNo: id }],
    ["/ECIV4/GetBasicDetailsByName", { keyNo: id }],
    ["/ECIV4/GetDetailsByName", { keyNo: id }],
  ] as const;

  let lastError: unknown;
  for (const [pathName, params] of candidates) {
    try {
      const json = await qccRequest(pathName, params);
      const raw = json.Result ?? json.Data ?? null;
      if (!raw) return null;
      return mapToCompany(raw);
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("企查查详情接口不可用");
}
