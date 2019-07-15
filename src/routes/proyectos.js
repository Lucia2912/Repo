const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs-extra');
const fss = require('fs');
const db = require('../database');
const uuid = require('uuid/v4');
const { zip } = require('zip-a-folder');
const { isLoggedIn, isNotLoggedIn, verLoBasico, isAdminorSuper, isSuperAdmin, isNotVisitante, isVisitante } = require('../lib/auth');

router.get('/', isLoggedIn, async (req, res) => {
	const proyectos = await db.query('SELECT * FROM proyecto  ORDER BY anioRealizacion DESC');
	res.render('publicaciones/listProy', { proyectos });
});

router.post('/', isLoggedIn, async (req, res) => {
	const { filtro } = req.body;
	const proyectos = await db.query('SELECT * FROM proyecto where titulo like ? ORDER BY anioRealizacion DESC', [filtro] + '%');
	let mensaje = "No se han encontrado resultados";
	if (proyectos.length > 0) {
		res.render('publicaciones/listProy', { proyectos });
	} else {
		res.render('publicaciones/listProy', { mensaje });
	}

});

router.get('/descargarCodigo/:id', isLoggedIn, isNotVisitante, async (req, res) => {
	console.log(req.params);
	const { id } = req.params;
	const p = await db.query('SELECT * FROM proyecto WHERE id=?', [id]);
	var file = __dirname + `/archivos/proyectos/` + p[0].titulo.trim() + p[0].anioRealizacion + `/codigo/Codigo` + p[0].titulo.trim() + p[0].anioRealizacion + `.zip`;
	var fileO = file.replace("routes", "public");
	console.log(fileO);
	res.download(fileO);
});

router.get('/descargarPres/:id', isLoggedIn, isNotVisitante, async (req, res) => {
	console.log(req.params);
	const { id } = req.params;
	const pre = await db.query('SELECT * FROM presentproy WHERE id=?', [id]);
	var file = __dirname + pre[0].Ruta;
	var fileO = file.replace("routes", "public");
	console.log(fileO);
	res.download(fileO);
});

router.get('/detalles/:id', verLoBasico, async (req, res) => {
	const { id } = req.params;
	const proy = await db.query('SELECT * FROM proyecto  WHERE id=?', [id]);
	const trib = await db.query('SELECT * FROM tribunal WHERE proyecto=?', [id]);
	const grupo = await db.query('SELECT * FROM grupoproyecto WHERE Proyecto=?', [id]);
	const banner = await db.query('SELECT * FROM bannerproy  WHERE Proyecto=?', [id]);
	const resu = await db.query('SELECT * FROM resumenpdf  WHERE Proyecto=?', [id]);
	const imgs = await db.query('SELECT * FROM galeriaproy  WHERE Proyecto=?', [id]);
	const vidPres = await db.query('SELECT * FROM videopresproy  WHERE Proyecto=?', [id]);
	const cod = await db.query('SELECT * FROM codigoproy  WHERE Proyecto=?', [id]);
	const vid = await db.query('SELECT * FROM videosproy  WHERE Proyecto=?', [id]);
	const proyecto = proy[0];
	res.render('publicaciones/detProyUsu', { proyecto, vid, cod, imgs, trib, grupo, banner, resu, vidPres });
});

router.get('/detalle/:id', isLoggedIn, isNotVisitante, async (req, res) => {
	const { id } = req.params;
	const proy = await db.query('SELECT * FROM proyecto  WHERE id=?', [id]);
	const trib = await db.query('SELECT * FROM tribunal WHERE proyecto=?', [id]);
	const grupo = await db.query('SELECT * FROM grupoproyecto WHERE Proyecto=?', [id]);
	const banner = await db.query('SELECT * FROM bannerproy  WHERE Proyecto=?', [id]);
	//const cod = await db.query('SELECT Ruta FROM codigoproy  WHERE Proyecto=?', [id]);
	const docu = await db.query('SELECT * FROM documentproy  WHERE Proyecto=?', [id]);
	const invest = await db.query('SELECT * FROM investproy  WHERE Proyecto=?', [id]);
	const pres = await db.query('SELECT * FROM presentproy  WHERE Proyecto=?', [id]);
	const resu = await db.query('SELECT * FROM resumenpdf  WHERE Proyecto=?', [id]);
	const vid = await db.query('SELECT * FROM videosproy  WHERE Proyecto=?', [id]);
	const imgs = await db.query('SELECT * FROM galeriaproy  WHERE Proyecto=?', [id]);
	const vidPres = await db.query('SELECT * FROM videopresproy  WHERE Proyecto=?', [id]);
	const proyecto = proy[0];
	res.render('publicaciones/detProy', { proyecto, imgs, trib, grupo, banner, docu, invest, pres, resu, vid, vidPres });
});

router.get('/NuevoProyecto', isLoggedIn, isAdminorSuper, (req, res) => {
	res.render('publicaciones/proyecto');
});

