// src/services/aiService.ts
import { getSignals } from './signals';

/** Core types exported so screens can import the single source of truth */
export type Category = 'social' | 'hobbies' | 'business' | 'stocks';

export type UserProfile = {
  interests?: string[];
  skill_level?: 'beginner' | 'intermediate' | 'expert';
  time_available?: 'casual' | 'serious' | 'fulltime';
};

export type Opportunity = {
  id: string | number;
  category: Category;
  title: string;
  trend: string;
  score: number;
  competition: string;
  potential: string;
  timeframe: string;
  description: string;
  tags: string[];
};

/** Small helper to build a well-formed opportunity */
function opp(
  id: string,
  category: Category,
  title: string,
  trend: string,
  score: number,
  description: string,
  extras: Partial<Pick<Opportunity, 'competition' | 'potential' | 'timeframe' | 'tags'>> = {}
): Opportunity {
  return {
    id: String(id),
    category,
    title,
    trend,
    score: Number.isFinite(score) ? score : 70,
    competition: extras.competition ?? 'Medium',
    potential: extras.potential ?? 'Medium',
    timeframe: extras.timeframe ?? '2-8 weeks',
    description: description ?? '',
    tags: extras.tags ?? [],
  };
}

/** Generate feed items using external signals; always returns Opportunity[] */
export async function generateOpportunities(
  category: Category,
  profile?: UserProfile
): Promise<Opportunity[]> {
  // if your getSignals is typed, prefer: getSignals(category, profile)
  const signals: any = await getSignals(category, profile);
  const out: Opportunity[] = [];

  // 1) Trends
  for (const t of (signals.trends || []).slice(0, 4)) {
    out.push(
      opp(
        `trend-${t?.id || t?.title || Math.random().toString(36).slice(2)}`,
        category,
        t?.title || 'Emerging topic',
        'Rising Fast',
        80,
        t?.summary || 'Trending topic with strong momentum.',
        { tags: t?.tags || ['Trend'] }
      )
    );
  }

  // 2) Reddit
  const hot = (signals.reddit?.hotDiscussions || []).slice(0, 3);
  const topical = (signals.reddit?.trendingTopics || []).slice(0, 3);
  for (const p of [...hot, ...topical]) {
    const baseScore = typeof p?.score === 'number' ? p.score : 100;
    const score = Math.min(90, 65 + Math.round(baseScore / 50));
    out.push(
      opp(
        `reddit-${p?.id || p?.title || Math.random().toString(36).slice(2)}`,
        category,
        p?.title || 'Community discussion gaining traction',
        'Community Buzz',
        score,
        p?.teaser || 'Conversation with growing engagement.',
        { tags: [p?.subreddit || 'Reddit'] }
      )
    );
  }

  // 3) Stocks (always categorized as 'stocks')
  for (const s of (signals.stocks || []).slice(0, 3)) {
    const change = typeof s?.change === 'number' ? s.change : 0;
    const score = 70 + Math.max(-5, Math.min(10, Math.round(change / 1)));
    out.push(
      opp(
        `stock-${s?.symbol}`,
        'stocks',
        `${s?.sector} momentum via ${s?.symbol}`,
        s?.trend || 'Market Signal',
        score,
        `Sector ETF ${s?.symbol}: ${change}% today. Explore content, dashboards or swing ideas.`,
        { tags: ['Markets', s?.sector, s?.symbol].filter(Boolean) as string[] }
      )
    );
  }

  // 4) Crypto (also in 'stocks' lane)
  for (const c of (signals.crypto || []).slice(0, 3)) {
    const pc = typeof c?.priceChange24h === 'number' ? c.priceChange24h : 0;
    out.push(
      opp(
        `coin-${c?.id}`,
        'stocks',
        `${c?.name} (${c?.symbol}) trend`,
        'Crypto Trending',
        72 + Math.round(pc / 5),
        `Trending coin ranked #${c?.rank ?? '—'} on CoinGecko.`,
        { tags: ['Crypto', c?.symbol].filter(Boolean) as string[] }
      )
    );
  }

  // Fallback
  if (out.length === 0) {
    out.push(
      opp(
        `mock-${Date.now()}`,
        category,
        'AI-Powered Social Media Content Creation Service',
        'Rising Fast',
        75,
        'Offer content services using AI tools to small businesses.',
        { tags: ['AI', 'Content', 'SMB'] }
      )
    );
  }

  return out;
}

export async function generateActionPlan(
  opportunity: Opportunity,
  userProfile?: UserProfile
) {
  return {
    whyMatch:
      `This opportunity matches your ${userProfile?.skill_level || 'current'} level` +
      (userProfile?.time_available ? ` and ${userProfile.time_available} time available.` : '.'),
    actionSteps: [
      'Research demand and competitors for 30–60 minutes.',
      'Define a lightweight MVP or first post/offer.',
      'Publish or ship within 48 hours; collect feedback.',
      'Iterate weekly; track a single metric (leads, views, MRR).',
      'Scale the winning path; cut what doesn’t move the metric.',
    ],
    resources: ['Time commitment', 'Learning resources', 'Platform accounts'],
    metrics: ['Engagement', 'Lead volume', 'Revenue or pipeline'],
    challenges: [{ challenge: 'Overwhelm / analysis-paralysis', solution: 'Reduce scope; ship smallest possible version.' }],
  };
}
