var fs = require('fs');
var express = require('express');
var http = require('http');
var querystring = require('querystring');
var request = require('request');
var FormData = require('form-data');
var mongoose = require('mongoose');
var needle = require('needle');
var Tracks = mongoose.model('Track');
var Dialog = require('dialog');

// Devuelve una lista de las canciones disponibles y sus metadatos
exports.list = function (req, res) {
       
        Tracks.find(function(err, tracks) {
            if(err) res.send(500, err.message);
            res.render('tracks/index', {tracks: tracks});
        });
};

// Devuelve la vista del formulario para subir una nueva canción
exports.new = function (req, res) {
        res.render('tracks/new');
};

// Devuelve la vista de reproducción de una canción.
// El campo track.url contiene la url donde se encuentra el fichero de audio

exports.show = function (req, res) {
    
	console.log(req.params);
        Tracks.findOne({name: req.params.trackId}, function(err, track) {
	    if(err) return res.send(500, err.message);
            res.render('tracks/show', {track: track});
        });
};

// Escribe una nueva canción en el registro de canciones.

// - Escribir en tracks.cdpsfy.es el fichero de audio contenido en req.files.track.buffer
// - Escribir en el registro la verdadera url generada al añadir el fichero en el servidor tracks.cdpsfy.es
exports.create = function (req, res) {
        var track = req.files.track;
	if(track!==undefined){
		console.log('Nuevo fichero de audio. Datos: ', track);
		var id = track.name.split('.')[0];
		var name = track.originalname.split('.')[0];
		var datos = track.buffer;
		var original = track.originalname; 
		var ext = track.mimetype.split('/')[1];
		if(ext == 'mp3' || ext == 'ogg' || ext== 'wav'){
			console.log(ext);
			var image = req.files.image;
			if(image!==undefined){
				console.log('Nueva portada. Datos: ', image);
				var nameImg = image.originalname.split('.')[0];
				var datosImg =  image.buffer;
				var originalImg = image.originalname;
				var ext1 = image.mimetype.split('/')[1];
				if (ext1 == 'bmp' || ext1 == 'jpg' || ext1 == 'png' || ext1 == 'jpeg'){
					
					var data = {
					   image: {
						    buffer       : datosImg,
						    filename     : nameImg,
						    content_type: 'image/' + ext1
						  },
						  
					   track:  {
						    buffer       : datos,
						    filename     : name,
						    content_type: 'audio/'+ ext
						  }
					}
					// Esta url debe ser la correspondiente al nuevo fichero en tracks.cdpsfy.es
					var url = 'http://tracks.cdpsfy.es/cancion/' + name + '.' + ext;
					var urlImg = 'http://tracks.cdpsfy.es/imagen/' + nameImg + '.' + ext1;
					// Escribe los metadatos de la nueva canción en el registro.
					var new_track = new Tracks({
						name: name,
						url: url,
						imgname: nameImg + '.' + ext1,
						urlImg: urlImg
					 });

					new_track.save(function(err, new_track) {
						if (err) {
							console.log('Error al subir el audio: ' + err);
						};
					});
					needle.post('http://tracks.cdpsfy.es', data, {multipart: true}, function optionalCallback(err, httpResponse, body) {
					  if (err) {
					    return console.error('upload failed:', err);
					  }
					  console.log('Upload successful!  Server responded with:', body);
					  res.redirect('/tracks');
					});
				} else {
					concole.log('Introduzca una imagen. Extensiones soportadas: bmp, jpg, png, jpeg');
				}

			} else {
				var data = {
					 track:  {
					    buffer       : datos,
					    filename     : name,
					    content_type: 'audio/'+ ext
					  }
	 			}
				var url = 'http://tracks.cdpsfy.es/cancion/' + name + '.' + ext;
				var urlImg = 'http://tracks.cdpsfy/imagen/cover.jpg';

				// Escribe los metadatos de la nueva canción en el registro.
				 var new_track = new Tracks({
					name: name,
					url: url,
					imgname: 'cover.jpg',
					urlImg: urlImg
				 });

				 new_track.save(function(err, new_track) {
					if (err) {
						    console.log('Error al subir el audio: ' + err);
					};
				 });
				needle.post('http://tracks.cdpsfy.es', data, {multipart: true}, function optionalCallback(err, httpResponse, body) {
				  if (err) {
					return console.error('upload failed:', err);
				  }
				  console.log('Upload successful!  Server responded with:', body);
				  res.redirect('/tracks');
				});
			}
		} else { 
			console.log('Introduzca una cancion con la extension adecuada. Extensiones soportadas: mp3, ogg y wav');
			dialog.info('Debe introducir una cancion');
			res.redirect('/tracks/new');
		}
	} else { 
		console.log('Introduzca una canción');
	}
};

// Borra una canción (trackId) del registro de canciones 
// TODO:
// - Eliminar en tracks.cdpsfy.es el fichero de audio correspondiente a trackId
exports.destroy = function (req, res) {

	// Aquí debe implementarse el borrado del fichero de audio indetificado por trackId en tracks.cdpsfy.es
	
	Tracks.findOne({name: req.params.trackId}, function(err, track) {
	    needle.request('delete', 'http://tracks.cdpsfy.es/imagen/' + track.imgname, null, function(err, resp) {
		  if (err) {
		    return console.error('Delete failed:', err);
		  }
		  console.log('Delete successful!  Server responded with:', resp.body);
	    });
	    track.remove(function(err, track) {
                if (err) {
                        console.log('Error al borrar el audio: ' + err);
                };
            });
        });

	needle.request('delete', 'http://tracks.cdpsfy.es/cancion/' + req.params.trackId + '.mp3', null, function(err, resp) {
	  if (err) {
	    return console.error('Delete failed:', err);
	  }
	  console.log('Delete successful!  Server responded with:', resp.body);
	});

	res.redirect('/tracks');
};
