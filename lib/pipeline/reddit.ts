import type { Theme } from "@prisma/client";

/** Curated subreddits per theme — kept small and specific rather than searching all of Reddit. */
const SUBREDDITS: Record<Theme, string[]> = {
  PM: ["ProductManagement", "product_management"],
  AI: ["artificial", "MachineLearning"],
  Psychology: ["psychology", "workplace"],
};

export interface RedditThread {
  theme: Theme;
  subreddit: string;
  title: string;
  score: number;
  numComments: number;
  url: string;
}

let cachedToken: { value: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  const clientId = process.env.REDDIT_CLIENT_ID;
  const clientSecret = process.env.REDDIT_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("REDDIT_CLIENT_ID / REDDIT_CLIENT_SECRET is not set");
  }

  if (cachedToken && cachedToken.expiresAt > Date.now()) {
    return cachedToken.value;
  }

  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const res = await fetch("https://www.reddit.com/api/v1/access_token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": process.env.REDDIT_USER_AGENT || "pulsedraft-scout/1.0",
    },
    body: "grant_type=client_credentials",
  });

  if (!res.ok) {
    throw new Error(`Reddit auth failed: ${res.status} ${await res.text()}`);
  }

  const data = (await res.json()) as { access_token: string; expires_in: number };
  cachedToken = { value: data.access_token, expiresAt: Date.now() + (data.expires_in - 60) * 1000 };
  return cachedToken.value;
}

/** Pulls current hot (non-stickied) threads from a curated subreddit list, tagged by theme. */
export async function fetchTrendingRedditThreads(): Promise<RedditThread[]> {
  const token = await getAccessToken();
  const userAgent = process.env.REDDIT_USER_AGENT || "pulsedraft-scout/1.0";

  const threads: RedditThread[] = [];
  for (const [theme, subreddits] of Object.entries(SUBREDDITS) as [Theme, string[]][]) {
    for (const subreddit of subreddits) {
      const res = await fetch(`https://oauth.reddit.com/r/${subreddit}/hot?limit=8`, {
        headers: { Authorization: `Bearer ${token}`, "User-Agent": userAgent },
      });
      if (!res.ok) {
        throw new Error(`Reddit fetch failed for r/${subreddit}: ${res.status} ${await res.text()}`);
      }
      const data = (await res.json()) as {
        data: { children: { data: { title: string; stickied: boolean; score: number; num_comments: number; permalink: string } }[] };
      };
      for (const { data: post } of data.data.children) {
        if (post.stickied) continue;
        threads.push({
          theme,
          subreddit,
          title: post.title,
          score: post.score,
          numComments: post.num_comments,
          url: `https://reddit.com${post.permalink}`,
        });
      }
    }
  }

  return threads;
}
