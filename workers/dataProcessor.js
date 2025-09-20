/**
 * Data Processing Web Worker
 * 
 * This worker handles:
 * - Heavy data calculations
 * - Portfolio value calculations
 * - Market data analysis
 * - Chart data processing
 * - Performance metrics calculation
 */

// Worker message handler
self.addEventListener('message', (event) => {
  const { type, data, id } = event.data;
  
  try {
    let result;
    
    switch (type) {
      case 'CALCULATE_PORTFOLIO_VALUE':
        result = calculatePortfolioValue(data);
        break;
        
      case 'PROCESS_MARKET_DATA':
        result = processMarketData(data);
        break;
        
      case 'CALCULATE_PERFORMANCE_METRICS':
        result = calculatePerformanceMetrics(data);
        break;
        
      case 'PROCESS_CHART_DATA':
        result = processChartData(data);
        break;
        
      case 'ANALYZE_STOCK_TRENDS':
        result = analyzeStockTrends(data);
        break;
        
      case 'CALCULATE_RISK_METRICS':
        result = calculateRiskMetrics(data);
        break;
        
      case 'PROCESS_WATCHLIST_ANALYSIS':
        result = processWatchlistAnalysis(data);
        break;
        
      default:
        throw new Error(`Unknown message type: ${type}`);
    }
    
    // Send result back to main thread
    self.postMessage({
      type: 'SUCCESS',
      id,
      result
    });
    
  } catch (error) {
    // Send error back to main thread
    self.postMessage({
      type: 'ERROR',
      id,
      error: {
        message: error.message,
        stack: error.stack
      }
    });
  }
});

/**
 * Calculate portfolio value and performance
 */
function calculatePortfolioValue(data) {
  const { holdings, currentPrices, initialInvestment } = data;
  
  let totalValue = 0;
  let totalCost = 0;
  let totalGainLoss = 0;
  let totalGainLossPercent = 0;
  
  const processedHoldings = holdings.map(holding => {
    const currentPrice = currentPrices[holding.symbol] || holding.currentPrice || 0;
    const currentValue = currentPrice * holding.quantity;
    const costBasis = holding.averagePrice * holding.quantity;
    const gainLoss = currentValue - costBasis;
    const gainLossPercent = costBasis > 0 ? (gainLoss / costBasis) * 100 : 0;
    
    totalValue += currentValue;
    totalCost += costBasis;
    totalGainLoss += gainLoss;
    
    return {
      ...holding,
      currentPrice,
      currentValue,
      costBasis,
      gainLoss,
      gainLossPercent
    };
  });
  
  totalGainLossPercent = totalCost > 0 ? (totalGainLoss / totalCost) * 100 : 0;
  
  return {
    holdings: processedHoldings,
    summary: {
      totalValue,
      totalCost,
      totalGainLoss,
      totalGainLossPercent,
      totalReturn: initialInvestment > 0 ? ((totalValue - initialInvestment) / initialInvestment) * 100 : 0
    }
  };
}

/**
 * Process market data for analysis
 */
function processMarketData(data) {
  const { stocks, timeRange = '1d' } = data;
  
  // Calculate market statistics
  const totalStocks = stocks.length;
  const gainers = stocks.filter(stock => (stock.changePercent || 0) > 0).length;
  const losers = stocks.filter(stock => (stock.changePercent || 0) < 0).length;
  const unchanged = totalStocks - gainers - losers;
  
  // Calculate average change
  const totalChange = stocks.reduce((sum, stock) => sum + (stock.changePercent || 0), 0);
  const averageChange = totalStocks > 0 ? totalChange / totalStocks : 0;
  
  // Calculate volume statistics
  const totalVolume = stocks.reduce((sum, stock) => sum + (stock.volume || 0), 0);
  const averageVolume = totalStocks > 0 ? totalVolume / totalStocks : 0;
  
  // Find top performers
  const topGainers = stocks
    .filter(stock => (stock.changePercent || 0) > 0)
    .sort((a, b) => (b.changePercent || 0) - (a.changePercent || 0))
    .slice(0, 10);
    
  const topLosers = stocks
    .filter(stock => (stock.changePercent || 0) < 0)
    .sort((a, b) => (a.changePercent || 0) - (b.changePercent || 0))
    .slice(0, 10);
  
  return {
    statistics: {
      totalStocks,
      gainers,
      losers,
      unchanged,
      averageChange,
      totalVolume,
      averageVolume
    },
    topPerformers: {
      gainers: topGainers,
      losers: topLosers
    },
    marketSentiment: calculateMarketSentiment(gainers, losers, totalStocks)
  };
}

