const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs-extra');
const db = require('../database');
const uuid = require('uuid/v4');
const { zip } = require('zip-a-folder');
const { isLoggedIn, isNotLoggedIn, verLoBasico, isAdminorSuper, isSuperAdmin, isNotVisitante, isVisitante } = require('../lib/auth');

router.get('/', isLoggedIn, async (req, res) => {
	const pasantias = await db.query('SELECT * FROM pasantia  ORDER BY anioRealizacion DESC');
	res.render('publicaciones/listPas', { pasantias });
});

router.post('/', isLoggedIn, async (req, res) => {
	const { filtro } = req.body;
	const pasantias = await db.query('SELECT * FROM pasantia where NombreAlum like ? ORDER BY anioRealizacion DESC', [filtro] + '%');
	let mensaje = "No se han encontrado resultados";
	if (pasantias.length > 0) {
		res.render('publicaciones/listPas', { pasantias });
	}
	else {
		res.render('publicaciones/listPas', { mensaje });
	}
});

router.get('/descargarCodigo/:id', isLoggedIn, isNotVisitante, async (req, res) => {
	console.log(req.params);
	const { id } = req.params;
	const p = await db.query('SELECT * FROM pasantia WHERE id=?', [id]);
	var file = __dirname + `/archivos/pasantias/` + p[0].NombreAlum.trim() + p[0].Generacion + `/codigo/Codigo` + p[0].NombreAlum.trim() + p[0].Generacion + `.zip`;
	var fileO = file.replace("routes", "public");
	console.log(fileO);
	res.download(fileO);
});


router.get('/detalle/:id', isLoggedIn, isNotVisitante, async (req, res) => {
	const { id } = req.params;
	const pas = await db.query('SELECT * FROM pasantia  WHERE id=?', [id]);
	const cartas = await db.query('SELECT * FROM cartaspasa  WHERE Pasantia=?', [id]);
	const docu = await db.query('SELECT * FROM documentacionpasa  WHERE Pasantia=?', [id]);
	const imgs = await db.query('SELECT Ruta FROM imagenpasa  WHERE Pasantia=?', [id]);
	const invest = await db.query('SELECT * FROM investigacionpasa  WHERE Pasantia=?', [id]);
	const vidPres = await db.query('SELECT * FROM videoprespas  WHERE Pasantia=?', [id]);
	const cod = await db.query('SELECT * FROM codigopasa WHERE Pasantia=?', [id]);
	const pasantia = pas[0];
	let inicio;
	let fin;
	let acuerdo;
	for (let i = 0; i < cartas.length; i++) {
		if (cartas[i].Ruta.includes("acuerdo")) {
			acuerdo = cartas[i];
		}

		if (cartas[i].Ruta.includes("cartaInicio")) {
			inicio = cartas[i];
		}

		if (cartas[i].Ruta.includes("cartaFin")) {
			fin = cartas[i];
		}
	}
	res.render('publicaciones/detPas', { pasantia, invest, cod, imgs, docu, acuerdo, inicio, fin, vidPres });
});

router.get('/eliminar/:id', isLoggedIn, isNotVisitante, async (req, res) => {
	const { id } = req.params;
	await fs.remove(`src/public/archivos/pasantias/carpeta${id}/`);
	await db.query('DELETE FROM codigopasa WHERE Pasantia=?', [id]);
	await db.query('DELETE FROM cartaspasa WHERE Pasantia=?', [id]);
	await db.query('DELETE FROM documentacionpasa WHERE Pasantia=?', [id]);
	await db.query('DELETE FROM imagenpasa WHERE Pasantia=?', [id]);
	await db.query('DELETE FROM investigacionpasa WHERE Pasantia=?', [id]);
	await db.query('DELETE FROM videoprespas WHERE Pasantia=?', [id]);
	await db.query('DELETE FROM pasantia WHERE id=?', [id]);
	res.redirect('/pasantias');
});

router.get('/eliminarImg/:id', isLoggedIn, isNotVisitante, async (req, res) => {
	const { id } = req.params;
	const img = await db.query('SELECT * FROM imagenpasa WHERE id=?', [id]);
	let idecito = img[0].Pasantia;
	let rut = "src/public/" + img[0].Ruta;
	fs.unlink(rut, function (err) {
		if (err) throw err;
		console.log('File deleted!');
	});
	await db.query('DELETE FROM imagenpasa WHERE id=?', [id]);
	res.redirect(`/pasantias/editar/${idecito}`);
});

