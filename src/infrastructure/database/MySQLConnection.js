const mysql = require("mysql2/promise");
require("dotenv").config();
class MySQLConnection {
constructor() {
this.pool = null;
}
async connect() {
console.log(`🔌 DB Init: Conectando a ${process.env.DB_HOST}...`);
this.pool = mysql.createPool({
host: process.env.DB_HOST,
user: process.env.DB_USER,
password: process.env.DB_PASSWORD,
database: process.env.DB_NAME,
port: process.env.DB_PORT || 3306,
waitForConnections: true,
connectionLimit: 10,
queueLimit: 0,
timezone: "+01:00",
});
const connection = await this.pool.getConnection();
console.log("✅ BASE DE DATOS: Conectado exitosamente a MySQL.");
connection.release();
return this.pool;
}
getPool() {
if (!this.pool) {
throw new Error("Database pool not initialized. Call connect() first.");
}
return this.pool;
}
}
module.exports = new MySQLConnection();
