const { neon } = require('@neondatabase/serverless');
require('dotenv').config({ path: '.env.local' });

async function fixVWRA() {
  const sql = neon(process.env.DATABASE_URL);
  
  try {
    console.log('🔧 Actualizando símbolo VWRA a VWRA.L...\n');
    
    // Actualizar en investments
    const updatedInvestments = await sql`
      UPDATE investments
      SET symbol = 'VWRA.L'
      WHERE symbol = 'VWRA'
      RETURNING *
    `;
    
    console.log(`✅ ${updatedInvestments.length} inversión(es) actualizada(s)`);
    
    // Actualizar en trades si existen
    const updatedTrades = await sql`
      UPDATE trades
      SET symbol = 'VWRA.L'
      WHERE symbol = 'VWRA'
      RETURNING *
    `;
    
    console.log(`✅ ${updatedTrades.length} trade(s) actualizado(s)`);
    
    // Limpiar cache viejo
    await sql`
      DELETE FROM stock_price_cache
      WHERE symbol = 'VWRA'
    `;
    
    console.log('✅ Cache limpiado');
    
    // Intentar obtener el precio nuevo
    console.log('\n📊 Obteniendo precio actualizado...\n');
    
    const response = await fetch(
      'https://query1.finance.yahoo.com/v8/finance/chart/VWRA.L?interval=1d&range=1d',
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
        console.log(`Símbolo: ${meta.symbol}`);
        console.log(`Precio: ${meta.regularMarketPrice} ${meta.currency}`);
        console.log(`Nombre: ${meta.shortName}`);
        
        // Guardar en cache
        await sql`
          INSERT INTO stock_price_cache (symbol, price, previous_close, change_amount, change_percent, currency, name, updated_at)
          VALUES ('VWRA.L', ${meta.regularMarketPrice}, ${meta.previousClose}, ${meta.regularMarketPrice - meta.previousClose}, ${((meta.regularMarketPrice - meta.previousClose) / meta.previousClose) * 100}, ${meta.currency}, ${meta.shortName}, NOW())
          ON CONFLICT (symbol) DO UPDATE SET
            price = EXCLUDED.price,
            previous_close = EXCLUDED.previous_close,
            change_amount = EXCLUDED.change_amount,
            change_percent = EXCLUDED.change_percent,
            currency = EXCLUDED.currency,
            name = EXCLUDED.name,
            updated_at = NOW()
        `;
        
        console.log('\n✅ Precio guardado en cache');
      }
    }
    
    console.log('\n✨ ¡Listo! Ahora VWRA.L se actualizará correctamente.');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

fixVWRA();
