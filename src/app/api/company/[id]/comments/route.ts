import { NextRequest, NextResponse } from "next/server";
import { listComments, addComment } from "@/lib/comments";
import { getCurrentUser } from "@/lib/authSession";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = decodeURIComponent(params.id);
  return NextResponse.json({ comments: listComments(id) });
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "请先登录后再发表评论" }, { status: 401 });
  }

  const id = decodeURIComponent(params.id);
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "请求体格式错误" }, { status: 400 });
  }

  const content = typeof body.content === "string" ? body.content.trim() : "";
  const rating = Number(body.rating);

  if (!content) {
    return NextResponse.json({ error: "评论内容不能为空" }, { status: 400 });
  }
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "评分需为 1-5 的整数" }, { status: 400 });
  }
  if (content.length > 500) {
    return NextResponse.json({ error: "评论内容不超过 500 字" }, { status: 400 });
  }

  const comment = addComment(id, user.email, rating, content);
  return NextResponse.json({ comment }, { status: 201 });
}