router.get('/eliminarDoc/:id', isLoggedIn, isNotVisitante, async (req, res) => {
	const { id } = req.params;
	const doc = await db.query('SELECT Ruta FROM documentacionpasa WHERE id=?', [id]);
	let idecito = doc[0].Pasantia;
	let rut = "src/public/" + doc[0].Ruta;
	fs.unlink(rut, function (err) {
		if (err) throw err;
		console.log('File deleted!');
	});
	await db.query('DELETE FROM documentacionpasa WHERE id=?', [id]);
	res.redirect(`/pasantias/editar/${idecito}`);
});

router.get('/eliminarAc/:id', isLoggedIn, isNotVisitante, async (req, res) => {
	const { id } = req.params;
	const doc = await db.query('SELECT Ruta FROM cartaspasa WHERE id=?', [id]);
	let idecito = doc[0].Pasantia;
	let rut = "src/public/" + doc[0].Ruta;
	fs.unlink(rut, function (err) {
		if (err) throw err;
		console.log('File deleted!');
	});
	await db.query('DELETE FROM cartaspasa WHERE id=?', [id]);
	res.redirect(`/pasantias/editar/${idecito}`);
});

router.get('/eliminarCI/:id', isLoggedIn, isNotVisitante, async (req, res) => {
	const { id } = req.params;
	const doc = await db.query('SELECT Ruta FROM cartaspasa WHERE id=?', [id]);
	let idecito = doc[0].Pasantia;
	let rut = "src/public/" + doc[0].Ruta;
	fs.unlink(rut, function (err) {
		if (err) throw err;
		console.log('File deleted!');
	});
	await db.query('DELETE FROM cartaspasa WHERE id=?', [id]);
	res.redirect(`/pasantias/editar/${idecito}`);
});

router.get('/eliminarCF/:id', isLoggedIn, isNotVisitante, async (req, res) => {
	const { id } = req.params;
	const doc = await db.query('SELECT Ruta FROM cartaspasa WHERE id=?', [id]);
	let idecito = doc[0].Pasantia;
	let rut = "src/public/" + doc[0].Ruta;
	fs.unlink(rut, function (err) {
		if (err) throw err;
		console.log('File deleted!');
	});
	await db.query('DELETE FROM cartaspasa WHERE id=?', [id]);
	res.redirect(`/pasantias/editar/${idecito}`);
});

router.get('/eliminarInv/:id', isLoggedIn, isNotVisitante, async (req, res) => {
	const { id } = req.params;
	const doc = await db.query('SELECT Ruta FROM investigacionpasa WHERE id=?', [id]);
	let idecito = doc[0].Pasantia;
	let rut = "src/public/" + doc[0].Ruta;
	fs.unlink(rut, function (err) {
		if (err) throw err;
		console.log('File deleted!');
	});
	await db.query('DELETE FROM investigacionpasa WHERE id=?', [id]);
	res.redirect(`/pasantias/editar/${idecito}`);
});

router.get('/eliminarVid/:id', isLoggedIn, isNotVisitante, async (req, res) => {
	const { id } = req.params;
	const doc = await db.query('SELECT Ruta FROM videoprespas WHERE id=?', [id]);
	let idecito = doc[0].Pasantia;
	let rut = "src/public/" + doc[0].Ruta;
	fs.unlink(rut, function (err) {
		if (err) throw err;
		console.log('File deleted!');
	});
	await db.query('DELETE FROM videoprespas WHERE id=?', [id]);
	res.redirect(`/pasantias/editar/${idecito}`);
});

router.get('/eliminarCod/:id', isLoggedIn, isNotVisitante, async (req, res) => {
	const { id } = req.params;
	const doc = await db.query('SELECT Ruta FROM codigopasa WHERE id=?', [id]);
	let idecito = doc[0].Pasantia;
	let rut = "src/public/" + doc[0].Ruta;
	fs.unlink(rut, function (err) {
		if (err) throw err;
		console.log('File deleted!');
	});
	await db.query('DELETE FROM codigopasa WHERE id=?', [id]);
	res.redirect(`/pasantias/editar/${idecito}`);
});

