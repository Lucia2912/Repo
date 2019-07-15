//Archivo con el que va a comenzar
const express = require('express');
const morgan = require('morgan');
const exphbs = require('express-handlebars');
const path = require('path');
const flash = require('connect-flash');
const session = require('express-session');
const mysqlstore = require('express-mysql-session');
const passport = require('passport');
const multer = require('multer');
const { database } = require('./keys');

const storage = multer.diskStorage({
	destination: path.join(__dirname, 'public/archivos'),
	filename: (req, file, cb) => {
		cb(null, file.originalname);
	}
});

//inicializaciones
const app = express();
require('./lib/passport');

//Configuraciones
app.set('PORT', process.env.PORT || 5000);
app.set('views', path.join(__dirname, 'views'));
app.engine('.hbs', exphbs({
	defaultLayout: 'main',
	layoutsDir: path.join(app.get('views'), 'layouts'),
	partialsDir: path.join(app.get('views'), 'partials'),
	extname: '.hbs',
	helpers: require('./lib/handlebars')
}));
app.set('view engine', '.hbs');

//Middlewares
app.use(session({
	secret: 'cmstip',
	resave: false,
	saveUninitialized: false,
	store: new mysqlstore(database)
}));
app.use(morgan('dev'));
app.use(express.urlencoded({extended: false}));
app.use(express.json());
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
app.use(multer({
	storage,
	dest: path.join(__dirname, 'public/archivos')
}).any());

//Variables globales
app.use((req, res, next) => {
	app.locals.success = req.flash('success');
	app.locals.message = req.flash('message');
	app.locals.user = req.user;
	next();
});

//rutas
app.use(require('./routes/index'));
app.use(require('./routes/autenticacion'));
app.use('/usuarios' ,require('./routes/usuarios'));
app.use('/proyectos' ,require('./routes/proyectos'));
app.use('/pasantias' ,require('./routes/pasantias'));

//Archivos publicos
app.use(express.static(path.join(__dirname, 'public')));

//Comienza servidor

app.listen(app.get('PORT'), () => {
	console.log('Servicio en puerto ', app.get('port'));
});
