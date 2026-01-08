const { neon } = require('@neondatabase/serverless');

async function listUsers() {
  const sql = neon(process.env.DATABASE_URL);
  
  try {
    const users = await sql`
      SELECT id, email, name, preferred_currency, created_at 
      FROM users 
      ORDER BY created_at DESC
    `;
    
    console.log('\n📊 Usuarios registrados:\n');
    
    if (users.length === 0) {
      console.log('No hay usuarios registrados aún.');
      return;
    }
    
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email}`);
      console.log(`   Nombre: ${user.name || 'Sin nombre'}`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Moneda: ${user.preferred_currency}`);
      console.log(`   Registrado: ${new Date(user.created_at).toLocaleString()}`);
      console.log('');
    });
    
    console.log(`Total: ${users.length} usuario(s)\n`);
  } catch (error) {
    console.error('Error al obtener usuarios:', error.message);
  }
}

listUsers();
