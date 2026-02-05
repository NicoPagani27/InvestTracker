const { neon } = require('@neondatabase/serverless');
require('dotenv').config({ path: '.env.local' });

async function listAllInvestments() {
  const sql = neon(process.env.DATABASE_URL);
  
  try {
    const investments = await sql`
      SELECT i.symbol, i.name, i.currency, i.shares, i.cost_per_share, 
             sp.price as current_price, sp.currency as price_currency
      FROM investments i
      LEFT JOIN stock_price_cache sp ON sp.symbol = i.symbol
      ORDER BY i.symbol
    `;
    
    console.log('\n📊 Todas las inversiones:\n');
    
    investments.forEach((inv) => {
      console.log(`${inv.symbol} - ${inv.name}`);
      console.log(`  Moneda: ${inv.currency}`);
      console.log(`  Shares: ${inv.shares}`);
      console.log(`  Precio: ${inv.current_price || 'No cargado'} ${inv.price_currency || inv.currency}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

listAllInvestments();
