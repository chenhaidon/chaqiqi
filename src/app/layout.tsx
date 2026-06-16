import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "查企企 · 浙江企业信息查询",
  description: "查询浙江省内企业的工商公开信息,支持评论打分。",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, padding: "12px 24px 0" }}>
          <Link href="/login">登录</Link>
          <Link href="/register">注册</Link>
        </div>
        {children}
      </body>
    </html>
  );
}
