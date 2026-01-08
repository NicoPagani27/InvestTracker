-- Investment Tracker Database Schema

-- Users table (extends neon_auth.users_sync)
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  preferred_currency TEXT DEFAULT 'USD',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Watchlists table
CREATE TABLE IF NOT EXISTS watchlists (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Mi Portafolio',
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Investments/Holdings table
CREATE TABLE IF NOT EXISTS investments (
  id SERIAL PRIMARY KEY,
  watchlist_id INTEGER NOT NULL REFERENCES watchlists(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL,
  name TEXT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  shares DECIMAL(18, 8) NOT NULL,
  cost_per_share DECIMAL(18, 4) NOT NULL,
  exchange_rate_at_purchase DECIMAL(18, 6) DEFAULT 1,
  trade_date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trade history table
CREATE TABLE IF NOT EXISTS trades (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  watchlist_id INTEGER REFERENCES watchlists(id) ON DELETE SET NULL,
  symbol TEXT NOT NULL,
  name TEXT NOT NULL,
  trade_type TEXT NOT NULL CHECK (trade_type IN ('BUY', 'SELL')),
  shares DECIMAL(18, 8) NOT NULL,
  price_per_share DECIMAL(18, 4) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  exchange_rate DECIMAL(18, 6) DEFAULT 1,
  total_value DECIMAL(18, 4) NOT NULL,
  trade_date TIMESTAMP WITH TIME ZONE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Cache table for stock prices
CREATE TABLE IF NOT EXISTS stock_price_cache (
  symbol TEXT PRIMARY KEY,
  price DECIMAL(18, 4) NOT NULL,
  previous_close DECIMAL(18, 4),
  change_amount DECIMAL(18, 4),
  change_percent DECIMAL(10, 4),
  currency TEXT NOT NULL DEFAULT 'USD',
  market_cap DECIMAL(24, 2),
  name TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Cache table for exchange rates
CREATE TABLE IF NOT EXISTS exchange_rate_cache (
  from_currency TEXT NOT NULL,
  to_currency TEXT NOT NULL,
  rate DECIMAL(18, 6) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (from_currency, to_currency)
);

-- User sessions table for authentication
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_investments_watchlist ON investments(watchlist_id);
CREATE INDEX IF NOT EXISTS idx_investments_symbol ON investments(symbol);
CREATE INDEX IF NOT EXISTS idx_trades_user ON trades(user_id);
CREATE INDEX IF NOT EXISTS idx_trades_symbol ON trades(symbol);
CREATE INDEX IF NOT EXISTS idx_watchlists_user ON watchlists(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);
