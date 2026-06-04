import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const FOLLOW_PHRASES = {
  info: '他にも関東の温泉・サウナ情報を発信しているので、気になる人はフォローしてみてね！',
  benefit: '行って損なし！な温泉・サウナ情報だけ厳選して発信中だから、気になる人はフォローしてみて！',
  discovery: '知られざる名施設を掘り起こしてるので、温泉・サウナ好きはぜひフォローしてみてね！'
};

function buildPrompt(d) {
  const followPhrase = FOLLOW_PHRASES[d.followStyle] || FOLLOW_PHRASES.info;
  const targetMap = {
    couple: 'カップル向け',
    solo: 'ソロサウナー向け',
    friend: '友達同士向け',
    family: 'ファミリー向け',
    worker: '仕事帰り・テレワーク層向け',
    all: '全員'
  };
  const louhuMap = {
    none: 'なし',
    auto: 'オートロウリュ',
    self: 'セルフロウリュ',
    aufguss: 'アウフグース',
    multi: '複数あり'
  };
  const totooiMap = {
    good: '広くて充実（ゆったりととのえる）',
    normal: '普通',
    small: '少なめ（注意点として正直に言う）'
  };

  return `あなたはTikTok・YouTubeショート動画の台本ライターです。
温泉・サウナアカウント用のショート動画台本を作成してください。

【このアカウントについて】
- ターゲット：20〜30代カップル、ソロサウナー、主婦・ファミリー、仕事帰りの社会人
- エリア：関東メイン
- 目的：フォロワーを増やし、最終的に温泉・サウナ施設のまとめサイトを作り収益化

【台本の構成ルール】
1. フック（冒頭2秒）
　数字・実績・体験を必ず入れる。以下パターンから施設に合うものを使う
　- 受賞系：「〇〇で全国1位を取ったことがある、〇〇を紹介」
　- 規模系：「日本最大級、〇〇円から楽しめる〇〇を紹介」
　- 体験系：「男女水着でサウナを楽しめる〇〇を紹介」
　- 種類系：「サウナが全部で〇種類！〇〇を紹介」
　- 絶景系：「日本一夜景がきれいな〇〇を紹介」
　- 価格系：「〇〇円で一日過ごせる〇〇を紹介」

2. 入場・料金：「早速中に入り、今回は〇〇円」の形式

3. 施設マップ：「〇階には〜、〇階には〜」とフロア構成で全体像を俯瞰

4. メイン①温泉：内湯→露天の順。イチオシは「特に〇〇が気持ちよくて〜」と感情込みで

5. メイン②サウナ：種類→温度→水風呂温度→整いスペース評価の順
　必ずセット：「サウナ〇〇度、水風呂〇〇度」と数字で明記
　弱点がある場合：「ただ、〇〇なのでサウナ目的で来る人は要注意」と正直に1つ言い
　「でも/ただそれを超えるすごさが〜」で必ず逆転させる

6. フォロー訴求（必ずここに挿入）：
　「${followPhrase}」
　サウナの話が終わり、隠れた魅力に入る直前のタイミングで自然に挿入

7. 隠れた魅力：「でも実はすごいのが〇階で〜」「さらに外には〜」で意外性を演出

8. ターゲット言及：「${targetMap[d.target] || d.target}」に向けた一言を自然に入れる

9. アクセス補足（ある場合のみ）：「ちなみに〜」で自然に挿入

10. クロージング：
　感嘆フレーズ（「気づいたら1日過ぎている」「〇〇円は安すぎる！」など）
　→ 施設の核心を表す修飾フレーズ＋施設名を再読み上げ
　→「ぜひ行ってみてね」で締める

【文体ルール】
- 全体400〜500文字を目安
- 「サイコー」「たまらない」「〜できちゃう」などポジティブな口語表現を複数回使う
- 2秒ごとに新しい情報が出るテンポ感を意識する
- 弱点は1つだけ正直に言い「でも/ただ」で必ずリカバーする
- 数字（温度・料金・種類数）は必ず入れる
- 施設名はクロージングで必ず再読み上げする

【TikTok攻略ナレッジ】
- 冒頭2秒でスワイプされないよう施設の一番インパクトある要素を即出し
- 中盤に「でも実はすごいのが〜」のギャップを必ず作り離脱を防ぐ
- 弱点を正直に言うことで「わかる！」の共感→シェア・いいねを誘う
- フォロー訴求は視聴者の関心が高まった中盤タイミングに入れる

【施設情報】
施設名：${d.name}
エリア・最寄り：${d.area || '未入力'}
料金：${d.price || '未入力'}
営業時間：${d.hours || '未入力'}
アクセス補足：${d.access || 'なし'}
フックの種類：${d.hookType || ''}
フック詳細：${d.hookDetail}
内湯：${d.indoorBath || '未入力'}
露天風呂：${d.outdoorBath || '未入力'}
温泉のイチオシ：${d.bathBest || '未入力'}
サウナ種類：${d.saunaTypes || '未入力'}
サウナ温度：${d.saunaTemp || '未入力'}
水風呂温度：${d.waterTemp || '未入力'}
ロウリュ：${louhuMap[d.louhu] || d.louhu || 'なし'}
整いスペース：${totooiMap[d.totonoi] || d.totonoi || '普通'}
サウナの弱点：${d.saunaWeak || 'なし'}
サウナのイチオシ：${d.saunaBest || '未入力'}
隠れた魅力：${d.hidden || '未入力'}
絶景・ユニーク体験：${d.unique || 'なし'}
水着エリア：${d.mizugi === 'yes' ? 'あり（男女一緒に入れる）' : 'なし'}
ターゲット：${targetMap[d.target] || d.target}

台本だけを出力してください。説明や補足は不要です。`;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const data = req.body;
    if (!data.name || !data.hookDetail) {
      return res.status(400).json({ error: '施設名とフック詳細は必須です' });
    }

    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      messages: [{ role: 'user', content: buildPrompt(data) }]
    });

    const text = message.content
      .filter(b => b.type === 'text')
      .map(b => b.text)
      .join('');

    res.status(200).json({ script: text });
  } catch (error) {
    console.error('Generate error:', error);
    res.status(500).json({ error: error.message || '台本生成に失敗しました' });
  }
}