/**
 * Calculate performance metrics
 */
function calculatePerformanceMetrics(data) {
  const { trades, portfolio, timeRange = '1y' } = data;
  
  // Calculate trading metrics
  const totalTrades = trades.length;
  const winningTrades = trades.filter(trade => trade.gainLoss > 0).length;
  const losingTrades = trades.filter(trade => trade.gainLoss < 0).length;
  const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;
  
  // Calculate profit/loss
  const totalProfit = trades.reduce((sum, trade) => sum + (trade.gainLoss || 0), 0);
  const averageProfit = winningTrades > 0 ? 
    trades.filter(trade => trade.gainLoss > 0).reduce((sum, trade) => sum + trade.gainLoss, 0) / winningTrades : 0;
  const averageLoss = losingTrades > 0 ? 
    trades.filter(trade => trade.gainLoss < 0).reduce((sum, trade) => sum + trade.gainLoss, 0) / losingTrades : 0;
  
  // Calculate Sharpe ratio (simplified)
  const returns = trades.map(trade => trade.gainLoss || 0);
  const averageReturn = returns.length > 0 ? returns.reduce((sum, ret) => sum + ret, 0) / returns.length : 0;
  const variance = returns.length > 1 ? 
    returns.reduce((sum, ret) => sum + Math.pow(ret - averageReturn, 2), 0) / (returns.length - 1) : 0;
  const standardDeviation = Math.sqrt(variance);
  const sharpeRatio = standardDeviation > 0 ? averageReturn / standardDeviation : 0;
  
  return {
    trading: {
      totalTrades,
      winningTrades,
      losingTrades,
      winRate,
      totalProfit,
      averageProfit,
      averageLoss
    },
    risk: {
      sharpeRatio,
      standardDeviation,
      variance,
      maxDrawdown: calculateMaxDrawdown(returns)
    },
    portfolio: {
      totalValue: portfolio.totalValue || 0,
      totalReturn: portfolio.totalReturn || 0,
      annualizedReturn: calculateAnnualizedReturn(portfolio, timeRange)
    }
  };
}

/**
 * Process chart data for visualization
 */
function processChartData(data) {
  const { rawData, chartType = 'line', timeRange = '1d' } = data;
  
  // Sort data by timestamp
  const sortedData = rawData.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  
  // Calculate moving averages
  const movingAverages = calculateMovingAverages(sortedData, [5, 10, 20]);
  
  // Calculate technical indicators
  const rsi = calculateRSI(sortedData);
  const macd = calculateMACD(sortedData);
  
  // Prepare chart data
  const chartData = sortedData.map((point, index) => ({
    timestamp: point.timestamp,
    value: point.value || point.price,
    volume: point.volume || 0,
    movingAverage5: movingAverages[5]?.[index],
    movingAverage10: movingAverages[10]?.[index],
    movingAverage20: movingAverages[20]?.[index],
    rsi: rsi[index],
    macd: macd[index]
  }));
  
  return {
    chartData,
    indicators: {
      rsi: rsi[rsi.length - 1],
      macd: macd[macd.length - 1],
      movingAverages: {
        ma5: movingAverages[5]?.[movingAverages[5].length - 1],
        ma10: movingAverages[10]?.[movingAverages[10].length - 1],
        ma20: movingAverages[20]?.[movingAverages[20].length - 1]
      }
    }
  };
}

/**
 * Analyze stock trends
 */
function analyzeStockTrends(data) {
  const { stocks, timeRange = '1d' } = data;
  
  const trends = stocks.map(stock => {
    const changePercent = stock.changePercent || 0;
    const volume = stock.volume || 0;
    
    // Determine trend direction
    let trend = 'neutral';
    if (changePercent > 2) trend = 'strong_bullish';
    else if (changePercent > 0.5) trend = 'bullish';
    else if (changePercent < -2) trend = 'strong_bearish';
    else if (changePercent < -0.5) trend = 'bearish';
    
    // Calculate momentum
    const momentum = calculateMomentum(stock);
    
    return {
      ...stock,
      trend,
      momentum,
      volumeAnalysis: analyzeVolume(volume, stock.averageVolume)
    };
  });
  
  return {
    trends,
    summary: {
      bullish: trends.filter(t => t.trend.includes('bull')).length,
      bearish: trends.filter(t => t.trend.includes('bear')).length,
      neutral: trends.filter(t => t.trend === 'neutral').length
    }
  };
}

