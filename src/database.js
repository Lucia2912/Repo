//Conexion con la base
const mysql = require('mysql');
const { promisify } = require('util');

const { database } = require('./keys');

const pool = mysql.createPool(database);
pool.getConnection((err, connection ) => {
	if(err){
		if(err.code === 'PROTOCOL_CONNECTION_LOST'){
			console.error('La conexion con la bd fue cerrada');
		}
		if(err.code === 'ER_CON_COUNT_ERROR'){	
			console.error('La bd tiene muchas conexiones');
		}
		if(err.code === 'ECONNREFUSED'){
			console.error('La conexion con la bd fue rechazada');
		}
	}

	if(connection) connection.release();
	console.log('Conectada la bd');
	return;
});

pool.query = promisify(pool.query);

module.exports = pool;