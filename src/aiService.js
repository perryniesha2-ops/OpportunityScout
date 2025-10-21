import Anthropic from '@anthropic-ai/sdk';
import { CONFIG } from './config';
import { getTrendingCrypto, getTrendingStocks } from './marketService';



const anthropic = new Anthropic({
  apiKey: CONFIG.ANTHROPIC_API_KEY,
  dangerouslyAllowBrowser: true,
});


// Generate opportunities with real trend data
export const generateOpportunities = async (category, userProfile) => {
  try {
    // Fetch real market data for stocks
    let trendData = '';
    
    if (category === 'stocks') {
      try {
        const [cryptoTrends, stockTrends] = await Promise.all([
          getTrendingCrypto(),
          getTrendingStocks(),
        ]);
        
        if (cryptoTrends.length > 0) {
          trendData += `\n\nTrending Cryptocurrencies:\n${cryptoTrends.slice(0, 3).map(c => 
            `- ${c.name} (${c.symbol}): ${c.priceChange24h > 0 ? '+' : ''}${c.priceChange24h.toFixed(2)}% (24h)`
          ).join('\n')}`;
        }
        
        if (stockTrends.length > 0) {
          trendData += `\n\nSector Performance:\n${stockTrends.map(s => 
            `- ${s.sector}: ${s.change > 0 ? '+' : ''}${s.change.toFixed(2)}%`
          ).join('\n')}`;
        }
      } catch (error) {
        console.error('Error fetching market data:', error);
      }
    }

    const categoryPrompts = {
      social: `Generate 3 trending social media content opportunities. ${trendData ? 'Use the trending data below:' + trendData : 'Focus on current late-2024/early-2025 trends.'}

For each opportunity, provide:
- Title (concise, specific idea based on real trends)
- Description (2-3 sentences explaining the opportunity and why it's trending NOW)
- Trend status (Rising Fast, Steady Growth, or Exploding)
- Competition level (Low, Medium, or High)
- Potential reach/earnings (Low, Medium, High, or Very High)
- Timeframe to capitalize (1-2 weeks, 2-4 weeks, 1-3 months)
- 3 relevant tags

User profile:
- Skill level: ${userProfile?.skill_level || 'beginner'}
- Time available: ${userProfile?.time_available || 'casual'}

IMPORTANT: Base opportunities on the actual trending topics above. Make them specific and actionable.

Format as JSON array with keys: title, description, trend, competition, potential, timeframe, tags`,

      hobbies: `Generate 3 hobby opportunities based on emerging trends in late-2024/early-2025. Focus on activities gaining popularity.

For each opportunity, provide:
- Title (specific hobby or niche based on real trends)
- Description (2-3 sentences about the hobby and why it's trending)
- Trend status (Rising Fast, Steady Growth, or Exploding)
- Competition level (Low, Medium, or High)
- Potential (Low, Medium, High, or Very High)
- Timeframe (2-4 weeks, 1-3 months, 3-6 months, 6-12 months)
- 3 relevant tags

User profile:
- Skill level: ${userProfile?.skill_level || 'beginner'}
- Time available: ${userProfile?.time_available || 'casual'}

Format as JSON array.`,

      business: `Generate 3 business/side hustle opportunities based on current market demand in late-2024/early-2025.

For each opportunity, provide:
- Title (specific business idea)
- Description (2-3 sentences about opportunity and current market demand)
- Trend status (Rising Fast, Steady Growth, or Exploding)
- Competition level (Low, Medium, or High)
- Potential earnings (Low, Medium, High, or Very High)
- Timeframe to launch (1-2 weeks, 2-4 weeks, 1-3 months)
- 3 relevant tags

User profile:
- Skill level: ${userProfile?.skill_level || 'beginner'}
- Time available: ${userProfile?.time_available || 'casual'}

Format as JSON array.`,

      stocks: `Generate 3 investment opportunities based on REAL current market data and trends. Use the actual market data provided below.${trendData}

For each opportunity, provide:
- Title (specific investment category or sector)
- Description (2-3 sentences about why this is an opportunity based on real data)
- Trend status (Rising Interest, Steady Growth, or High Momentum)
- Competition level (Low, Medium, or High)
- Potential returns (Low, Medium, High, or Very High)
- Timeframe (Short-term: 1-3 months, Medium-term: 3-6 months, Long-term: 6-12 months)
- 3 relevant tags

User profile:
- Skill level: ${userProfile?.skill_level || 'beginner'}
- Time available: ${userProfile?.time_available || 'casual'}

IMPORTANT: Base recommendations on the actual market data above. Be specific about sectors, cryptocurrencies, or ETFs.

Format as JSON array.`,
    };

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2500,
      messages: [
        {
          role: 'user',
          content: categoryPrompts[category] || categoryPrompts.social,
        },
      ],
    });

    const responseText = message.content[0].text;
    const jsonMatch = responseText.match(/\[[\s\S]*\]/);
    
    if (!jsonMatch) {
      throw new Error('Could not parse AI response');
    }

    const opportunities = JSON.parse(jsonMatch[0]);
    
    // Enhance opportunities - skip keyword trend analysis (doesn't work in browser)
    const enhancedOpportunities = opportunities.map((opp, index) => ({
      id: `ai-${category}-${Date.now()}-${index}`,
      category,
      title: opp.title || opp.Title,
      description: opp.description || opp.Description,
      trend: opp.trend || opp['Trend status'] || 'Rising Fast',
      competition: opp.competition || opp['Competition level'] || 'Medium',
      potential: opp.potential || opp['Potential reach/earnings'] || opp['Potential earnings'] || opp['Potential returns'] || 'Medium',
      timeframe: opp.timeframe || opp.Timeframe || '2-4 weeks',
      tags: opp.tags || opp.Tags || ['Trending', 'New', 'Opportunity'],
      score: calculateScore(opp, userProfile, null),
      trendData: null,
    }));

    return enhancedOpportunities;
  } catch (error) {
    console.error('Error generating opportunities:', error);
    throw error;
  }
};

