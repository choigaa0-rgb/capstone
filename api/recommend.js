// Vercel 서버 함수: API 키를 숨긴 채 Gemini API(무료 등급)를 호출합니다.
// Vercel 환경변수: GEMINI_API_KEY (필수), GEMINI_MODEL (선택, 기본 gemini-2.5-flash)

const MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const SKILL_DESC = {
  '초급': '라면·계란후라이 수준, 칼질 최소, 한 번에 끝나는 조리',
  '중급': '볶음·찌개 등 여러 단계 조리, 기본 칼질 가능',
  '상급': '튀김·반죽·소스 등 복잡한 조리 가능',
};
const clip = (v, n) => String(v == null ? '' : v).slice(0, n);

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST만 가능해요.' });
  if (!process.env.GEMINI_API_KEY) return res.status(500).json({ error: '서버에 API 키가 설정되지 않았어요.' });

  let body = req.body || {};
  if (typeof body === 'string') { try { body = JSON.parse(body || '{}'); } catch (_) { body = {}; } }
  const items = Array.isArray(body.items) ? body.items.slice(0, 30) : [];
  if (!items.length) return res.status(400).json({ error: '재료가 비어 있어요.' });
  const c = body.conditions || {};
  const skill = SKILL_DESC[c.skill] ? c.skill : '초급';

  const lines = items.map(x => `- ${clip(x.name, 40)} (소비기한 ${clip(x.date, 10)}, ${clip(x.label, 8)}${x.priority ? ', 우선 소비' : ''}${x.expired ? ', 기한 지남' : ''})`).join('\n');
  const pri = items.filter(x => x.priority && !x.expired).map(x => clip(x.name, 40));

  const prompt = `너는 자취 대학생의 냉장고 재료로 메뉴를 추천하는 도우미야.
오늘 날짜: ${clip(body.today, 10)}

[보유 재료 - 소비기한 임박 순]
${lines}

[우선 소비 재료]
${pri.length ? pri.join(', ') : '없음'}

[사용자 조건]
- 요리 실력: ${skill} (${SKILL_DESC[skill]})
- 조리 가능 시간: ${clip(c.time, 20)}
- 추가 재료 구매: ${clip(c.buy, 20)}
- 좋아하는 음식: ${clip(c.like, 100) || '특별히 없음'}
- 피해야 할 것/알레르기: ${clip(c.avoid, 100) || '없음'}

[규칙]
1. 메뉴 3개를 추천한다. 우선 소비 재료를 최대한 많이, 서로 나눠 쓰도록 구성한다.
2. 사용자의 요리 실력과 조리 시간을 넘는 메뉴는 추천하지 않는다.
3. 메뉴명은 유튜브·블로그에서 검색하면 레시피가 바로 나오는 일반적인 이름으로 쓴다.
4. 보유 재료에 없는 재료는 extra에 적는다. 소금·후추·간장·설탕·식용유·참기름·고춧가루 같은 기본 양념은 있다고 가정한다. 추가 재료 구매가 '안 함'이면 extra는 빈 배열.
5. 알레르기·피해야 할 재료는 절대 쓰지 않는다. 소비기한이 지난 재료는 쓰지 말고 note에 상태 확인을 안내한다.
6. steps는 초보도 따라 할 수 있게 3~5단계로 짧게 쓴다.

아래 JSON 형식으로만 답해:
{"menus":[{"name":"메뉴명","why":"추천 이유 1~2문장","uses":["사용하는 보유 재료명(목록에 적힌 이름 그대로)"],"extra":["추가 재료"],"difficulty":"초급|중급|상급","minutes":15,"steps":["단계"]}],"note":"남는 우선 소비 재료나 주의사항 한 문장"}`;

  try {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(MODEL)}:generateContent`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-goog-api-key': process.env.GEMINI_API_KEY },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: 'application/json', temperature: 0.7 },
      }),
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) {
      console.error('Gemini error', r.status, JSON.stringify(data).slice(0, 800));
      const msg = r.status === 429 ? '무료 사용 한도에 도달했어요. 1분 정도 뒤에 다시 시도해 주세요.'
        : (r.status === 400 || r.status === 403) ? 'API 키 또는 모델 설정을 확인해 주세요. (Vercel 로그에 자세한 이유가 있어요)'
        : r.status === 404 ? '모델 이름을 찾을 수 없어요. GEMINI_MODEL 환경변수를 확인해 주세요.'
        : 'AI 호출에 실패했어요. 잠시 후 다시 시도해 주세요.';
      return res.status(502).json({ error: msg });
    }
    const text = ((((data.candidates || [])[0] || {}).content || {}).parts || []).map(p => p.text || '').join('');
    const s = text.indexOf('{'), e = text.lastIndexOf('}');
    if (s < 0 || e < s) return res.status(502).json({ error: '추천 결과가 비어 있어요. 다시 시도해 주세요.' });
    try { return res.status(200).json(JSON.parse(text.slice(s, e + 1))); }
    catch (_) { return res.status(502).json({ error: '추천 결과 형식을 읽지 못했어요. 다시 시도해 주세요.' }); }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: '서버 오류가 났어요. 잠시 후 다시 시도해 주세요.' });
  }
};