/**
 * Calculate risk metrics
 */
function calculateRiskMetrics(data) {
  const { portfolio, marketData, timeRange = '1y' } = data;
  
  // Calculate portfolio volatility
  const returns = portfolio.returns || [];
  const volatility = calculateVolatility(returns);
  
  // Calculate beta (simplified)
  const beta = calculateBeta(portfolio.returns, marketData.returns);
  
  // Calculate Value at Risk (VaR)
  const var95 = calculateVaR(returns, 0.95);
  const var99 = calculateVaR(returns, 0.99);
  
  // Calculate maximum drawdown
  const maxDrawdown = calculateMaxDrawdown(returns);
  
  return {
    volatility,
    beta,
    var95,
    var99,
    maxDrawdown,
    riskLevel: assessRiskLevel(volatility, maxDrawdown)
  };
}

/**
 * Process watchlist analysis
 */
function processWatchlistAnalysis(data) {
  const { watchlist, marketData } = data;
  
  const analysis = watchlist.map(item => {
    const stock = marketData.find(s => s.symbol === item.symbol);
    if (!stock) return null;
    
    const changePercent = stock.changePercent || 0;
    const volume = stock.volume || 0;
    
    // Calculate alerts
    const alerts = [];
    if (changePercent > 5) alerts.push('high_gain');
    if (changePercent < -5) alerts.push('high_loss');
    if (volume > (stock.averageVolume || 0) * 2) alerts.push('high_volume');
    
    return {
      ...item,
      currentPrice: stock.price,
      changePercent,
      volume,
      alerts,
      recommendation: generateRecommendation(stock, item)
    };
  }).filter(Boolean);
  
  return {
    items: analysis,
    summary: {
      totalItems: analysis.length,
      highGainers: analysis.filter(item => item.changePercent > 5).length,
      highLosers: analysis.filter(item => item.changePercent < -5).length,
      alerts: analysis.reduce((sum, item) => sum + item.alerts.length, 0)
    }
  };
}

// Helper functions

function calculateMarketSentiment(gainers, losers, total) {
  const ratio = total > 0 ? gainers / total : 0;
  if (ratio > 0.6) return 'very_bullish';
  if (ratio > 0.4) return 'bullish';
  if (ratio < 0.4) return 'bearish';
  return 'neutral';
}

function calculateMovingAverages(data, periods) {
  const result = {};
  
  periods.forEach(period => {
    result[period] = [];
    for (let i = 0; i < data.length; i++) {
      if (i < period - 1) {
        result[period].push(null);
      } else {
        const sum = data.slice(i - period + 1, i + 1)
          .reduce((acc, point) => acc + (point.value || point.price), 0);
        result[period].push(sum / period);
      }
    }
  });
  
  return result;
}

function calculateRSI(data, period = 14) {
  const rsi = [];
  const gains = [];
  const losses = [];
  
  for (let i = 1; i < data.length; i++) {
    const change = (data[i].value || data[i].price) - (data[i-1].value || data[i-1].price);
    gains.push(change > 0 ? change : 0);
    losses.push(change < 0 ? Math.abs(change) : 0);
  }
  
  for (let i = period - 1; i < gains.length; i++) {
    const avgGain = gains.slice(i - period + 1, i + 1).reduce((sum, gain) => sum + gain, 0) / period;
    const avgLoss = losses.slice(i - period + 1, i + 1).reduce((sum, loss) => sum + loss, 0) / period;
    
    if (avgLoss === 0) {
      rsi.push(100);
    } else {
      const rs = avgGain / avgLoss;
      rsi.push(100 - (100 / (1 + rs)));
    }
  }
  
  return rsi;
}

function calculateMACD(data, fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) {
  // Simplified MACD calculation
  const ema12 = calculateEMA(data, fastPeriod);
  const ema26 = calculateEMA(data, slowPeriod);
  
  const macd = ema12.map((value, index) => value - ema26[index]);
  const signal = calculateEMA(macd.map((value, index) => ({ value, timestamp: data[index]?.timestamp })), signalPeriod);
  
  return macd.map((value, index) => ({
    macd: value,
    signal: signal[index],
    histogram: value - signal[index]
  }));
}

