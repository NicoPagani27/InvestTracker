const { neon } = require('@neondatabase/serverless');
require('dotenv').config({ path: '.env.local' });

async function checkESPO() {
  const sql = neon(process.env.DATABASE_URL);
  
  try {
    // Ver inversiones con ESPO
    const investments = await sql`
      SELECT i.*, sp.price as current_price, sp.currency as price_currency, sp.updated_at as price_updated
      FROM investments i
      LEFT JOIN stock_price_cache sp ON sp.symbol = i.symbol
      WHERE i.symbol LIKE '%ESP%'
    `;
    
    console.log('\n📊 Inversiones ESPO:\n');
    
    if (investments.length === 0) {
      console.log('No se encontraron inversiones con ESPO.');
      return;
    }
    
    investments.forEach((inv) => {
      console.log(`Symbol: ${inv.symbol}`);
      console.log(`Name: ${inv.name}`);
      console.log(`Currency (Inversión): ${inv.currency}`);
      console.log(`Currency (Precio Cache): ${inv.price_currency || 'N/A'}`);
      console.log(`Shares: ${inv.shares}`);
      console.log(`Cost per Share: ${inv.cost_per_share}`);
      console.log(`Current Price: ${inv.current_price || 'No cargado'}`);
      console.log(`Exchange Rate at Purchase: ${inv.exchange_rate_at_purchase}`);
      console.log(`Price Updated: ${inv.price_updated || 'Nunca'}`);
      console.log('---');
    });
    
    // Ver tipos de cambio
    console.log('\n💱 Tipos de cambio en cache:\n');
    const exchangeRates = await sql`
      SELECT * FROM exchange_rate_cache
      WHERE from_currency = 'USD'
    `;
    
    exchangeRates.forEach((rate) => {
      console.log(`USD -> ${rate.to_currency}: ${rate.rate}`);
    });
    
    // Probar fetch desde Yahoo Finance
    console.log('\n🔍 Probando símbolos en Yahoo Finance:\n');
    
    const symbolsToTest = [
      'ESP0.DE',
      'ESPO.DE',
    ];
    
    for (const symbol of symbolsToTest) {
      try {
        const response = await fetch(
          `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1d`,
          {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            },
          }
        );
        
        if (response.ok) {
          const data = await response.json();
          const result = data.chart?.result?.[0];
          if (result) {
            const meta = result.meta;
            console.log(`✅ ${symbol}:`);
            console.log(`   Precio: ${meta.regularMarketPrice}`);
            console.log(`   Moneda: ${meta.currency}`);
            console.log(`   Nombre: ${meta.shortName}`);
            console.log('');
          } else {
            console.log(`❌ ${symbol}: Sin datos`);
          }
        } else {
          console.log(`❌ ${symbol}: Error ${response.status}`);
        }
        
        // Delay entre requests
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.log(`❌ ${symbol}: ${error.message}`);
      }
    }
    
    // Calcular market value manualmente
    if (investments.length > 0) {
      const inv = investments[0];
      console.log('\n🧮 Cálculo de Market Value:\n');
      
      const shares = Number(inv.shares);
      const currentPrice = Number(inv.current_price || inv.cost_per_share);
      const currency = inv.currency;
      
      console.log(`Shares: ${shares}`);
      console.log(`Current Price: ${currentPrice} ${inv.price_currency || currency}`);
      console.log(`Currency Investment: ${currency}`);
      
      // Si está en EUR, necesitamos convertir
      const eurRate = exchangeRates.find(r => r.to_currency === 'EUR');
      if (eurRate) {
        console.log(`\nTipo de cambio USD -> EUR: ${eurRate.rate}`);
        console.log(`Tipo de cambio EUR -> USD: ${1 / Number(eurRate.rate)}`);
        
        const marketValueEUR = shares * currentPrice;
        const marketValueUSD = marketValueEUR * (1 / Number(eurRate.rate));
        
        console.log(`\nMarket Value en EUR: ${marketValueEUR.toFixed(2)}`);
        console.log(`Market Value en USD: ${marketValueUSD.toFixed(2)}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkESPO();
