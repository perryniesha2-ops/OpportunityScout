// Simplified trends service without google-trends-api
// For production, you'd want to call these from a backend API

// Mock trending topics based on category (until you build a backend)
export const getTrendingTopics = async (category) => {
  // In production, this would call your backend which uses Google Trends
  // For now, return empty array (Claude AI will generate relevant trends)
  console.log('Trending topics - using AI knowledge instead');
  return [];
};

export const getKeywordTrend = async (keyword) => {
  // In production, call your backend
  return { trend: 'stable', growth: 0 };
};

export const analyzeCompetition = (traffic) => {
  const value = traffic.replace(/[^0-9.]/g, '');
  const multiplier = traffic.includes('M') ? 1000000 : traffic.includes('K') ? 1000 : 1;
  const searchVolume = parseFloat(value) * multiplier;

  if (searchVolume > 1000000) return 'High';
  if (searchVolume > 100000) return 'Medium';
  return 'Low';
};