router.post('/editar/:id', isLoggedIn, isNotVisitante, async (req, res) => {
	const { id } = req.params;
	const { nom, nombrePas, gen, aprobado, vinculoLab, anio, inicio, fin, modalidad, tareas, tutorA, tutorC, empr } = req.body;
	const pas = await db.query('SELECT * FROM pasantia  WHERE id=?', [id]);

	const nombre = pas[0].NombreAlum.trim();
	const genera = pas[0].Generacion;
	const nombre2 = nom.trim();

	console.log(pas);
	if (pas[0].Nombre !== nombrePas) {
		await db.query('UPDATE pasantia SET Nombre=? WHERE id=?', [nombrePas, [id]]);
	}

	if (pas[0].NombreAlum !== nom) {
		await db.query('UPDATE pasantia SET NombreAlum=? WHERE id=?', [nom, [id]]);
	}

	if (pas[0].Generacion !== gen) {
		await db.query('UPDATE pasantia SET Generacion=? WHERE id=?', [gen, [id]]);
	}

	let valueAprob = '';
	for (let i = 0; i < aprobado.length; i++) {
		valueAprob += aprobado[i];
	}
	let aprob;
	if (valueAprob === "si") {
		aprob = true;
	} else {
		aprob = false;
	}

	if (pas[0].Aprobo === 1) {
		if (!aprob) {
			await db.query('UPDATE pasantia SET Aprobo=? WHERE id=?', [aprob, [id]]);
		}
	}

	if (pas[0].Aprobo === 0) {
		if (aprob) {
			await db.query('UPDATE pasantia SET Aprobo=? WHERE id=?', [aprob, [id]]);
		}
	}

	let vinc;
	let valueVinc = '';
	for (let i = 0; i < vinculoLab.length; i++) {
		valueVinc += vinculoLab[i];
	}
	if (valueVinc === "si") {
		vinc = true;
	} else {
		vinc = false;
	}

	if (pas[0].VinculoLab === 1) {
		if (!vinc) {
			await db.query('UPDATE pasantia SET VinculoLab=? WHERE id=?', [vinc, [id]]);
		}
	}

	if (pas[0].VinculoLab === 0) {
		if (vinc) {
			await db.query('UPDATE pasantia SET VinculoLab=? WHERE id=?', [vinc, [id]]);
		}
	}

	if (pas[0].anioRealizacion !== anio) {
		await db.query('UPDATE pasantia SET anioRealizacion=? WHERE id=?', [anio, [id]]);
	}

	if (pas[0].FecInicio !== inicio) {
		await db.query('UPDATE pasantia SET FecInicio=? WHERE id=?', [inicio, [id]]);
	}

	if (pas[0].FecFin !== fin) {
		await db.query('UPDATE pasantia SET FecFin=? WHERE id=?', [fin, [id]]);
	}

	if (pas[0].tareas !== tareas) {
		await db.query('UPDATE pasantia SET tareas=? WHERE id=?', [tareas, [id]]);
	}

	if (pas[0].TutorA !== tutorA) {
		await db.query('UPDATE pasantia SET TutorA=? WHERE id=?', [tutorA, [id]]);
	}

	if (pas[0].TutorCli !== tutorC) {
		await db.query('UPDATE pasantia SET TutorCli=? WHERE id=?', [tutorC, [id]]);
	}

	if (pas[0].Empresa !== empr) {
		await db.query('UPDATE pasantia SET Empresa=? WHERE id=?', [empr, [id]]);
	}

	if (pas[0].Modalidad !== modalidad) {
		await db.query('UPDATE pasantia SET Modalidad=? WHERE id=?', [modalidad, [id]]);
	}

	for (var i = 0; i < req.files.length; i++) {
		if (req.files[i].fieldname == "pro-image") {
			if (!fs.existsSync(`src/public/archivos/pasantias/carpeta${id}/galeria`)) {
				fs.mkdirSync(`src/public/archivos/pasantias/carpeta${id}/galeria`);
			}
			const temp = req.files[i].path;
			let idecito = uuid();
			const e = path.extname(req.files[i].originalname).toLocaleLowerCase();
			const orig = path.resolve(`src/public/archivos/pasantias/carpeta${id}/galeria/${idecito}${e}`);
			await fs.rename(temp, orig);
			let ruta = `/archivos/pasantias/carpeta${id}/galeria/${idecito}${e}`;
			const newImg = {
				Ruta: ruta,
				Pasantia: id
			};
			await db.query('INSERT INTO imagenpasa SET ?', [newImg]);
		}

		if (req.files[i].fieldname == "codigo") {
			if (!fs.existsSync(`src/public/archivos/pasantias/carpeta${id}/codigo`)) {
				fs.mkdirSync(`src/public/archivos/pasantias/carpeta${id}/codigo`);
			}
			let idecito = uuid();
			const temp = req.files[i].path;
			const e = path.extname(req.files[i].originalname).toLocaleLowerCase();
			const orig = path.resolve(`src/public/archivos/pasantias/carpeta${id}/codigo/${idecito}${e}`);
			await fs.rename(temp, orig);
		}
		if (req.files[i].fieldname == "documents") {
			if (!fs.existsSync(`src/public/archivos/pasantias/carpeta${id}/documentacion`)) {
				fs.mkdirSync(`src/public/archivos/pasantias/carpeta${id}/documentacion`);
			}
			let idecito = uuid();
			const temp = req.files[i].path;
			const e = path.extname(req.files[i].originalname).toLocaleLowerCase();
			const orig = path.resolve(`src/public/archivos/pasantias/carpeta${id}/documentacion/${idecito}${e}`);
			await fs.rename(temp, orig);
			let ruta = `/archivos/pasantias/carpeta${id}/documentacion/${idecito}${e}`;
			const newDoc = {
				Ruta: ruta,
				Pasantia: id
			};
			await db.query('INSERT INTO documentacionpasa SET ?', [newDoc]);
		}

		if (req.files[i].fieldname == "videoPres") {
			if (!fs.existsSync(`src/public/archivos/pasantias/carpeta${id}/videoPres`)) {
				fs.mkdirSync(`src/public/archivos/pasantias/carpeta${id}/videoPres`);
			}
			const temp = req.files[i].path;
			const e = path.extname(req.files[i].originalname).toLocaleLowerCase();
			const orig = path.resolve(`src/public/archivos/pasantias/carpeta${id}/videoPres/videoPres${e}`);
			await fs.rename(temp, orig);
			let ruta = `/archivos/pasantias/carpeta${id}/videoPres/videoPres${e}`;
			const newVid = {
				Ruta: ruta,
				Pasantia: id
			};
			await db.query('INSERT INTO videoprespas SET ?', [newVid]);
		}
		if (req.files[i].fieldname == "invest") {
			if (!fs.existsSync(`src/public/archivos/pasantias/carpeta${id}/investigacion`)) {
				fs.mkdirSync(`src/public/archivos/pasantias/carpeta${id}/investigacion`);
			}
			const temp = req.files[i].path;
			let idecito = uuid();
			const e = path.extname(req.files[i].originalname).toLocaleLowerCase();
			const orig = path.resolve(`src/public/archivos/pasantias/carpeta${id}/investigacion/${idecito}${e}`);
			await fs.rename(temp, orig);
			let ruta = `/archivos/pasantias/carpeta${id}/investigacion/${idecito}${e}`;
			const newInv = {
				Ruta: ruta,
				Pasantia: id
			};
			await db.query('INSERT INTO investigacionpasa SET ?', [newInv]);
		}
		if (req.files[i].fieldname == "fin") {
			const temp = req.files[i].path;
			const e = path.extname(req.files[i].originalname).toLocaleLowerCase();
			const orig = path.resolve(`src/public/archivos/pasantias/carpeta${id}/cartas/cartaFin${e}`);
			await fs.rename(temp, orig);
			let ruta = `/archivos/pasantias/carpeta${id}/cartas/cartaFin${e}`;
			const newCF = {
				Ruta: ruta,
				Pasantia: id
			};
			await db.query('INSERT INTO cartaspasa SET ?', [newCF]);
		}
		if (req.files[i].fieldname == "inicio") {
			const temp = req.files[i].path;
			const e = path.extname(req.files[i].originalname).toLocaleLowerCase();
			const orig = path.resolve(`src/public/archivos/pasantias/carpeta${id}/cartas/cartaInicio${e}`);
			await fs.rename(temp, orig);
			let ruta = `/archivos/pasantias/carpeta${id}/cartas/cartaInicio${e}`;
			const newCI = {
				Ruta: ruta,
				Pasantia: id
			};
			await db.query('INSERT INTO cartaspasa SET ?', [newCI]);
		}
		if (req.files[i].fieldname == "acuerdo") {
			const temp = req.files[i].path;
			const e = path.extname(req.files[i].originalname).toLocaleLowerCase();
			const orig = path.resolve(`src/public/archivos/pasantias/carpeta${id}/cartas/acuerdo${e}`);
			await fs.rename(temp, orig);
			let ruta = `/archivos/pasantias/carpeta${id}/cartas/acuerdo${e}`;
			const newacuerdo = {
				Ruta: ruta,
				Pasantia: id
			};
			await db.query('INSERT INTO cartaspasa SET ?', [newacuerdo]);
		}
	}

	if (fs.existsSync(`/src/public/archivos/pasantias/carpeta${id}/codigo`)) {
		let rut = `src/public/archivos/pasantias/carpeta${id}/codigo/Codigo${nombre2}.zip`;
		fs.unlink(rut, function (err) {
			if (err) throw err;
			console.log('File deleted!');
		});

		await zip(`src/public/archivos/pasantias/carpeta${id}/codigo`, `src/public/archivos/pasantias/carpeta${id}/codigo/Codigo${nombre2}.zip`);
	}
	res.redirect('/pasantias');
});

