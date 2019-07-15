const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const pool = require('../database');
const helpers = require('../lib/helpers');

passport.use('local.signin', new LocalStrategy({
	usernameField: 'correo',
	passwordField: 'cont',
	passReqToCallback: true
}, async (req, username, password, done) => {
	console.log(req.body);
	const row = await pool.query('Select * from usuario where Correo = ?', [username]);
	if(row.length > 0){
		const user = row[0];
		const valido = await helpers.matchPassword(password, user.Password)
		if(valido){
			done(null, user, req.flash('success', 'Bienvenido ' + user.Nombre));
		} else {
			done(null, false, req.flash('message','Contraseña incorrecta'));
		}
	} else {
		return done(null, false, req.flash('message','El usuario no existe'));
	}
}));

passport.use('local.signup', new LocalStrategy({
	usernameField: 'correo',
	passwordField: 'cont',
	passReqToCallback: true
}, async (req, username, password, done) => {
	const row = await pool.query('Select * from usuario where Correo = ?', [username]);
	if(row.length > 0){
		return done(null, false, req.flash('message', 'El correo se encuentra en uso'));
	} else {
	const { nombre, apellido, relacion } = req.body;
	const newUser = {
		Nombre: nombre,
		Apellido: apellido,
		Correo: username,
		Password: password, 
		RelacionTIP: relacion, 
		Rol: "Visitante"
	};
	newUser.Password =  await helpers.encryptPassword(password);
	const res = await pool.query('INSERT INTO usuario SET ?', [newUser]);
	newUser.id = res.insertId;
	return done(null, newUser);
}
})); 

passport.serializeUser((user, done) => {
	done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
	const filas = await pool.query('select * from usuario where id = ?', [id]);
	done(null, filas[0]);
});