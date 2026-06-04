const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_USER = process.env.GITHUB_USER || 'daikisubad-bit';
const GITHUB_REPO = process.env.GITHUB_REPO || 'sauna-script-generator';

async function githubApi(path, method, body) {
  const res = await fetch(`https://api.github.com${path}`, {
    method,
    headers: {
      Authorization: `token ${GITHUB_TOKEN}`,
      'Content-Type': 'application/json',
      Accept: 'application/vnd.github.v3+json'
    },
    body: body ? JSON.stringify(body) : undefined
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || `GitHub API error: ${res.status}`);
  return json;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!GITHUB_TOKEN) {
    return res.status(500).json({ error: 'GITHUB_TOKEN が設定されていません' });
  }

  const { content, filePath = 'index.html', message = 'Update via sauna-script-generator' } = req.body || {};

  if (!content) {
    return res.status(400).json({ error: 'content が必要です' });
  }

  try {
    const apiPath = `/repos/${GITHUB_USER}/${GITHUB_REPO}/contents/${filePath}`;

    // 現在のファイルのSHAを取得
    let sha;
    try {
      const current = await githubApi(apiPath, 'GET');
      sha = current.sha;
    } catch {
      // ファイルが存在しない場合は新規作成
    }

    const encoded = Buffer.from(content).toString('base64');

    await githubApi(apiPath, 'PUT', {
      message,
      content: encoded,
      ...(sha ? { sha } : {})
    });

    res.status(200).json({ success: true, url: `https://github.com/${GITHUB_USER}/${GITHUB_REPO}/blob/main/${filePath}` });
  } catch (error) {
    console.error('GitHub push error:', error);
    res.status(500).json({ error: error.message || 'GitHub への反映に失敗しました' });
  }
}
