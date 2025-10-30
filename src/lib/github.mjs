const GITHUB_API = 'https://api.github.com';

function authHeaders() {
  const headers = { 'User-Agent': 'duckbite-cursor-rules-cli' };
  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }
  return headers;
}

export async function listDirectory({ owner, repo, path, ref }) {
  const url = `${GITHUB_API}/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}?ref=${encodeURIComponent(ref)}`;
  const res = await fetch(url, { headers: authHeaders() });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitHub list failed: ${res.status} ${res.statusText} - ${text}`);
  }
  return res.json();
}

export async function listFilesRecursive({ owner, repo, rootPath, ref }) {
  const files = [];
  async function walk(p) {
    const entries = await listDirectory({ owner, repo, path: p, ref });
    for (const entry of entries) {
      if (entry.type === 'file') {
        files.push({ path: entry.path, download_url: entry.download_url });
      } else if (entry.type === 'dir') {
        await walk(entry.path);
      }
    }
  }
  await walk(rootPath);
  return files;
}

export async function fetchFile({ download_url }) {
  const res = await fetch(download_url, { headers: authHeaders() });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitHub fetch failed: ${res.status} ${res.statusText} - ${text}`);
  }
  return res.text();
}