router.post('/NuevoProyecto', async (req, res) => {
	const { titulo, anio, inicio, fin, resumen, tutorA, tutorC, empr, linkPres } = req.body;
	const titulo2 = titulo.trim();

	let id = 0;
	if (titulo != "" && anio != "" && inicio != "" && fin != "" && tutorA != "" && tutorC != "" && empr != "") {
		const newProy = {
			titulo: titulo,
			anioRealizacion: anio,
			FechaInicio: inicio,
			FechaFin: fin,
			TutorAcademico: tutorA,
			TutorCliente: tutorC,
			Empresa: empr,
			resumen: resumen,
			link: linkPres
		};
		const result = await db.query('INSERT INTO proyecto SET ?', [newProy]);
		id = result.insertId;
	}

	if (!fs.existsSync(`src/public/archivos/proyectos/`)) {
		fs.mkdirSync(`src/public/archivos/proyectos/`);
	}
	if (!fs.existsSync(`src/public/archivos/proyectos/carpeta${id}/`)) {
		fs.mkdirSync(`src/public/archivos/proyectos/carpeta${id}/`);
	}
	if (!fs.existsSync(`src/public/archivos/proyectos/carpeta${id}/video`)) {
		fs.mkdirSync(`src/public/archivos/proyectos/carpeta${id}/video`);
	}

	fs.readdir(`src/public/archivos/videos/`, function (err, files) {
		if (files.length > 0) {
			files.forEach(async function (file) {
				var nombrecito = path.basename(file);
				const vid = `src/public/archivos/videos/${nombrecito}`
				const origen = path.resolve(`src/public/archivos/proyectos/carpeta${id}/video/${nombrecito}`);
				await fs.rename(vid, origen);
				let ruta = `/archivos/proyectos/carpeta${id}/video/${nombrecito}`;
				const newvid = {
					Ruta: ruta,
					Proyecto: id
				};
				await db.query('INSERT INTO videosproy SET ?', [newvid]);
			})
		}
	})

	if (req.files.length > 0) {
		for (var i = 0; i < req.files.length; i++) {
			if (req.files[i].fieldname == "pro-image") {
				if (!fs.existsSync(`src/public/archivos/proyectos/carpeta${id}/galeria`)) {
					fs.mkdirSync(`src/public/archivos/proyectos/carpeta${id}/galeria`);
				}
				const temp = req.files[i].path;
				let idecito = uuid();
				const e = path.extname(req.files[i].originalname).toLocaleLowerCase();
				const orig = path.resolve(`src/public/archivos/proyectos/carpeta${id}/galeria/img${idecito}${e}`);
				await fs.rename(temp, orig);
				let ruta = `/archivos/proyectos/carpeta${id}/galeria/img${idecito}${e}`;
				const newImgs = {
					Ruta: ruta,
					Proyecto: id
				};
				await db.query('INSERT INTO galeriaproy SET ?', [newImgs]);
			}
			if (req.files[i].fieldname == "resumenpdf") {
				if (!fs.existsSync(`src/public/archivos/proyectos/carpeta${id}/resumen`)) {
					fs.mkdirSync(`src/public/archivos/proyectos/carpeta${id}/resumen`);
				}
				const temp = req.files[i].path;
				const e = path.extname(req.files[i].originalname).toLocaleLowerCase();
				const orig = path.resolve(`src/public/archivos/proyectos/carpeta${id}/resumen/resumenPDF${e}`);
				await fs.rename(temp, orig);
				let ruta = `/archivos/proyectos/carpeta${id}/resumen/resumenPDf${e}`;
				const newres = {
					Ruta: ruta,
					Proyecto: id
				};
				await db.query('INSERT INTO resumenpdf SET ?', [newres]);
			}
			if (req.files[i].fieldname == "videoPres") {
				if (!fs.existsSync(`src/public/archivos/proyectos/carpeta${id}/videoPres`)) {
					fs.mkdirSync(`src/public/archivos/proyectos/carpeta${id}/videoPres`);
				}
				const temp = req.files[i].path;
				const e = path.extname(req.files[i].originalname).toLocaleLowerCase();
				const orig = path.resolve(`src/public/archivos/proyectos/carpeta${id}/videoPres/videoPres${e}`);
				await fs.rename(temp, orig);
				let ruta = `/archivos/proyectos/carpeta${id}/videoPres/videoPres${e}`;
				const newVid = {
					Ruta: ruta,
					Proyecto: id
				};
				await db.query('INSERT INTO videopresproy SET ?', [newVid]);
			}
			if (req.files[i].fieldname == "banner") {
				if (!fs.existsSync(`src/public/archivos/proyectos/carpeta${id}/banner`)) {
					fs.mkdirSync(`src/public/archivos/proyectos/carpeta${id}/banner`);
				}
				const temp = req.files[i].path;
				const e = path.extname(req.files[i].originalname).toLocaleLowerCase();
				const orig = path.resolve(`src/public/archivos/proyectos/carpeta${id}/banner/banner${e}`);
				await fs.rename(temp, orig);
				let ruta = `/archivos/proyectos/carpeta${id}/banner/banner${e}`;
				const newb = {
					Ruta: ruta,
					Proyecto: id
				};
				await db.query('INSERT INTO bannerproy SET ?', [newb]);
			}
			if (req.files[i].fieldname == "present") {
				if (!fs.existsSync(`src/public/archivos/proyectos/carpeta${id}/presentacion`)) {
					fs.mkdirSync(`src/public/archivos/proyectos/carpeta${id}/presentacion`);
				}
				const temp = req.files[i].path;
				let idecito = uuid();
				const e = path.extname(req.files[i].originalname).toLocaleLowerCase();
				const orig = path.resolve(`src/public/archivos/proyectos/carpeta${id}/presentacion/present${idecito}${e}`);
				await fs.rename(temp, orig);
				let ruta = `/archivos/proyectos/carpeta${id}/presentacion/present${idecito}${e}`;
				const newpres = {
					Ruta: ruta,
					Proyecto: id
				};
				await db.query('INSERT INTO presentproy SET ?', [newpres]);
			}
			if (req.files[i].fieldname == "invest") {
				if (!fs.existsSync(`src/public/archivos/proyectos/carpeta${id}/investigacion`)) {
					fs.mkdirSync(`src/public/archivos/proyectos/carpeta${id}/investigacion`);
				}
				const temp = req.files[i].path;
				let idecito = uuid();
				const e = path.extname(req.files[i].originalname).toLocaleLowerCase();
				const orig = path.resolve(`src/public/archivos/proyectos/carpeta${id}/investigacion/invest${idecito}${e}`);
				await fs.rename(temp, orig);
				let ruta = `/archivos/proyectos/carpeta${id}/investigacion/invest${idecito}${e}`;
				const newinv = {
					Ruta: ruta,
					Proyecto: id
				};
				await db.query('INSERT INTO investproy SET ?', [newinv]);
			}
			if (req.files[i].fieldname == "documents") {
				if (!fs.existsSync(`src/public/archivos/proyectos/carpeta${id}/documentacion`)) {
					fs.mkdirSync(`src/public/archivos/proyectos/carpeta${id}/documentacion`);
				}
				const temp = req.files[i].path;
				let idecito = uuid();
				const e = path.extname(req.files[i].originalname).toLocaleLowerCase();
				const orig = path.resolve(`src/public/archivos/proyectos/carpeta${id}/documentacion/doc${idecito}${e}`);
				await fs.rename(temp, orig);
				let ruta = `/archivos/proyectos/carpeta${id}/documentacion/doc${idecito}${e}`;
				const newdoc = {
					Ruta: ruta,
					Proyecto: id
				};
				await db.query('INSERT INTO documentproy SET ?', [newdoc]);
			}
			if (req.files[i].fieldname == "codigo") {
				if (!fs.existsSync(`src/public/archivos/proyectos/carpeta${id}/codigo`)) {
					fs.mkdirSync(`src/public/archivos/proyectos/carpeta${id}/codigo`);
				}
				const temp = req.files[i].path;
				let idecito = uuid();
				const e = path.extname(req.files[i].originalname).toLocaleLowerCase();
				const orig = path.resolve(`src/public/archivos/proyectos/carpeta${id}/codigo/cod${idecito}${e}`);
				await fs.rename(temp, orig);
			}
		}
	}

	/*const { linkPres } = req.body;
	if (linkPres !== null && linkPres !== '') {
		let ruta = linkPres;
		const newpres = {
			Ruta: ruta,
			Proyecto: id
		};
		await db.query('INSERT INTO presentproy SET ?', [newpres]);
	}*/

	if (fs.existsSync(`src/public/archivos/proyectos/carpeta${id}/codigo`)) {
		fs.readdir(`src/public/archivos/proyectos/carpeta${id}/codigo`, async function (err, files) {
			if (files.length > 0) {
				await zip(`src/public/archivos/proyectos/carpeta${id}/codigo`, `src/public/archivos/proyectos/carpeta${id}/codigo/Codigo${titulo2}${anio}.zip`);
				let ruta = `/archivos/proyectos/carpeta${id}/codigo/Codigo${titulo2}${anio}.zip`;
				const newcod = {
					Ruta: ruta,
					Proyecto: id
				};
				await db.query('INSERT INTO codigoproy SET ?', [newcod]);
			}
		});
	}

	var notas = [];
	var nombre = [];
	var nomTrib = [];
	var cargos = [];
	var emprTrib = [];
	for (let key in req.body) {
		//value = req.body[key];
		if (key.includes('nota')) {
			notas.push(key);
		}
		if (key.includes('name')) {
			nombre.push(key);
		}
		if (key.includes('nombreC')) {
			nomTrib.push(key);
		}
		if (key.includes('cargo')) {
			cargos.push(key);
		}
		if (key.includes('emprTut')) {
			emprTrib.push(key);
		}

	}
	for (let i = 0; i < notas.length; i++) {
		if (req.body[nombre[i]] != null && req.body[nombre[i]] != null && req.body[notas[i]] != '' && req.body[notas[i]] != '') {
			const integ = {
				NombreCompleto: req.body[nombre[i]],
				Nota: req.body[notas[i]],
				Proyecto: id
			};
			await db.query('INSERT INTO grupoproyecto SET ?', [integ]);
		}
	}

	for (let i = 0; i < nomTrib.length; i++) {
		if (req.body[nomTrib[i]] != null && req.body[nomTrib[i]] != null && req.body[cargos[i]] != '' && req.body[cargos[i]] != '' && req.body[emprTrib[i]] != '' && req.body[emprTrib[i]] != '') {
			const intTrib = {
				NombreCompleto: req.body[nomTrib[i]],
				cargo: req.body[cargos[i]],
				empresa: req.body[emprTrib[i]],
				Proyecto: id
			};
			await db.query('INSERT INTO tribunal SET ?', [intTrib]);
		}
	}
	res.redirect('/proyectos');
});

