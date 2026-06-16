// 统一的企业信息内部模型。所有数据源(企查查/mock)都映射到这个结构,
// 这样上层 UI 与 API 路由不依赖具体供应商的字段命名。

export interface Company {
  /** 数据源内部唯一标识(企查查为 KeyNo) */
  id: string;
  /** 企业全称 */
  name: string;
  /** 登记/经营状态,如 "存续" "在业" "注销" */
  status: string;
  /** 统一社会信用代码 */
  creditCode: string;
  /** 法定代表人 */
  legalPerson: string;
  /** 注册资本(原始字符串,如 "1000万元人民币") */
  registeredCapital: string;
  /** 成立日期 YYYY-MM-DD */
  establishDate: string;
  /** 注册地址 */
  address: string;
  /** 经营范围 */
  businessScope: string;
  /** 所属省份,用于浙江过滤 */
  province?: string;
}

export interface SearchResult {
  items: Company[];
  total: number;
  page: number;
  pageSize: number;
}

export interface Comment {
  id: number;
  companyId: string;
  author: string;
  rating: number; // 1-5
  content: string;
  createdAt: string;
}

export interface RatingSummary {
  average: number;
  count: number;
}

export interface User {
  id: string;
  email: string;
  emailVerified: boolean;
  createdAt: string;
}

export interface AuthSession {
  id: string;
  userId: string;
  expiresAt: number;
}
