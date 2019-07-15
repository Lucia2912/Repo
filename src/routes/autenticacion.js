const express = require('express');
const router = express.Router();
const passport = require('passport');
const { isLoggedIn, isNotLoggedIn } = require('../lib/auth');
const db = require('../database');
const helpers = require('../lib/helpers');

router.get('/signup', isNotLoggedIn, (req, res) => {
  res.render('auth/signup');
});


router.post('/signup', (req, res, next) => {
  passport.authenticate('local.signup', {
    successRedirect: '/',
    failureRedirect: '/signup',
    failureFlash: true
  })(req, res, next);
});

router.get('/signin', isNotLoggedIn, (req, res) => {
  res.render('auth/signin');
});

router.post('/signin', (req, res, next) => {
  passport.authenticate('local.signin', {
    successRedirect: '/',
    failureRedirect: '/signin',
    failureFlash: true
  })(req, res, next);
});

router.get('/miPerfil', isLoggedIn, (req, res) => {
  res.render('auth/profile');
});

router.post('/modificar/:id', isLoggedIn, async (req, res) => {
  const { id } = req.params;
  const { nombre, Apellido, correo, relacion, cont } = req.body;
  const usuario = await db.query('SELECT * FROM usuario where id=?', [id]);
  const usu = usuario[0];
  let cont2 = cont.trim();
  if (usu.Nombre !== nombre) {
    await db.query('UPDATE usuario SET Nombre=? WHERE id=?', [nombre, [id]]);
  }
  if (usu.Apellido !== Apellido) {
    await db.query('UPDATE usuario SET Apellido=? WHERE id=?', [Apellido, [id]]);
  }

  if (usu.Correo !== correo) {
  const row = await db.query('Select * from usuario where Correo = ?', [correo]);
	if(row.length > 0){
		req.flash('message','El correo por el cual ha intentado modificar se encuentra en uso');
	} else {
    await db.query('UPDATE usuario SET Correo=? WHERE id=?', [correo, [id]]);
  }
  }

  if (usu.RelacionTIP !== relacion) {
    await db.query('UPDATE usuario SET RelacionTIP=? WHERE id=?', [relacion, [id]]);
  }
  if (cont2 !== '') {
    console.log('entr');
    let con = await helpers.encryptPassword(cont);
    await db.query('UPDATE usuario SET Password=? WHERE id=?', [con, [id]]);
  }

  res.redirect('/miPerfil');

});

router.get('/404', (req, res) => {
  res.render('layouts/404');
});

router.get('/logout', isLoggedIn, (req, res) => {
  req.logOut();
  res.redirect('/signin');
});


module.exports = router;