router.post('/video', async (req, res) => {
	for (let i = 0; i < req.files.length; i++) {
		const temp = req.files[i].path;
		let idecito = uuid();
		const e = path.extname(req.files[i].originalname).toLocaleLowerCase();
		const orig = path.resolve(`src/public/archivos/videos/video${idecito}${e}`);
		await fs.rename(temp, orig);
	}
	res.send("Subido");
});

router.get('/editar/:id', isLoggedIn, isNotVisitante, async (req, res) => {
	const { id } = req.params;
	const proy = await db.query('SELECT * FROM proyecto  WHERE id=?', [id]);
	const trib = await db.query('SELECT * FROM tribunal WHERE proyecto=? order by id ASC', [id]);
	const grupo = await db.query('SELECT * FROM grupoproyecto WHERE Proyecto=? order by id ASC', [id]);
	const banner = await db.query('SELECT * FROM bannerproy  WHERE Proyecto=?', [id]);
	const cod = await db.query('SELECT * FROM codigoproy  WHERE Proyecto=?', [id]);
	const docu = await db.query('SELECT * FROM documentproy  WHERE Proyecto=?', [id]);
	const invest = await db.query('SELECT * FROM investproy  WHERE Proyecto=?', [id]);
	const pres = await db.query('SELECT * FROM presentproy  WHERE Proyecto=?', [id]);
	const resu = await db.query('SELECT * FROM resumenpdf  WHERE Proyecto=?', [id]);
	const vid = await db.query('SELECT * FROM videosproy  WHERE Proyecto=?', [id]);
	const imgs = await db.query('SELECT * FROM galeriaproy  WHERE Proyecto=?', [id]);
	const vidPres = await db.query('SELECT * FROM videopresproy  WHERE Proyecto=?', [id]);
	const proyecto = proy[0];
	res.render('publicaciones/editarProy', { proyecto, cod, imgs, trib, grupo, banner, docu, invest, pres, resu, vid, vidPres });
});