router.get('/editar/:id', isLoggedIn, isNotVisitante, async (req, res) => {
	const { id } = req.params;
	const pas = await db.query('SELECT * FROM pasantia  WHERE id=?', [id]);
	const cartas = await db.query('SELECT * FROM cartaspasa  WHERE Pasantia=?', [id]);
	const docu = await db.query('SELECT * FROM documentacionpasa  WHERE Pasantia=?', [id]);
	const imgs = await db.query('SELECT * FROM imagenpasa  WHERE Pasantia=?', [id]);
	const invest = await db.query('SELECT * FROM investigacionpasa  WHERE Pasantia=?', [id]);
	const vidPres = await db.query('SELECT * FROM videoprespas  WHERE Pasantia=?', [id]);
	const cod = await db.query('SELECT * FROM codigopasa  WHERE Pasantia=?', [id]);
	const pasantia = pas[0];
	let inicio;
	let fin;
	let acuerdo;
	for (let i = 0; i < cartas.length; i++) {
		if (cartas[i].Ruta.includes("acuerdo")) {
			acuerdo = cartas[i];
		}

		if (cartas[i].Ruta.includes("cartaInicio")) {
			inicio = cartas[i];
		}

		if (cartas[i].Ruta.includes("cartaFin")) {
			fin = cartas[i];
		}
	}
	res.render('publicaciones/editarPas', { pasantia, cod, invest, imgs, docu, acuerdo, inicio, fin, vidPres });
});

