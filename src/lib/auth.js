const db = require('../database');
module.exports = {
    isLoggedIn(req, res, next){
        if(req.isAuthenticated()){
            return next();
        }
        return res.redirect('/signin');
    },

    isNotLoggedIn(req, res, next){
        if(!req.isAuthenticated()){
            return next();
        }
        return res.redirect('/profile');
    },
    isSuperAdmin(req, res, next){
        if(req.user.Rol === "SuperAdministrador"){
            return next();
        }
        return res.redirect('/404');
    },
    isAdmin(req, res, next){
        if(req.user.Rol === "Administrador"){
            return next();
        }
        return res.redirect('/404');
    }, 
    isIntermedio(req, res, next){
        if(req.user.Rol === "Intermedio"){
            return next();
        }
        return res.redirect('/404');
    },
    isVisitante(req, res, next){
        if(req.user.Rol === "Visitante"){
            return next();
        }
        return res.redirect('/404');
    },
    isAdminorSuper(req, res, next){
        if(req.user.Rol === "SuperAdministrador" || req.user.Rol === "Administrador"){
            return next();
        }
        return res.redirect('/404');
    },
    isNotVisitante(req, res, next){
        if(req.user.Rol !== "Visitante"){
            return next();
        }
        return res.redirect('/404');
    },
    verLoBasico(req, res, next){
        if(!req.isAuthenticated() || (req.user.Rol === "Visitante" && req.isAuthenticated())){
            return next();
        }
        return res.redirect('/404');
    }
};