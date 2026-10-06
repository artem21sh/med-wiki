import 'server-only';

const GITHUB_API = 'https://api.github.com';

export class GitHubNotFoundError extends Error {}
export class GitHubConflictError extends Error {}

function getConfig() {
  const token = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPO; // "owner/repo"
  const branch = process.env.GITHUB_BRANCH || 'main';
  if (!token || !repo) {
    throw new Error('GITHUB_TOKEN/GITHUB_REPO is not configured');
  }
  return { token, repo, branch };
}

function encodePath(filePath: string): string {
  return filePath.split('/').map(encodeURIComponent).join('/');
}

export async function getFile(filePath: string): Promise<{ content: string; sha: string }> {
  const { token, repo, branch } = getConfig();
  const res = await fetch(
    `${GITHUB_API}/repos/${repo}/contents/${encodePath(filePath)}?ref=${encodeURIComponent(branch)}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
      cache: 'no-store',
    }
  );
  if (res.status === 404) throw new GitHubNotFoundError(filePath);
  if (!res.ok) throw new Error(`GitHub GET ${filePath} failed: ${res.status}`);

  const json = await res.json();
  const content = Buffer.from(json.content, 'base64').toString('utf-8');
  return { content, sha: json.sha };
}

export async function putFile(
  filePath: string,
  content: string,
  sha: string,
  message: string
): Promise<{ sha: string }> {
  const { token, repo, branch } = getConfig();
  const res = await fetch(`${GITHUB_API}/repos/${repo}/contents/${encodePath(filePath)}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message,
      content: Buffer.from(content, 'utf-8').toString('base64'),
      sha,
      branch,
    }),
  });
  if (res.status === 409) throw new GitHubConflictError(filePath);
  if (!res.ok) throw new Error(`GitHub PUT ${filePath} failed: ${res.status}`);

  const json = await res.json();
  return { sha: json.content.sha };
}