router.get('/detalles/:id', verLoBasico, async (req, res) => {
	const { id } = req.params;
	const pas = await db.query('SELECT * FROM pasantia  WHERE id=?', [id]);;
	const imgs = await db.query('SELECT Ruta FROM imagenpasa  WHERE Pasantia=?', [id]);
	const vidPres = await db.query('SELECT * FROM videoprespas  WHERE Pasantia=?', [id]);
	const pasantia = pas[0];
	res.render('publicaciones/detPasUsu', { pasantia, imgs, vidPres });
});

router.get('/NuevaPasantia', isLoggedIn, isAdminorSuper, (req, res) => {
	res.render('publicaciones/pasantia');
});

router.post('/NuevaPasantia', async (req, res) => {
	const { nombre, nombrePas, generacion, aprobado, vinculoLab, anio, inicio, fin, modalidad, tareas, tutorA, tutorC, empr } = req.body;
	const nombre2 = nombre.trim();

	let vinc;
	let valueVinc = '';
	for (let i = 0; i < vinculoLab.length; i++) {
		valueVinc += vinculoLab[i];
	}
	if (valueVinc === "si") {
		vinc = true;
	} else {
		vinc = false;
	}

	let valueAprob = '';
	for (let i = 0; i < aprobado.length; i++) {
		valueAprob += aprobado[i];
	}

	let aprob;
	if (valueAprob === "si") {
		aprob = true;
	} else {
		aprob = false;
	}

	const newPas = {
		Nombre: nombrePas,
		NombreAlum: nombre,
		Generacion: generacion,
		Aprobo: aprob,
		VinculoLab: vinc,
		anioRealizacion: anio,
		FecInicio: inicio,
		FecFin: fin,
		Modalidad: modalidad,
		Tareas: tareas,
		TutorA: tutorA,
		TutorCli: tutorC,
		Empresa: empr
	};
	const result = await db.query('INSERT INTO pasantia SET ?', [newPas]);
	let id = result.insertId;

	if (!fs.existsSync(`src/public/archivos/pasantias/`)) {
		fs.mkdirSync(`src/public/archivos/pasantias/`);
	}
	if (!fs.existsSync(`src/public/archivos/pasantias/carpeta${id}/`)) {
		fs.mkdirSync(`src/public/archivos/pasantias/carpeta${id}/`);
	}
	if (!fs.existsSync(`src/public/archivos/pasantias/carpeta${id}/cartas`)) {
		fs.mkdirSync(`src/public/archivos/pasantias/carpeta${id}/cartas`);
	}

	for (var i = 0; i < req.files.length; i++) {
		if (req.files[i].fieldname == "pro-image") {
			if (!fs.existsSync(`src/public/archivos/pasantias/carpeta${id}/galeria`)) {
				fs.mkdirSync(`src/public/archivos/pasantias/carpeta${id}/galeria`);
			}
			let idecito = uuid();
			const temp = req.files[i].path;
			const e = path.extname(req.files[i].originalname).toLocaleLowerCase();
			const orig = path.resolve(`src/public/archivos/pasantias/carpeta${id}/galeria/img${idecito}${e}`);
			await fs.rename(temp, orig);
			let ruta = `/archivos/pasantias/carpeta${id}/galeria/img${idecito}${e}`;
			const newImg = {
				Ruta: ruta,
				Pasantia: id
			};
			await db.query('INSERT INTO imagenpasa SET ?', [newImg]);
		}

		if (req.files[i].fieldname == "codigo") {
			if (!fs.existsSync(`src/public/archivos/pasantias/carpeta${id}/codigo`)) {
				fs.mkdirSync(`src/public/archivos/pasantias/carpeta${id}/codigo`);
			}
			const temp = req.files[i].path;
			let idecito = uuid();
			const e = path.extname(req.files[i].originalname).toLocaleLowerCase();
			const orig = path.resolve(`src/public/archivos/pasantias/carpeta${id}/codigo/codigo${idecito}${e}`);
			await fs.rename(temp, orig);
		}
		if (req.files[i].fieldname == "documents") {
			if (!fs.existsSync(`src/public/archivos/pasantias/carpeta${id}/documentacion`)) {
				fs.mkdirSync(`src/public/archivos/pasantias/carpeta${id}/documentacion`);
			}
			const temp = req.files[i].path;
			let idecito = uuid();
			const e = path.extname(req.files[i].originalname).toLocaleLowerCase();
			const orig = path.resolve(`src/public/archivos/pasantias/carpeta${id}/documentacion/${idecito}${e}`);
			await fs.rename(temp, orig);
			let ruta = `/archivos/pasantias/carpeta${id}/documentacion/${idecito}${e}`;
			const newDoc = {
				Ruta: ruta,
				Pasantia: id
			};
			await db.query('INSERT INTO documentacionpasa SET ?', [newDoc]);
		}

		if (req.files[i].fieldname == "videoPres") {
			if (!fs.existsSync(`src/public/archivos/pasantias/carpeta${id}/videoPres`)) {
				fs.mkdirSync(`src/public/archivos/pasantias/carpeta${id}/videoPres`);
			}
			const temp = req.files[i].path;
			const e = path.extname(req.files[i].originalname).toLocaleLowerCase();
			const orig = path.resolve(`src/public/archivos/pasantias/carpeta${id}/videoPres/videoPres${e}`);
			await fs.rename(temp, orig);
			let ruta = `/archivos/pasantias/carpeta${id}/videoPres/videoPres${e}`;
			const newVid = {
				Ruta: ruta,
				Pasantia: id
			};
			await db.query('INSERT INTO videoprespas SET ?', [newVid]);
		}
		if (req.files[i].fieldname == "invest") {
			if (!fs.existsSync(`src/public/archivos/pasantias/carpeta${id}/investigacion`)) {
				fs.mkdirSync(`src/public/archivos/pasantias/carpeta${id}/investigacion`);
			}
			const temp = req.files[i].path;
			let idecito = uuid();
			const e = path.extname(req.files[i].originalname).toLocaleLowerCase();
			const orig = path.resolve(`src/public/archivos/pasantias/carpeta${id}/investigacion/${idecito}${e}`);
			await fs.rename(temp, orig);
			let ruta = `/archivos/pasantias/carpeta${id}/investigacion/${idecito}${e}`;
			const newInv = {
				Ruta: ruta,
				Pasantia: id
			};
			await db.query('INSERT INTO investigacionpasa SET ?', [newInv]);
		}
		if (req.files[i].fieldname == "cartaF") {
			const temp = req.files[i].path;
			const e = path.extname(req.files[i].originalname).toLocaleLowerCase();
			const orig = path.resolve(`src/public/archivos/pasantias/carpeta${id}/cartas/cartaFin${e}`);
			await fs.rename(temp, orig);
			let ruta = `/archivos/pasantias/carpeta${id}/cartas/cartaFin${e}`;
			const newCF = {
				Ruta: ruta,
				Pasantia: id
			};
			await db.query('INSERT INTO cartaspasa SET ?', [newCF]);
		}
		if (req.files[i].fieldname == "cartaI") {
			const temp = req.files[i].path;
			const e = path.extname(req.files[i].originalname).toLocaleLowerCase();
			const orig = path.resolve(`src/public/archivos/pasantias/carpeta${id}/cartas/cartaInicio${e}`);
			await fs.rename(temp, orig);
			let ruta = `/archivos/pasantias/carpeta${id}/cartas/cartaInicio${e}`;
			const newCI = {
				Ruta: ruta,
				Pasantia: id
			};
			await db.query('INSERT INTO cartaspasa SET ?', [newCI]);
		}
		if (req.files[i].fieldname == "acuerdo") {
			const temp = req.files[i].path;
			const e = path.extname(req.files[i].originalname).toLocaleLowerCase();
			const orig = path.resolve(`src/public/archivos/pasantias/carpeta${id}/cartas/acuerdo${e}`);
			await fs.rename(temp, orig);
			let ruta = `/archivos/pasantias/carpeta${id}/cartas/acuerdo${e}`;
			const newacuerdo = {
				Ruta: ruta,
				Pasantia: id
			};
			await db.query('INSERT INTO cartaspasa SET ?', [newacuerdo]);
		}
	}


	if (fs.existsSync(`/src/public/archivos/pasantias/carpeta${id}/codigo`)) {
		const doc = await db.query('SELECT * FROM codigopasa WHERE Pasantia=?', [id]);
		let rut = "src/public/" + doc[0].Ruta;
		fs.unlink(rut, function (err) {
			if (err) throw err;
			console.log('File deleted!');
		});
		await db.query('DELETE FROM codigopasa WHERE proyecto=?', [id]);
		await zip(`src/public/archivos/pasantias/carpeta${id}/codigo`, `src/public/archivos/pasantias/carpeta${id}/codigo/Codigo${nombre2}.zip`);
		let ruta = `src/public/archivos/pasantias/carpeta${id}/codigo/Codigo${nombre2}.zip`;
		const newCod = {
			Ruta: ruta,
			Pasantia: id
		};
		await db.query('INSERT INTO codigopasa SET ?', [newCod]);
	}

	res.redirect('/pasantias');
});

module.exports = router;