// Enhanced scoring with real trend data
function calculateScore(opportunity, userProfile, trendAnalysis) {
  let score = 60; // Base score

  // Boost based on trend status
  const trendBoost = {
    'Exploding': 20,
    'Rising Fast': 15,
    'Steady Growth': 10,
    'Rising Interest': 12,
    'High Momentum': 18,
  };
  score += trendBoost[opportunity.trend || opportunity['Trend status']] || 10;

  // REAL trend data boost
  if (trendAnalysis) {
    if (trendAnalysis.trend === 'exploding') score += 15;
    else if (trendAnalysis.trend === 'rising_fast') score += 10;
    else if (trendAnalysis.trend === 'steady_growth') score += 5;
    else if (trendAnalysis.trend === 'declining') score -= 10;

    // Growth percentage boost
    if (trendAnalysis.growth > 100) score += 10;
    else if (trendAnalysis.growth > 50) score += 7;
    else if (trendAnalysis.growth > 25) score += 5;
  }

  // Competition adjustment
  const competitionBoost = {
    'Low': 15,
    'Medium': 5,
    'High': -5,
  };
  score += competitionBoost[opportunity.competition || opportunity['Competition level']] || 0;

  // Potential boost
  const potentialBoost = {
    'Very High': 15,
    'High': 10,
    'Medium': 5,
    'Low': 0,
  };
  const potential = opportunity.potential || opportunity['Potential reach/earnings'] || 
                    opportunity['Potential earnings'] || opportunity['Potential returns'];
  score += potentialBoost[potential] || 5;

  // User profile matching
  if (userProfile?.skill_level === 'beginner') {
    if ((opportunity.competition || opportunity['Competition level']) === 'Low') {
      score += 5;
    }
  } else if (userProfile?.skill_level === 'expert') {
    if ((opportunity.competition || opportunity['Competition level']) === 'High') {
      score += 3; // Experts can handle competition
    }
  }

  // Time commitment matching
  if (userProfile?.time_available === 'casual') {
    const timeframe = opportunity.timeframe || opportunity.Timeframe || '';
    if (timeframe.includes('1-2 weeks')) score += 5;
  }

  return Math.min(score, 100);
}

// Generate detailed action plan (unchanged)
export const generateActionPlan = async (opportunity, userProfile) => {
  const trendInfo = opportunity.trendData ? 
    `\n\nReal trend data: ${opportunity.trendData.trend} trend with ${opportunity.trendData.growth}% growth over 90 days.` : '';

  const prompt = `You are a strategic advisor helping someone capitalize on an opportunity. 

Opportunity: ${opportunity.title}
Description: ${opportunity.description}
Category: ${opportunity.category}
User's skill level: ${userProfile?.skill_level || 'beginner'}
User's available time: ${userProfile?.time_available || 'casual'}${trendInfo}

Provide a detailed action plan with:
1. "Why This Matches You" - 2-3 sentences explaining why this opportunity is perfect for them based on their profile and the trend data
2. "Action Steps" - 5-7 specific, actionable steps they can take (as an array of strings)
3. "Resources Needed" - List of tools, platforms, or resources (as an array of strings)
4. "Success Metrics" - How to measure progress (as an array of strings)
5. "Potential Challenges" - 2-3 challenges with solutions (as an array of objects with 'challenge' and 'solution' keys)

Format as JSON with these exact keys: whyMatch, actionSteps, resources, metrics, challenges.`;

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    });

    const responseText = message.content[0].text;
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      throw new Error('Could not parse action plan');
    }

    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error('Error generating action plan:', error);
    throw error;
  }
};