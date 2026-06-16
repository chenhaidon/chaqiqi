export default function HomePage() {
  return (
    <main className="hero">
      <h1>查企企</h1>
      <p>浙江省企业信息查询 · 工商公开数据 · 支持评论打分</p>
      <form className="search-box" action="/search" method="get">
        <input
          type="text"
          name="q"
          placeholder="输入企业名称 / 统一社会信用代码 / 法定代表人"
          aria-label="企业查询关键词"
          autoFocus
          required
        />
        <button type="submit">查询</button>
      </form>
      <div className="hint">支持模糊查询,例如输入「云栖」即可匹配相关企业</div>
    </main>
  );
}