router.post('/editar/:id', isLoggedIn, isNotVisitante, async (req, res) => {
	const { id } = req.params;
	const { titulo, anio, inicio, fin, resumen, link, tutA, tutC, emp, nom, notita, nomCom, cargoTut, Tutempr } = req.body;
	const proy = await db.query('SELECT * FROM proyecto  WHERE id=?', [id]);
	const trib = await db.query('SELECT * FROM tribunal WHERE proyecto=? order by id ASC', [id]);
	const grupo = await db.query('SELECT * FROM grupoproyecto WHERE Proyecto=? order by id ASC', [id]);
	const titulo2 = titulo.trim();

	if (proy[0].titulo !== titulo) {
		await db.query('UPDATE proyecto SET titulo=? WHERE id=?', [titulo, [id]]);
	}
	if (proy[0].anioRealizacion.toString() !== anio) {
		await db.query('UPDATE proyecto SET anioRealizacion=? WHERE id=?', [anio, [id]]);
	}
	if (proy[0].FechaInicio !== inicio) {
		await db.query('UPDATE proyecto SET FechaInicio=? WHERE id=?', [inicio, [id]]);
	}
	if (proy[0].FechaFin !== fin) {
		await db.query('UPDATE proyecto SET FechaFin=? WHERE id=?', [fin, [id]]);
	}
	if (proy[0].TutorAcademico !== tutA) {
		await db.query('UPDATE proyecto SET TutorAcademico=? WHERE id=?', [tutA, [id]]);
	}
	if (proy[0].TutorCliente !== tutC) {
		await db.query('UPDATE proyecto SET TutorCliente=? WHERE id=?', [tutC, [id]]);
	}
	if (proy[0].Empresa !== emp) {
		await db.query('UPDATE proyecto SET Empresa=? WHERE id=?', [emp, [id]]);
	}
	if (proy[0].resumen !== resumen) {
		await db.query('UPDATE proyecto SET resumen=? WHERE id=?', [resumen, [id]]);
	}
	if (proy[0].link !== link) {
		await db.query('UPDATE proyecto SET link=? WHERE id=?', [link, [id]]);
	}

	for (let i = 0; i < grupo.length; i++) {
		if (grupo[i].NombreCompleto !== nom[i]) {
			await db.query('UPDATE grupoproyecto SET NombreCompleto=? WHERE id=?', [nom[i], grupo[i].id]);
		}
		if (grupo[i].Nota !== notita[i]) {
			await db.query('UPDATE grupoproyecto SET Nota=? WHERE id=?', [notita[i], grupo[i].id]);
		}
	}


	for (let i = 0; i < trib.length; i++) {
		if (trib[i].NombreCompleto !== nomCom[i]) {
			await db.query('UPDATE tribunal SET NombreCompleto=? WHERE id=?', [nomCom[i], trib[i].id]);
		}
		if (trib[i].cargo !== cargoTut[i]) {
			await db.query('UPDATE tribunal SET cargo=? WHERE id=?', [cargoTut[i], trib[i].id]);
		}
		if (trib[i].empresa !== Tutempr[i]) {
			await db.query('UPDATE tribunal SET empresa=? WHERE id=?', [Tutempr[i], trib[i].id]);
		}
	}

	var notas = [];
	var nombre = [];
	var nomTrib = [];
	var cargos = [];
	var emprTrib = [];
	for (let key in req.body) {
		//value = req.body[key];
		if (key.includes('nota')) {
			notas.push(key);
		}
		if (key.includes('name')) {
			nombre.push(key);
		}
		if (key.includes('nombreC')) {
			nomTrib.push(key);
		}
		if (key.includes('cargoTut')) {
			cargos.push(key);
		}
		if (key.includes('Tutempr')) {
			emprTrib.push(key);
		}

	}
	for (let i = 0; i < notas.length; i++) {
		if (req.body[nombre[i]] != null && req.body[nombre[i]] != null && req.body[notas[i]] != '' && req.body[notas[i]] != '') {
			const integ = {
				NombreCompleto: req.body[nombre[i]],
				Nota: req.body[notas[i]],
				Proyecto: id
			};
			await db.query('INSERT INTO grupoproyecto SET ?', [integ]);
		}
	}

	for (let i = 0; i < nomTrib.length; i++) {
		if (req.body[nomTrib[i]] != null && req.body[nomTrib[i]] != null && req.body[cargos[i]] != '' && req.body[cargos[i]] != '' && req.body[emprTrib[i]] != '' && req.body[emprTrib[i]] != '') {
			const intTrib = {
				NombreCompleto: req.body[nomTrib[i]],
				cargo: req.body[cargos[i]],
				empresa: req.body[emprTrib[i]],
				Proyecto: id
			};
			await db.query('INSERT INTO tribunal SET ?', [intTrib]);
		}
	}

	fs.readdir(`src/public/archivos/videos/`, function (err, files) {
		if (files.length > 0) {
			files.forEach(async function (file) {
				var nombrecito = path.basename(file);
				const vid = `src/public/archivos/videos/${nombrecito}`
				const origen = path.resolve(`src/public/archivos/proyectos/carpeta${id}/video/${nombrecito}`);
				await fs.rename(vid, origen);
				let ruta = `/archivos/proyectos/carpeta${id}/video/${nombrecito}`;
				const newvid = {
					Ruta: ruta,
					Proyecto: id
				};
				await db.query('INSERT INTO videosproy SET ?', [newvid]);
			})
		}
	})

	for (var i = 0; i < req.files.length; i++) {
		if (req.files[i].fieldname == "pro-image") {
			if (!fs.existsSync(`src/public/archivos/proyectos/carpeta${id}/galeria`)) {
				fs.mkdirSync(`src/public/archivos/proyectos/carpeta${id}/galeria`);
			}
			const temp = req.files[i].path;
			let idecito = uuid();
			const e = path.extname(req.files[i].originalname).toLocaleLowerCase();
			const orig = path.resolve(`src/public/archivos/proyectos/carpeta${id}/galeria/img${idecito}${e}`);
			await fs.rename(temp, orig);
			let ruta = `/archivos/proyectos/carpeta${id}/galeria/img${idecito}${e}`;
			const newImgs = {
				Ruta: ruta,
				Proyecto: id
			};
			await db.query('INSERT INTO galeriaproy SET ?', [newImgs]);
		}
		if (req.files[i].fieldname == "resumenpdf") {
			if (!fs.existsSync(`src/public/archivos/proyectos/carpeta${id}/resumen`)) {
				fs.mkdirSync(`src/public/archivos/proyectos/carpeta${id}/resumen`);
			}
			const temp = req.files[i].path;
			let idecito = uuid();
			const e = path.extname(req.files[i].originalname).toLocaleLowerCase();
			const orig = path.resolve(`src/public/archivos/proyectos/carpeta${id}/resumen/resumen${idecito}${e}`);
			await fs.rename(temp, orig);
			let ruta = `/archivos/proyectos/carpeta${id}/resumen/resumen${idecito}${e}`;
			const newres = {
				Ruta: ruta,
				Proyecto: id
			};
			await db.query('INSERT INTO resumenpdf SET ?', [newres]);
		}
		if (req.files[i].fieldname == "videoPres") {
			if (!fs.existsSync(`src/public/archivos/proyectos/carpeta${id}/videoPres`)) {
				fs.mkdirSync(`src/public/archivos/proyectos/carpeta${id}/videoPres`);
			}
			const temp = req.files[i].path;
			const e = path.extname(req.files[i].originalname).toLocaleLowerCase();
			const orig = path.resolve(`src/public/archivos/proyectos/carpeta${id}/videoPres/videoPres${e}`);
			await fs.rename(temp, orig);
			let ruta = `/archivos/proyectos/carpeta${id}/videoPres/videoPres${e}`;
			const newVid = {
				Ruta: ruta,
				Proyecto: id
			};
			await db.query('INSERT INTO videopresproy SET ?', [newVid]);
		}
		if (req.files[i].fieldname == "banner") {
			if (!fs.existsSync(`src/public/archivos/proyectos/carpeta${id}/banner`)) {
				fs.mkdirSync(`src/public/archivos/proyectos/carpeta${id}/banner`);
			}
			const temp = req.files[i].path;
			const e = path.extname(req.files[i].originalname).toLocaleLowerCase();
			const orig = path.resolve(`src/public/archivos/proyectos/carpeta${id}/banner/banner${i}${e}`);
			await fs.rename(temp, orig);
			let ruta = `/archivos/proyectos/carpeta${id}/banner/banner${i}${e}`;
			const newb = {
				Ruta: ruta,
				Proyecto: id
			};
			await db.query('INSERT INTO bannerproy SET ?', [newb]);
		}
		if (req.files[i].fieldname == "present") {
			if (!fs.existsSync(`src/public/archivos/proyectos/carpeta${id}/presentacion`)) {
				fs.mkdirSync(`src/public/archivos/proyectos/carpeta${id}/presentacion`);
			}
			const temp = req.files[i].path;
			let idecito = uuid();
			const e = path.extname(req.files[i].originalname).toLocaleLowerCase();
			const orig = path.resolve(`src/public/archivos/proyectos/carpeta${id}/presentacion/present${idecito}${e}`);
			await fs.rename(temp, orig);
			let ruta = `/archivos/proyectos/carpeta${id}/presentacion/present${idecito}${e}`;
			const newpres = {
				Ruta: ruta,
				Proyecto: id
			};
			await db.query('INSERT INTO presentproy SET ?', [newpres]);
		}
		if (req.files[i].fieldname == "invest") {
			if (!fs.existsSync(`src/public/archivos/proyectos/carpeta${id}/investigacion`)) {
				fs.mkdirSync(`src/public/archivos/proyectos/carpeta${id}/investigacion`);
			}
			const temp = req.files[i].path;
			let idecito = uuid();
			const e = path.extname(req.files[i].originalname).toLocaleLowerCase();
			const orig = path.resolve(`src/public/archivos/proyectos/carpeta${id}/investigacion/invest${idecito}${e}`);
			await fs.rename(temp, orig);
			let ruta = `/archivos/proyectos/carpeta${id}/investigacion/invest${idecito}${e}`;
			const newinv = {
				Ruta: ruta,
				Proyecto: id
			};
			await db.query('INSERT INTO investproy SET ?', [newinv]);
		}
		if (req.files[i].fieldname == "documents") {
			if (!fs.existsSync(`src/public/archivos/proyectos/carpeta${id}/documentacion`)) {
				fs.mkdirSync(`src/public/archivos/proyectos/carpeta${id}/documentacion`);
			}
			const temp = req.files[i].path;
			let idecito = uuid();
			const e = path.extname(req.files[i].originalname).toLocaleLowerCase();
			const orig = path.resolve(`src/public/archivos/proyectos/carpeta${id}/documentacion/doc${idecito}${e}`);
			await fs.rename(temp, orig);
			let ruta = `/archivos/proyectos/carpeta${id}/documentacion/doc${idecito}${e}`;
			const newdoc = {
				Ruta: ruta,
				Proyecto: id
			};
			await db.query('INSERT INTO documentproy SET ?', [newdoc]);
		}
		if (req.files[i].fieldname == "codigo") {
			if (!fs.existsSync(`src/public/archivos/proyectos/carpeta${id}/codigo`)) {
				fs.mkdirSync(`src/public/archivos/proyectos/carpeta${id}/codigo`);
			}
			const temp = req.files[i].path;
			const e = path.extname(req.files[i].originalname).toLocaleLowerCase();
			const orig = path.resolve(`src/public/archivos/proyectos/carpeta${id}/codigo/cod${i}${e}`);
			await fs.rename(temp, orig);
		}
	}

	/*const { linkPres } = req.body;
	if (linkPres !== null && linkPres !== '') {
		let ruta = linkPres;
		const newpres = {
			Ruta: ruta,
			Proyecto: id
		};
		await db.query('INSERT INTO presentproy SET ?', [newpres]);
	}*/

	if (fs.existsSync(`src/public/archivos/proyectos/carpeta${id}/codigo`)) {
		const doc = await db.query('SELECT * FROM codigoproy WHERE Proyecto=?', [id]);
		let rut = "src/public/" + doc[0].Ruta;
		fs.unlink(rut, function (err) {
			if (err) throw err;
			console.log('File deleted!');
		});
		await db.query('DELETE FROM codigoproy WHERE proyecto=?', [id]);
		await zip(`src/public/archivos/proyectos/carpeta${id}/codigo`, `src/public/archivos/proyectos/carpeta${id}/codigo/Codigo${titulo2}${anio}.zip`);
		let ruta = `src/public/archivos/proyectos/carpeta${id}/codigo/Codigo${titulo2}${anio}.zip`;
		const newCod = {
			Ruta: ruta,
			Proyecto: id
		};
		await db.query('INSERT INTO codigoproy SET ?', [newCod]);
	}
	res.redirect('/proyectos');

});

