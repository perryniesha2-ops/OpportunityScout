import { getTrendingCrypto, getTrendingStocks } from './marketService';
import { getTrendingFromReddit } from './redditService';
import { getTrendingTopics } from './trendsService';

export type UserProfile = {
  interests?: string[];
  skill_level?: 'beginner' | 'intermediate' | 'expert';
  time_available?: 'casual' | 'serious' | 'fulltime';
};

export type TrendItem = { id?: string; title?: string; summary?: string; tags?: string[] };
export type RedditPost = { id?: string; title?: string; teaser?: string; subreddit?: string; score?: number };
export type RedditData = { subreddits: string[]; trendingTopics: RedditPost[]; hotDiscussions: RedditPost[] };
export type StockItem = { sector: string; symbol: string; price?: string; change?: number; trend?: string };
export type CryptoItem = { id: string; name: string; symbol: string; rank?: number; priceChange24h?: number };

export type SignalsResult = {
  trends: TrendItem[];
  reddit: RedditData;
  stocks: StockItem[];
  crypto: CryptoItem[];
};

const memory = new Map<string, { ts: number; data: SignalsResult }>();

export async function getSignals(category: string, profile?: UserProfile): Promise<SignalsResult> {
  const key = `${category}:${JSON.stringify(profile?.interests || [])}`;
  const cached = memory.get(key);
  if (cached && Date.now() - cached.ts < 60_000) return cached.data;

  const [trends, reddit, stocks, crypto] = await Promise.allSettled([
    getTrendingTopics(category),
    getTrendingFromReddit(category),
    getTrendingStocks(),
    getTrendingCrypto(),
  ]);

  const data: SignalsResult = {
    trends: trends.status === 'fulfilled' ? (trends.value as TrendItem[]) ?? [] : [],
    reddit:
      reddit.status === 'fulfilled'
        ? ((reddit.value as RedditData) ?? { subreddits: [], trendingTopics: [], hotDiscussions: [] })
        : { subreddits: [], trendingTopics: [], hotDiscussions: [] },
    stocks: stocks.status === 'fulfilled' ? (stocks.value as StockItem[]) ?? [] : [],
    crypto: crypto.status === 'fulfilled' ? (crypto.value as CryptoItem[]) ?? [] : [],
  };

  memory.set(key, { ts: Date.now(), data });
  return data;
}
