import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const EXTRACT_PROMPT = `以下の施設情報から温泉・サウナ施設の情報を抽出してJSONで返してください。

【重要な優先順位】
- 料金・営業時間・サウナ種類・温度などの数字は公式情報を優先
- 雰囲気・特徴・口コミ由来の表現はサウナイキタイの情報を優先
- hookDetailには「この施設の一番インパクトある特徴」を受賞歴・日本一・規模・絶景・ユニーク体験など具体的な数字や実績を含む形で

抽出項目（不明は空文字）：
name, area, price, hours, access, hookDetail, indoorBath, outdoorBath, bathBest, saunaTypes, saunaTemp, waterTemp, louhu(none/auto/self/aufguss/multi), saunaWeak, saunaBest, hidden, unique, mizugi(yes/no)

JSONのみ返してください。

施設情報：
`;

const SEARCH_PROMPT = (facilityName) => `「${facilityName}」という温泉・サウナ施設について以下の2ステップで情報収集してください。

ステップ1：公式サイトを検索して以下の正確な情報を取得
- 施設名、所在地、最寄り駅
- 料金（平日・土日・各種セット料金）
- 営業時間
- アクセス（シャトルバス・駐車場など）
- 温泉・お風呂の種類（内湯・露天）
- サウナの種類・数・温度
- 水風呂の温度
- ロウリュの有無・種類
- その他設備（岩盤浴・食事処・コワーキングなど）

ステップ2：サウナイキタイ（sauna-ikitai.com）でこの施設を検索して以下を取得
- 利用者の口コミから見えるこの施設の特徴・魅力
- サウナ・水風呂・整いスペースの雰囲気や評判
- 他にない独自の体験・絶景・ユニークポイント
- 弱点として挙げられている点

収集した情報を以下のJSON形式で返してください。
公式情報を優先しつつ、サウナイキタイの口コミで肉付けしてください。

{
  "name": "",
  "area": "",
  "price": "",
  "hours": "",
  "access": "",
  "hookDetail": "（この施設の一番インパクトある特徴を数字・実績込みで）",
  "indoorBath": "",
  "outdoorBath": "",
  "bathBest": "（口コミベースのイチオシ理由を感情込みで）",
  "saunaTypes": "",
  "saunaTemp": "",
  "waterTemp": "",
  "louhu": "none/auto/self/aufguss/multiのいずれか",
  "saunaWeak": "（口コミで挙げられている弱点。なければ空文字）",
  "saunaBest": "（口コミベースのサウナのイチオシ）",
  "hidden": "（岩盤浴・コワーキング・絶景テラスなど隠れた魅力）",
  "unique": "（絶景・ユニーク体験）",
  "mizugi": "yes or no"
}

JSONのみ返してください。説明不要。`;

async function fetchPageViaAllorigins(url) {
  const apiUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
  const res = await fetch(apiUrl, { signal: AbortSignal.timeout(15000) });
  if (!res.ok) throw new Error(`allorigins fetch failed: ${res.status}`);
  const json = await res.json();
  return json.contents || '';
}

function stripHtml(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 8000);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { url, facilityName } = req.body || {};

  try {
    let result;

    if (url) {
      let pageText;
      try {
        const html = await fetchPageViaAllorigins(url);
        pageText = stripHtml(html);
      } catch (e) {
        return res.status(400).json({ error: `ページの取得に失敗しました: ${e.message}` });
      }

      const message = await client.messages.create({
        model: 'claude-sonnet-4-5',
        max_tokens: 1500,
        messages: [{ role: 'user', content: EXTRACT_PROMPT + pageText }]
      });

      const text = message.content
        .filter(b => b.type === 'text')
        .map(b => b.text)
        .join('');

      const cleaned = text.replace(/```json|```/g, '').trim();
      result = JSON.parse(cleaned);

    } else if (facilityName) {
      const message = await client.messages.create({
        model: 'claude-sonnet-4-5',
        max_tokens: 2000,
        tools: [{ type: 'web_search_20250305', name: 'web_search' }],
        messages: [{ role: 'user', content: SEARCH_PROMPT(facilityName) }]
      });

      const text = message.content
        .filter(b => b.type === 'text')
        .map(b => b.text)
        .join('');

      const cleaned = text.replace(/```json|```/g, '').trim();
      result = JSON.parse(cleaned);

    } else {
      return res.status(400).json({ error: 'url または facilityName が必要です' });
    }

    res.status(200).json(result);
  } catch (error) {
    console.error('Fetch-info error:', error);
    res.status(500).json({ error: error.message || '情報取得に失敗しました' });
  }
}
