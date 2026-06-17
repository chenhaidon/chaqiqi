import type { Metadata } from "next";
import AuthNav from "./auth-nav";
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
        <AuthNav />
        {children}
      </body>
    </html>
  );
}