router.get('/eliminar/:id', isLoggedIn, isNotVisitante, async (req, res) => {
	const { id } = req.params;
	const p = await db.query('SELECT * FROM proyecto WHERE id=?', [id]);
	await fs.remove(`src/public/archivos/proyectos/carpeta${id}/`);
	await db.query('DELETE FROM tribunal WHERE proyecto=?', [id]);
	await db.query('DELETE FROM grupoproyecto WHERE proyecto=?', [id]);
	await db.query('DELETE FROM bannerproy WHERE proyecto=?', [id]);
	await db.query('DELETE FROM codigoproy WHERE proyecto=?', [id]);
	await db.query('DELETE FROM documentproy WHERE proyecto=?', [id]);
	await db.query('DELETE FROM galeriaproy WHERE proyecto=?', [id]);
	await db.query('DELETE FROM investproy WHERE proyecto=?', [id]);
	await db.query('DELETE FROM presentproy WHERE proyecto=?', [id]);
	await db.query('DELETE FROM resumenpdf WHERE proyecto=?', [id]);
	await db.query('DELETE FROM videopresproy WHERE proyecto=?', [id]);
	await db.query('DELETE FROM videosproy WHERE proyecto=?', [id]);
	await db.query('DELETE FROM proyecto WHERE id=?', [id]);
	res.redirect('/proyectos');
});

