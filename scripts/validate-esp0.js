const { neon } = require('@neondatabase/serverless');
require('dotenv').config({ path: '.env.local' });

async function validateESP0Calculation() {
  const sql = neon(process.env.DATABASE_URL);
  
  try {
    console.log('\n🔍 Validando cálculo de ESP0.DE\n');
    
    // Obtener el precio directo de Yahoo Finance
    const response = await fetch(
      'https://query1.finance.yahoo.com/v8/finance/chart/ESP0.DE?interval=1d&range=1d',
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      }
    );
    
    if (!response.ok) {
      console.log('❌ No se pudo obtener datos de Yahoo Finance');
      return;
    }
    
    const data = await response.json();
    const result = data.chart?.result?.[0];
    
    if (!result) {
      console.log('❌ No hay datos en la respuesta');
      return;
    }
    
    const meta = result.meta;
    const yahooPrice = meta.regularMarketPrice;
    const yahooCurrency = meta.currency;
    
    console.log('📊 Datos de Yahoo Finance:');
    console.log(`   Precio: ${yahooPrice} ${yahooCurrency}`);
    console.log(`   Precisión completa: ${yahooPrice}`);
    
    // Obtener datos de la BD
    const investment = await sql`
      SELECT * FROM investments WHERE symbol = 'ESP0.DE'
    `;
    
    if (investment.length === 0) {
      console.log('❌ No se encontró ESP0.DE en BD');
      return;
    }
    
    const inv = investment[0];
    const shares = Number(inv.shares);
    
    console.log(`\n📝 Datos de tu inversión:`);
    console.log(`   Shares: ${shares}`);
    console.log(`   Currency: ${inv.currency}`);
    
    // Obtener tipo de cambio
    const eurRate = await sql`
      SELECT * FROM exchange_rate_cache
      WHERE from_currency = 'USD' AND to_currency = 'EUR'
    `;
    
    if (eurRate.length === 0) {
      console.log('❌ No hay tipo de cambio EUR en cache');
      return;
    }
    
    const usdToEur = Number(eurRate[0].rate);
    const eurToUsd = 1 / usdToEur;
    
    console.log(`\n💱 Tipo de cambio:`);
    console.log(`   USD -> EUR: ${usdToEur}`);
    console.log(`   EUR -> USD: ${eurToUsd}`);
    console.log(`   EUR -> USD (6 decimales): ${eurToUsd.toFixed(6)}`);
    
    // Calcular market value
    const marketValueEUR = shares * yahooPrice;
    const marketValueUSD = marketValueEUR * eurToUsd;
    
    console.log(`\n🧮 Cálculos:`);
    console.log(`   Market Value EUR: ${shares} × ${yahooPrice} = ${marketValueEUR}`);
    console.log(`   Market Value USD: ${marketValueEUR} × ${eurToUsd.toFixed(6)} = ${marketValueUSD}`);
    console.log(`   Market Value USD (2 decimales): ${marketValueUSD.toFixed(2)}`);
    console.log(`   Market Value USD (4 decimales): ${marketValueUSD.toFixed(4)}`);
    
    // Actualizar el precio en cache con máxima precisión
    console.log(`\n🔄 Actualizando cache con precio exacto...`);
    
    await sql`
      INSERT INTO stock_price_cache (symbol, price, previous_close, change_amount, change_percent, currency, name, updated_at)
      VALUES ('ESP0.DE', ${yahooPrice}, ${meta.previousClose || yahooPrice}, ${yahooPrice - (meta.previousClose || yahooPrice)}, ${((yahooPrice - (meta.previousClose || yahooPrice)) / (meta.previousClose || yahooPrice)) * 100}, ${yahooCurrency}, ${meta.shortName}, NOW())
      ON CONFLICT (symbol) DO UPDATE SET
        price = EXCLUDED.price,
        previous_close = EXCLUDED.previous_close,
        change_amount = EXCLUDED.change_amount,
        change_percent = EXCLUDED.change_percent,
        currency = EXCLUDED.currency,
        name = EXCLUDED.name,
        updated_at = NOW()
    `;
    
    console.log(`✅ Cache actualizado`);
    
    console.log(`\n📌 Para verificar en Yahoo Finance:`);
    console.log(`   https://finance.yahoo.com/quote/ESP0.DE`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

validateESP0Calculation();
