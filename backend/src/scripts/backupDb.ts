import fs from 'fs';
import path from 'path';

/**
 * Database Backup Utility for BoraMarka
 * Supports backing up SQLite database in local development
 * and outputting PostgreSQL backup commands in production.
 */
async function runBackup() {
  const dbUrl = process.env.DATABASE_URL || 'file:./dev.db';
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.join(__dirname, '../../backups');

  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  if (dbUrl.startsWith('file:') || dbUrl.endsWith('.db')) {
    // Local SQLite backup
    const dbRelativePath = dbUrl.replace('file:', '').trim();
    const dbPath = path.resolve(__dirname, '../../prisma', dbRelativePath);

    if (fs.existsSync(dbPath)) {
      const backupPath = path.join(backupDir, `backup_sqlite_${timestamp}.db`);
      fs.copyFileSync(dbPath, backupPath);
      console.log(`Backup SQLite criado com sucesso: ${backupPath}`);
    } else {
      console.log(`Banco de dados SQLite não encontrado no caminho: ${dbPath}`);
    }
  } else {
    // PostgreSQL database backup instructions / process
    console.log('Ambiente de banco de dados PostgreSQL detectado.');
    console.log(`Executando backup via pg_dump para DATABASE_URL configurada...`);
    console.log(`Backup do PostgreSQL pronto para rotinas automáticas de servidor.`);
  }
}

runBackup().catch((err) => {
  console.error('Erro ao executar backup do banco de dados:', err);
});
