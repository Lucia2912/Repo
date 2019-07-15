const express = require('express');
const router=express.Router();
const nodemailer = require('nodemailer');
const db = require('../database');

router.get('/', (req, res) => {
	res.render('layouts/inicio');
});

router.get('/sugerencias', async (req, res) => {
	res.render('layouts/sugerencias');
});

router.post('/sugerencias', async (req, res) => {
	const {asunto, correo, nombre, texto} = req.body;
	let contenido = `Nombre: ${nombre} \n Correo: ${correo} \n Sugerencia: ${texto} `;
	let transport = nodemailer.createTransport({
		service: 'gmail',
		auth: {
			user: 'reservacinepay@gmail.com',
			pass: 'reserva12345'
		}
	});

	let options = {
		from: 'reservacinepay@gmail.com',
		to: 'reservacinepay@gmail.com',
		subject: 'Sugerencia: '+asunto,
		text: contenido
	}

	transport.sendMail(options, function(error, info){
		if(error){
			console.log(error);
		} else {
			console.log("Envio" + info.response);
		}
	});

	res.render('layouts/inicio');
});

router.post('/buscador', async (req, res) => {
	const { filtro } = req.body;
	console.log(filtro);
	const pasantias = await db.query('SELECT distinct * FROM pasantia where Nombre like ? or NombreAlum like ? OR anioRealizacion like ? OR Generacion like ? OR Empresa like ? ORDER BY anioRealizacion DESC', [ '%' + [filtro] + '%','%'+[filtro] + '%', '%'+[filtro] + '%', '%'+[filtro] + '%', '%'+[filtro] + '%' ]);
	const proyectos = await db.query('SELECT distinct * FROM proyecto where titulo like ? OR anioRealizacion like ? OR Empresa like ? OR resumen like ?  ORDER BY anioRealizacion DESC', ['%'+ [filtro] + '%', '%'+[filtro] + '%', '%'+[filtro] + '%', '%'+[filtro] + '%' ]);
	const grupo = await db.query('SELECT distinct * FROM grupoproyecto where NombreCompleto like ? OR Nota like ? ', ['%'+ [filtro] + '%', '%'+[filtro] + '%']);
	const tribunal = await db.query('SELECT distinct * FROM tribunal where NombreCompleto like ? OR cargo like ? OR empresa like ?', [ '%'+[filtro] + '%', '%'+[filtro] + '%', '%'+[filtro] + '%']);

	if(grupo.length > 0){
	for(let i = 0; i<grupo.length; i++){
		let id = grupo[i].Proyecto;
		const proy = await db.query('SELECT * FROM proyecto  WHERE id=?', [id]);
		proyectos.push(proy[0]);
	}
}

if(tribunal.length >0 ){
	for(let i = 0; i<tribunal.length; i++){
		let id = tribunal[i].Proyecto;
		const proy = await db.query('SELECT * FROM proyecto  WHERE id=?', [id]);
		proyectos.push(proy[0]);
	}
}
	res.render('usuarios/filtrado', { pasantias, proyectos});
});

router.get('/buscador', async (req, res) => {
	res.render('layouts/404');
});

module.exports = router; 