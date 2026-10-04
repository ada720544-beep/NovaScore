exports.handler = async function () {
  const key = process.env.APISPORTS_KEY;
  if (!key) return { statusCode: 500, headers: cors(), body: JSON.stringify({ error: "لم يتم ضبط مفتاح API في إعدادات الاستضافة." }) };
  const date = new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Algiers", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  const headers = { "x-apisports-key": key };
  try {
    const urls = [
      `https://v3.football.api-sports.io/fixtures?date=${date}&timezone=Africa%2FAlgiers`,
      `https://v3.football.api-sports.io/fixtures?live=all`
    ];
    const responses = await Promise.all(urls.map(u => fetch(u, { headers })));
    const payloads = await Promise.all(responses.map(r => r.json()));
    if (responses.some(r => !r.ok) || payloads.some(p => p.errors && Object.keys(p.errors).length)) {
      return { statusCode: 502, headers: cors(), body: JSON.stringify({ error: "مزود النتائج رفض الطلب. تحقق من المفتاح أو حدود الخطة." }) };
    }
    const byId = new Map();
    payloads.flatMap(p => p.response || []).forEach(m => byId.set(m.fixture.id, m));
    return { statusCode: 200, headers: { ...cors(), "Cache-Control": "public, max-age=15" }, body: JSON.stringify({ response: [...byId.values()] }) };
  } catch (e) {
    return { statusCode: 502, headers: cors(), body: JSON.stringify({ error: "تعذر الاتصال بمزود النتائج." }) };
  }
};
function cors() { return { "Content-Type": "application/json; charset=utf-8", "Access-Control-Allow-Origin": "*" }; }
