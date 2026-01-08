const { neon } = require('@neondatabase/serverless');

async function clearTrades() {
  const sql = neon(process.env.DATABASE_URL);
  
  console.log('🗑️  Limpiando historial de operaciones...');
  
  try {
    const result = await sql`DELETE FROM trades`;
    console.log('✅ Historial de operaciones limpiado exitosamente');
    console.log(`   Registros eliminados: ${result.length || 0}`);
  } catch (error) {
    console.error('❌ Error al limpiar historial:', error);
    process.exit(1);
  }
}

clearTrades();
