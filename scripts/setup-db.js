const { neon } = require('@neondatabase/serverless');
const fs = require('fs');
const path = require('path');

async function setupDatabase() {
  const sql = neon(process.env.DATABASE_URL);
  
  console.log('📦 Leyendo script SQL...');
  const sqlScript = fs.readFileSync(
    path.join(__dirname, '001-create-schema.sql'),
    'utf8'
  );
  
  console.log('🚀 Ejecutando script SQL...');
  
  try {
    // Dividir el script en comandos individuales
    const commands = sqlScript
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));
    
    for (const command of commands) {
      if (command) {
        await sql.query(command);
      }
    }
    
    console.log('✅ Base de datos configurada exitosamente!');
    console.log('✅ Todas las tablas han sido creadas.');
  } catch (error) {
    console.error('❌ Error al configurar la base de datos:', error);
    process.exit(1);
  }
}

setupDatabase();
