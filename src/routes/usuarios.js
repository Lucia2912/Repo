const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs-extra');
const db = require('../database');
const { zip } = require('zip-a-folder');
const { isLoggedIn, isNotLoggedIn, verLoBasico, isAdminorSuper, isSuperAdmin, isNotVisitante, isVisitante } = require('../lib/auth');

router.get('/', isLoggedIn, isAdminorSuper, async (req, res) => {
	const usuario = await db.query('SELECT * FROM usuario');
	res.render('usuarios/listado', { usuario });
});

/*router.get('/sugerencia', isLoggedIn, async (req, res) => {
	const sugerencias = await db.query('SELECT * FROM sugerencia');
	res.render('usuarios/sugerencias', { sugerencias });
});

router.post('/sugerencia', isLoggedIn, async (req, res) => {
	const { sug } = req.body;
	const sugerencia = {
		Texto: sug,
		Usuario: req.user.id
	};
	await db.query('INSERT INTO sugerencia SET ?', [sugerencia]);
	const sugerencias = await db.query('SELECT * FROM sugerencia');
	res.render('usuarios/sugerencias', { sugerencias });
}); */


router.post('/', isLoggedIn, isAdminorSuper, async (req, res) => {
	const { filtro } = req.body;
	const usuario = await db.query("SELECT * FROM usuario where Nombre like ?", [filtro] + '%');
	res.render('usuarios/listado', { usuario });
});

router.get('/roles/:id', isLoggedIn, isSuperAdmin, async (req, res) => {
	const { id } = req.params;
	const usuario = await db.query('SELECT * FROM usuario where id=?', [id]);
	const usu = usuario[0];
	res.render('usuarios/roles', { usu });
});

router.post('/roles/:id', async (req, res) => {
	const { id } = req.params;
	console.log(id);
	const { customRadio } = req.body;
	let Rol = '';
	for (let i = 0; i < customRadio.length; i++) {
		Rol += customRadio[i];
	}
	await db.query('Update usuario set Rol=? where id=?', [Rol, id]);
	res.redirect('/usuarios');
});

module.exports = router;