router.get('/eliminarImg/:id', isLoggedIn, isNotVisitante, async (req, res) => {
	const { id } = req.params;
	const img = await db.query('SELECT * FROM galeriaproy WHERE id=?', [id]);
	const idecito = img[0].Proyecto;
	let rut = "src/public/" + img[0].Ruta;
	fs.unlink(rut, function (err) {
		if (err) throw err;
		console.log('File deleted!');
	});
	await db.query('DELETE FROM galeriaproy WHERE id=?', [id]);
	res.redirect(`/proyectos/editar/${idecito}`);
});

router.get('/eliminarDoc/:id', isLoggedIn, isNotVisitante, async (req, res) => {
	const { id } = req.params;
	const doc = await db.query('SELECT * FROM documentproy WHERE id=?', [id]);
	const idecito = doc[0].Proyecto;
	let rut = "src/public/" + doc[0].Ruta;
	fs.unlink(rut, function (err) {
		if (err) throw err;
		console.log('File deleted!');
	});
	await db.query('DELETE FROM documentproy WHERE id=?', [id]);
	res.redirect(`/proyectos/editar/${idecito}`);
});

router.get('/eliminarVid/:id', isLoggedIn, isNotVisitante, async (req, res) => {
	const { id } = req.params;
	const doc = await db.query('SELECT * FROM videosproy WHERE id=?', [id]);
	const idecito = doc[0].Proyecto;
	let rut = "src/public/" + doc[0].Ruta;
	fs.unlink(rut, function (err) {
		if (err) throw err;
		console.log('File deleted!');
	});
	await db.query('DELETE FROM videosproy WHERE id=?', [id]);
	res.redirect(`/proyectos/editar/${idecito}`);
});

