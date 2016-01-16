var fs = require('fs');
var models = require('./../models');
var express = require('express');
var http = require('http');
var querystring = require('querystring');
var request = require('request');
var FormData = require('form-data');
var mongoose = require('mongoose');
var needle = require('needle');
var Tracks = mongoose.model('Track');

// Devuelve una lista de las canciones disponibles y sus metadatos
exports.list = function (req, res) {
	/*var tracks = track_model.tracks;
	res.render('tracks/index', {tracks: tracks});*/
	
	Tracks.find(function(err, tracks) {
	    if(err) res.send(500, err.message);
	    console.log(jsonp(tracks));
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
	//var track = track_model.tracks[req.params.trackId];
	track.id = req.params.trackId;
	console.log(track.id);
	
	Tracks.findById(req.params.id, function(err, track) {
	    if(err) return res.send(500. err.message);

	    res.render('tracks/show', {track: track});
	});
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

	// Aquí debe implementarse la escritura del fichero de audio (track.buffer) en tracks.cdpsfy.es
	
	var data = {
		file: {
			buffer: track.buffer,
			filename: name,
			content_type: 'audio/mp3'
		}
	}

	needle.post('http://tracks.cdpsfy.es', data, {multipart: true}, function optionalCallback(err, httpResponse, body) {
	  if (err) {
	    return console.error('upload failed:', err);
	  }
	  console.log('Upload successful!  Server responded with:', body);
	});
	// Se ha realizado un envío del formulario al lb

	// Esta url debe ser la correspondiente al nuevo fichero en tracks.cdpsfy.es

	var url = 'http://tracks.cdpsfy.es/' + track.originalname;

	// Escribe los metadatos de la nueva canción en el registro.
	 var new_track = new Tracks({
		name: name,
            	url: url
	  });

	   new_track.save(function(err, new_track) {
		if (err) {
			console.log('Error al subir el audio: ' + err);
                return res.end(err);
           }
	
	res.redirect('/tracks');
};

// Borra una canción (trackId) del registro de canciones 
// TODO:
// - Eliminar en tracks.cdpsfy.es el fichero de audio correspondiente a trackId
exports.destroy = function (req, res) {
	var trackId = req.params.trackId;
	var track = track_model.tracks[req.params.trackId];
	console.log(track.name);

	// Aquí debe implementarse el borrado del fichero de audio indetificado por trackId en tracks.cdpsfy.es
	
	needle.request('delete', 'http://tracks.cdpsfy.es/' + track.name + '.mp3', null, function(err, resp) {
	  if (err) {
	    return console.error('Delete failed:', err);
	  }
	  console.log('Delete successful!  Server responded with:', resp.body);
	});

	// Borra la entrada del registro de datos
	delete track_model.tracks[trackId];
	res.redirect('/tracks');
};
