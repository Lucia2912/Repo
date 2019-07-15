const { format } = require('timeago.js');

const helpers = {};

helpers.timeago = (timestamp) => {
	return format(timestamp);
};

helpers.ifEquals = (arg1, arg2, options) => {
	if(arg1 === arg2) {
		return options.fn(this);
	  }
	  return options.inverse(this);
};

helpers.dateFormat = (date) => {
	var day = new Date(date), m = '' + (day.getMonth() + 1), d = '' + day.getDate(), y = day.getFullYear();
	if(m.length < 2){
		m = '0' + m;
	}
	if(d.length < 2){
		d = '0' + d;
	}
	return [d, m, y].join('/');
}

helpers.formatoFecha = (date) => {
	var day = new Date(date), m = '' + (day.getMonth() + 1), d = '' + day.getDate(), y = day.getFullYear();
	if(m.length < 2){
		m = '0' + m;
	}
	if(d.length < 2){
		d = '0' + d;
	}
	return [y, m, d].join('-');
}


module.exports = helpers;