function calculateEMA(data, period) {
  const ema = [];
  const multiplier = 2 / (period + 1);
  
  for (let i = 0; i < data.length; i++) {
    if (i === 0) {
      ema.push(data[i].value || data[i].price);
    } else {
      ema.push((data[i].value || data[i].price) * multiplier + ema[i-1] * (1 - multiplier));
    }
  }
  
  return ema;
}

function calculateMomentum(stock) {
  const change = stock.changePercent || 0;
  const volume = stock.volume || 0;
  const averageVolume = stock.averageVolume || 1;
  
  return {
    price: change,
    volume: (volume / averageVolume) * 100,
    combined: (change * 0.7) + ((volume / averageVolume) * 30)
  };
}

function analyzeVolume(currentVolume, averageVolume) {
  if (!averageVolume) return 'unknown';
  
  const ratio = currentVolume / averageVolume;
  if (ratio > 2) return 'very_high';
  if (ratio > 1.5) return 'high';
  if (ratio < 0.5) return 'low';
  return 'normal';
}

function calculateVolatility(returns) {
  if (returns.length < 2) return 0;
  
  const mean = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
  const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - mean, 2), 0) / (returns.length - 1);
  
  return Math.sqrt(variance);
}

function calculateBeta(portfolioReturns, marketReturns) {
  if (portfolioReturns.length !== marketReturns.length || portfolioReturns.length < 2) return 1;
  
  const portfolioMean = portfolioReturns.reduce((sum, ret) => sum + ret, 0) / portfolioReturns.length;
  const marketMean = marketReturns.reduce((sum, ret) => sum + ret, 0) / marketReturns.length;
  
  let covariance = 0;
  let marketVariance = 0;
  
  for (let i = 0; i < portfolioReturns.length; i++) {
    covariance += (portfolioReturns[i] - portfolioMean) * (marketReturns[i] - marketMean);
    marketVariance += Math.pow(marketReturns[i] - marketMean, 2);
  }
  
  return marketVariance > 0 ? covariance / marketVariance : 1;
}

function calculateVaR(returns, confidence) {
  if (returns.length === 0) return 0;
  
  const sortedReturns = [...returns].sort((a, b) => a - b);
  const index = Math.floor((1 - confidence) * sortedReturns.length);
  
  return sortedReturns[index] || 0;
}

function calculateMaxDrawdown(returns) {
  if (returns.length === 0) return 0;
  
  let peak = 0;
  let maxDrawdown = 0;
  let runningSum = 0;
  
  for (const ret of returns) {
    runningSum += ret;
    if (runningSum > peak) {
      peak = runningSum;
    }
    const drawdown = peak - runningSum;
    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown;
    }
  }
  
  return maxDrawdown;
}

function calculateAnnualizedReturn(portfolio, timeRange) {
  // Simplified calculation
  const totalReturn = portfolio.totalReturn || 0;
  const timeMultiplier = getTimeMultiplier(timeRange);
  
  return totalReturn * timeMultiplier;
}

function getTimeMultiplier(timeRange) {
  const multipliers = {
    '1d': 365,
    '1w': 52,
    '1m': 12,
    '3m': 4,
    '6m': 2,
    '1y': 1
  };
  
  return multipliers[timeRange] || 1;
}

function assessRiskLevel(volatility, maxDrawdown) {
  const riskScore = (volatility * 0.6) + (maxDrawdown * 0.4);
  
  if (riskScore > 20) return 'high';
  if (riskScore > 10) return 'medium';
  return 'low';
}

function generateRecommendation(stock, watchlistItem) {
  const changePercent = stock.changePercent || 0;
  const volume = stock.volume || 0;
  const averageVolume = stock.averageVolume || 1;
  
  if (changePercent > 5 && volume > averageVolume * 1.5) return 'strong_buy';
  if (changePercent > 2) return 'buy';
  if (changePercent < -5 && volume > averageVolume * 1.5) return 'strong_sell';
  if (changePercent < -2) return 'sell';
  return 'hold';
}

console.log('Data Processor Worker loaded successfully');
