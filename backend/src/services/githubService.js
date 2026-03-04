const axios = require('axios');

const GITHUB_API = 'https://api.github.com';

const githubClient = () =>
  axios.create({
    baseURL: GITHUB_API,
    headers: {
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      Accept: 'application/vnd.github.v3+json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
    timeout: 10000,
  });

/**
 * Parse owner and repo from a GitHub URL
 * @param {string} repoUrl
 * @returns {{ owner: string, repo: string }}
 */
const parseRepoUrl = (repoUrl) => {
  const match = repoUrl.match(/github\.com\/([^/]+)\/([^/]+?)(?:\.git)?(?:\/.*)?$/);
  if (!match) throw new Error('Invalid GitHub repository URL');
  return { owner: match[1], repo: match[2] };
};

/**
 * Get repository metadata
 */
const getRepoInfo = async (repoUrl) => {
  const { owner, repo } = parseRepoUrl(repoUrl);
  const client = githubClient();
  const { data } = await client.get(`/repos/${owner}/${repo}`);
  return {
    fullName: data.full_name,
    description: data.description,
    createdAt: data.created_at,
    pushedAt: data.pushed_at,
    updatedAt: data.updated_at,
    stargazersCount: data.stargazers_count,
    forksCount: data.forks_count,
    openIssuesCount: data.open_issues_count,
    language: data.language,
    topics: data.topics || [],
    defaultBranch: data.default_branch,
    size: data.size,
    isPrivate: data.private,
    isFork: data.fork,
  };
};

/**
 * Get commit count and recent commit history
 */
const getCommitStats = async (repoUrl, since = null) => {
  const { owner, repo } = parseRepoUrl(repoUrl);
  const client = githubClient();

  const params = { per_page: 100 };
  if (since) params.since = since;

  const { data: commits } = await client.get(`/repos/${owner}/${repo}/commits`, { params });

  return {
    totalCommits: commits.length,
    latestCommit: commits[0]
      ? {
          sha: commits[0].sha,
          message: commits[0].commit?.message,
          authorDate: commits[0].commit?.author?.date,
          authorName: commits[0].commit?.author?.name,
        }
      : null,
    commits: commits.slice(0, 10).map((c) => ({
      sha: c.sha,
      message: c.commit?.message,
      date: c.commit?.author?.date,
    })),
  };
};

/**
 * Get contributors list
 */
const getContributors = async (repoUrl) => {
  const { owner, repo } = parseRepoUrl(repoUrl);
  const client = githubClient();
  const { data } = await client.get(`/repos/${owner}/${repo}/contributors`, {
    params: { per_page: 20 },
  });
  return data.map((c) => ({
    login: c.login,
    contributions: c.contributions,
    avatarUrl: c.avatar_url,
  }));
};

/**
 * Get repository languages breakdown
 */
const getLanguages = async (repoUrl) => {
  const { owner, repo } = parseRepoUrl(repoUrl);
  const client = githubClient();
  const { data } = await client.get(`/repos/${owner}/${repo}/languages`);
  const total = Object.values(data).reduce((s, v) => s + v, 0);
  const breakdown = {};
  for (const [lang, bytes] of Object.entries(data)) {
    breakdown[lang] = { bytes, percentage: ((bytes / total) * 100).toFixed(1) };
  }
  return breakdown;
};

/**
 * Full repo analysis — combines all checks
 */
const analyzeRepo = async (repoUrl, hackathonStartDate = null) => {
  const [info, commits, contributors, languages] = await Promise.allSettled([
    getRepoInfo(repoUrl),
    getCommitStats(repoUrl, hackathonStartDate),
    getContributors(repoUrl),
    getLanguages(repoUrl),
  ]);

  const repoInfo = info.status === 'fulfilled' ? info.value : null;
  const commitStats = commits.status === 'fulfilled' ? commits.value : null;
  const contribs = contributors.status === 'fulfilled' ? contributors.value : null;
  const langs = languages.status === 'fulfilled' ? languages.value : null;

  // Age check
  const repoAge = repoInfo
    ? Math.floor((Date.now() - new Date(repoInfo.createdAt).getTime()) / (1000 * 60 * 60 * 24))
    : null;

  const flags = [];
  if (repoInfo?.isFork) flags.push('Repository is a fork');
  if (repoAge !== null && repoAge < 1) flags.push('Repository created less than 24 hours ago');
  if (commitStats?.totalCommits < 3) flags.push('Very few commits (less than 3)');

  return {
    repoUrl,
    info: repoInfo,
    commits: commitStats,
    contributors: contribs,
    languages: langs,
    repoAgeInDays: repoAge,
    flags,
    analyzedAt: new Date().toISOString(),
  };
};

module.exports = { parseRepoUrl, getRepoInfo, getCommitStats, getContributors, getLanguages, analyzeRepo };
