
// Note: For production, you'll need Reddit API credentials
// For now, we'll use a public read-only approach or fallback data

// Get trending posts from relevant subreddits
export const getTrendingFromReddit = async (category) => {
  try {
    const subredditMap = {
      social: ['socialmedia', 'content_marketing', 'NewTubers', 'SmallYTChannel'],
      hobbies: ['hobbies', 'findareddit', 'LearnUselessTalents', 'IWantToLearn'],
      business: ['Entrepreneur', 'smallbusiness', 'sidehustle', 'passive_income'],
      stocks: ['investing', 'stocks', 'cryptocurrency', 'wallstreetbets'],
    };

    const subreddits = subredditMap[category] || subredditMap.social;

    // Placeholder - In production, use Snoowrap with credentials
    // For now, return structure for fallback
    return {
      subreddits,
      trendingTopics: [],
      hotDiscussions: [],
    };
  } catch (error) {
    console.error('Error fetching from Reddit:', error);
    return { subreddits: [], trendingTopics: [], hotDiscussions: [] };
  }
};

// Analyze Reddit post engagement
export const analyzeEngagement = (post) => {
  const score = post.score || 0;
  const comments = post.num_comments || 0;
  const ratio = comments > 0 ? score / comments : score;

  if (ratio > 10 && score > 1000) return 'Very High';
  if (ratio > 5 && score > 500) return 'High';
  if (score > 100) return 'Medium';
  return 'Low';
};