router.get('/eliminarVidP/:id', isLoggedIn, isNotVisitante, async (req, res) => {
	const { id } = req.params;
	const doc = await db.query('SELECT * FROM videopresproy WHERE id=?', [id]);
	const idecito = doc[0].Proyecto;
	let rut = "src/public/" + doc[0].Ruta;
	fs.unlink(rut, function (err) {
		if (err) throw err;
		console.log('File deleted!');
	});
	await db.query('DELETE FROM videopresproy WHERE id=?', [id]);
	res.redirect(`/proyectos/editar/${idecito}`);
});

router.get('/eliminarCod/:id', isLoggedIn, isNotVisitante, async (req, res) => {
	const { id } = req.params;
	const doc = await db.query('SELECT * FROM codigoproy WHERE id=?', [id]);
	const idecito = doc[0].Proyecto;
	let rut = "src/public/" + doc[0].Ruta;
	fs.unlink(rut, function (err) {
		if (err) throw err;
		console.log('File deleted!');
	});
	await db.query('DELETE FROM codigoproy WHERE id=?', [id]);
	res.redirect(`/proyectos/editar/${idecito}`);
});

router.get('/eliminarP/:id', isLoggedIn, isNotVisitante, async (req, res) => {
	const { id } = req.params;
	const doc = await db.query('SELECT * FROM presentproy WHERE id=?', [id]);
	const idecito = doc[0].Proyecto;
	let rut = "src/public/" + doc[0].Ruta;
	fs.unlink(rut, function (err) {
		if (err) throw err;
		console.log('File deleted!');
	});
	await db.query('DELETE FROM presentproy WHERE id=?', [id]);
	res.redirect(`/proyectos/editar/${idecito}`);
});

