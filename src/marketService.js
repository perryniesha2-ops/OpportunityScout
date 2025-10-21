// Using Alpha Vantage for stock data (free tier: 5 calls/min, 500 calls/day)
// Get free API key at: https://www.alphavantage.co/support/#api-key


const ALPHA_VANTAGE_KEY =  process.env.EXPO_PUBLIC_ALPHA_VANTAGE_KEY;
const COINGECKO_API = 'https://api.coingecko.com/api/v3';

// Get trending stocks by sector
export const getTrendingStocks = async () => {
  try {
    // Top performing sectors
    const sectors = [
      { name: 'Technology', symbol: 'XLK' },
      { name: 'Healthcare', symbol: 'XLV' },
      { name: 'Financials', symbol: 'XLF' },
      { name: 'Consumer Discretionary', symbol: 'XLY' },
      { name: 'Energy', symbol: 'XLE' },
    ];

    const trendingStocks = [];

    for (const sector of sectors) {
      try {
        const response = await fetch(
          `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${sector.symbol}&apikey=${ALPHA_VANTAGE_KEY}`
        );
        const data = await response.json();

        if (data['Global Quote']) {
          const quote = data['Global Quote'];
          const changePercent = parseFloat(quote['10. change percent']?.replace('%', '') || 0);

          trendingStocks.push({
            sector: sector.name,
            symbol: sector.symbol,
            price: quote['05. price'],
            change: changePercent,
            trend: changePercent > 2 ? 'Rising' : changePercent < -2 ? 'Falling' : 'Stable',
          });
        }

        // Rate limit: wait 12 seconds between calls (5 calls/min)
        await new Promise(resolve => setTimeout(resolve, 12000));
      } catch (error) {
        console.error(`Error fetching ${sector.name}:`, error);
      }
    }

    return trendingStocks;
  } catch (error) {
    console.error('Error fetching stocks:', error);
    return [];
  }
};

// Get trending cryptocurrencies
export const getTrendingCrypto = async () => {
  try {
    const response = await fetch(`${COINGECKO_API}/search/trending`);
    const data = await response.json();

    return data.coins.slice(0, 10).map(coin => ({
      id: coin.item.id,
      name: coin.item.name,
      symbol: coin.item.symbol,
      rank: coin.item.market_cap_rank,
      priceChange24h: coin.item.data?.price_change_percentage_24h?.usd || 0,
      trend: 'Rising', // All trending coins are rising by definition
    }));
  } catch (error) {
    console.error('Error fetching crypto:', error);
    return [];
  }
};

// Get market sentiment for crypto
export const getCryptoSentiment = async (coinId) => {
  try {
    const response = await fetch(`${COINGECKO_API}/coins/${coinId}?localization=false`);
    const data = await response.json();

    const sentimentUp = data.sentiment_votes_up_percentage || 50;
    const sentimentDown = data.sentiment_votes_down_percentage || 50;

    return {
      bullish: sentimentUp,
      bearish: sentimentDown,
      sentiment: sentimentUp > 60 ? 'Very Bullish' : sentimentUp > 50 ? 'Bullish' : 'Bearish',
    };
  } catch (error) {
    console.error('Error fetching sentiment:', error);
    return { bullish: 50, bearish: 50, sentiment: 'Neutral' };
  }
};