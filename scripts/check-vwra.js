const { neon } = require('@neondatabase/serverless');
require('dotenv').config({ path: '.env.local' });

async function checkVWRA() {
  const sql = neon(process.env.DATABASE_URL);
  
  try {
    // Ver inversiones con VWRA
    const investments = await sql`
      SELECT i.*, sp.price as current_price, sp.updated_at as price_updated
      FROM investments i
      LEFT JOIN stock_price_cache sp ON sp.symbol = i.symbol
      WHERE i.symbol LIKE '%VWRA%'
    `;
    
    console.log('\n📊 Inversiones VWRA:\n');
    
    if (investments.length === 0) {
      console.log('No se encontraron inversiones con VWRA.');
      return;
    }
    
    investments.forEach((inv) => {
      console.log(`Symbol: ${inv.symbol}`);
      console.log(`Name: ${inv.name}`);
      console.log(`Currency: ${inv.currency}`);
      console.log(`Current Price: ${inv.current_price || 'No cargado'}`);
      console.log(`Price Updated: ${inv.price_updated || 'Nunca'}`);
      console.log(`Cost per Share: ${inv.cost_per_share}`);
      console.log('---');
    });
    
    // Probar fetch desde Yahoo Finance
    console.log('\n🔍 Probando símbolos en Yahoo Finance:\n');
    
    const symbolsToTest = [
      'VWRA',
      'VWRA.L',
      'VWRA.AS',
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
            console.log(`✅ ${symbol}: ${result.meta.regularMarketPrice} ${result.meta.currency}`);
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
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkVWRA();