router.get('/eliminarBan/:id', isLoggedIn, isNotVisitante, async (req, res) => {
	const { id } = req.params;
	const doc = await db.query('SELECT * FROM bannerproy WHERE id=?', [id]);
	const idecito = doc[0].Proyecto;
	let rut = "src/public/" + doc[0].Ruta;
	fs.unlink(rut, function (err) {
		if (err) throw err;
		console.log('File deleted!');
	});
	await db.query('DELETE FROM bannerproy WHERE id=?', [id]);
	res.redirect(`/proyectos/editar/${idecito}`);
});

router.get('/eliminarRes/:id', isLoggedIn, isNotVisitante, async (req, res) => {
	const { id } = req.params;
	const doc = await db.query('SELECT * FROM resumenpdf WHERE id=?', [id]);
	const idecito = doc[0].Proyecto;
	let rut = "src/public/" + doc[0].Ruta;
	fs.unlink(rut, function (err) {
		if (err) throw err;
		console.log('File deleted!');
	});
	await db.query('DELETE FROM resumenpdf WHERE id=?', [id]);
	res.redirect(`/proyectos/editar/${idecito}`);
});

router.get('/eliminarInv/:id', isLoggedIn, isNotVisitante, async (req, res) => {
	const { id } = req.params;
	const doc = await db.query('SELECT * FROM investproy WHERE id=?', [id]);
	const idecito = doc[0].Proyecto;
	let rut = "src/public/" + doc[0].Ruta;
	fs.unlink(rut, function (err) {
		if (err) throw err;
		console.log('File deleted!');
	});
	await db.query('DELETE FROM investproy WHERE id=?', [id]);
	res.redirect(`/proyectos/editar/${idecito}`);
});

router.get('/eliminarVid/:id', isLoggedIn, isNotVisitante, async (req, res) => {
	const { id } = req.params;
	const doc = await db.query('SELECT * FROM videoprespas WHERE id=?', [id]);
	const idecito = doc[0].Proyecto;
	let rut = "src/public/" + doc[0].Ruta;
	fs.unlink(rut, function (err) {
		if (err) throw err;
		console.log('File deleted!');
	});
	await db.query('DELETE FROM videoprespas WHERE id=?', [id]);
	res.redirect(`/proyectos/editar/${idecito}`);
});

router.get('/eliminarCod/:id', isLoggedIn, isNotVisitante, async (req, res) => {
	const { id } = req.params;
	const doc = await db.query('SELECT * FROM codigopasa WHERE id=?', [id]);
	const idecito = doc[0].Proyecto;
	let rut = "src/public/" + doc[0].Ruta;
	fs.unlink(rut, function (err) {
		if (err) throw err;
		console.log('File deleted!');
	});
	await db.query('DELETE FROM codigopasa WHERE id=?', [id]);
	res.redirect(`/proyectos/editar/${idecito}`);
});

router.get('/eliminarInt/:id', isLoggedIn, isNotVisitante, async (req, res) => {
	const { id } = req.params;
	console.log(id);
	const p = await db.query('Select * from grupoproyecto WHERE id=?', [id]);
	const idecito = p[0].Proyecto;
	console.log(idecito);
	await db.query('DELETE FROM grupoproyecto WHERE id=?', [id]);
	res.redirect(`/proyectos/editar/${idecito}`);
});

router.get('/eliminarTrib/:id', isLoggedIn, isNotVisitante, async (req, res) => {
	const { id } = req.params;
	console.log(id);
	const p = await db.query('Select * from tribunal WHERE id=?', [id]);
	const idecito = p[0].Proyecto;
	console.log(idecito);
	await db.query('DELETE FROM tribunal WHERE id=?', [id]);
	res.redirect(`/proyectos/editar/${idecito}`);
});

module.exports = router;