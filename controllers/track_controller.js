var fs = require('fs');
var track_model = require('./../models/track');
var express = require('express');
var http = require('http');
var querystring = require('querystring');
var request = require('request');
var FormData = require('form-data');
var needle = require('needle');

// Devuelve una lista de las canciones disponibles y sus metadatos
exports.list = function (req, res) {
	var tracks = track_model.tracks;
	res.render('tracks/index', {tracks: tracks});
};

// Devuelve la vista del formulario para subir una nueva canción
exports.new = function (req, res) {
	res.render('tracks/new');
};

// Devuelve la vista de reproducción de una canción.
// El campo track.url contiene la url donde se encuentra el fichero de audio
exports.show = function (req, res) {
	var track = track_model.tracks[req.params.trackId];
	track.id = req.params.trackId;
	console.log(track);
	
	res.render('tracks/show', {track: track});
};

// Escribe una nueva canción en el registro de canciones.
// TODO:
// - Escribir en tracks.cdpsfy.es el fichero de audio contenido en req.files.track.buffer
// - Escribir en el registro la verdadera url generada al añadir el fichero en el servidor tracks.cdpsfy.es
exports.create = function (req, res) {
	var track = req.files.track;
	console.log('Nuevo fichero de audio. Datos: ', track);
	var id = track.name.split('.')[0];
	var name = track.originalname.split('.')[0];
	//var data = track.buffer;
	
	console.log(track.buffer);

	// Aquí debe implementarse la escritura del fichero de audio (track.buffer) en tracks.cdpsfy.es
	
	var data = {
		file: {
			buffer: track.buffer,
			filename: name,
			content_type: 'audio/mp3'
		}
	}

	needle.post('tracks.cdpsfy.es', data, {multipart: true}, function optionalCallback(err, httpResponse, body) {
	  if (err) {
	    return console.error('upload failed:', err);
	  }
	  console.log('Upload successful!  Server responded with:', body);
	});
	// Se ha realizado un envío del formulario al lb

	// Esta url debe ser la correspondiente al nuevo fichero en tracks.cdpsfy.es

	var url = 'tracks.cdpsfy.es/' + track.originalname;

	// Escribe los metadatos de la nueva canción en el registro.
	track_model.tracks[id] = {
		name: name,
		url: url
	};
	res.redirect('/tracks');
	//res.redirect('http://server.cdpsfy.es/tracks');
};

// Borra una canción (trackId) del registro de canciones 
// TODO:
// - Eliminar en tracks.cdpsfy.es el fichero de audio correspondiente a trackId
exports.destroy = function (req, res) {
	var trackId = req.params.trackId;

	// Aquí debe implementarse el borrado del fichero de audio indetificado por trackId en tracks.cdpsfy.es
	
	/*var data = {
	  name : track.name
	}
	
	needle.request('get', 'http://localhost:3000/download', data, function(err, resp) {
	  if (err) {
	    return console.error('Download failed:', err);
	  }
	  console.log('Download successful!  Server responded with:', resp.body);
	  
	});
	console.log(track.url);	*/

	// Borra la entrada del registro de datos
	delete track_model.tracks[trackId];
	res.redirect('/tracks');
};
