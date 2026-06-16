import { getDb } from "./db";
import type { Company } from "./types";

type CompanyRow = {
  id: string;
  name: string;
  status: string;
  credit_code: string;
  legal_person: string;
  registered_capital: string;
  establish_date: string;
  address: string;
  business_scope: string;
  province: string;
};

function rowToCompany(row: CompanyRow): Company {
  return {
    id: row.id,
    name: row.name,
    status: row.status,
    creditCode: row.credit_code,
    legalPerson: row.legal_person,
    registeredCapital: row.registered_capital,
    establishDate: row.establish_date,
    address: row.address,
    businessScope: row.business_scope,
    province: row.province,
  };
}

function companyToParams(company: Company) {
  return {
    id: company.id,
    name: company.name,
    status: company.status || "",
    credit_code: company.creditCode || "",
    legal_person: company.legalPerson || "",
    registered_capital: company.registeredCapital || "",
    establish_date: company.establishDate || "",
    address: company.address || "",
    business_scope: company.businessScope || "",
    province: company.province || "",
  };
}

export function getCompanyById(id: string): Company | null {
  const db = getDb();
  const row = db
    .prepare(
      `SELECT id, name, status, credit_code, legal_person, registered_capital, establish_date, address, business_scope, province
       FROM companies WHERE id = ?`
    )
    .get(id) as CompanyRow | undefined;

  return row ? rowToCompany(row) : null;
}

export function searchCompaniesFromDb(keyword: string): Company[] {
  const db = getDb();
  const kw = keyword.trim();
  if (!kw) return [];
  const like = `%${kw}%`;
  const rows = db
    .prepare(
      `SELECT id, name, status, credit_code, legal_person, registered_capital, establish_date, address, business_scope, province
       FROM companies
       WHERE name LIKE ? OR credit_code LIKE ? OR legal_person LIKE ?`
    )
    .all(like, like, like) as CompanyRow[];

  return rows.map(rowToCompany);
}

export function upsertCompany(company: Company): void {
  const db = getDb();
  const params = companyToParams(company);
  db.prepare(
    `INSERT INTO companies (
      id, name, status, credit_code, legal_person, registered_capital, establish_date, address, business_scope, province, source, updated_at
    ) VALUES (
      @id, @name, @status, @credit_code, @legal_person, @registered_capital, @establish_date, @address, @business_scope, @province, 'qcc', datetime('now','localtime')
    )
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name,
      status = excluded.status,
      credit_code = excluded.credit_code,
      legal_person = excluded.legal_person,
      registered_capital = excluded.registered_capital,
      establish_date = excluded.establish_date,
      address = excluded.address,
      business_scope = excluded.business_scope,
      province = excluded.province,
      source = 'qcc',
      updated_at = datetime('now','localtime')`
  ).run(params);
}

export function upsertCompanies(companies: Company[]): void {
  const insertMany = getDb().transaction((items: Company[]) => {
    for (const company of items) {
      upsertCompany(company);
    }
  });
  insertMany(companies);
}
