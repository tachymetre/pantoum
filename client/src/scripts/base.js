/**
 *
 * base.js
 * Including vendor libraries & template scripting functions
 *
 **/
/*==========================================
=            TEMPLATE SCRIPTING            =
==========================================*/
'use strict';
// Require dependencies
var fs     = require('fs');
var path   = require('path');
var mkdirp = require('mkdirp');
var hbs    = require('handlebars');

// Require data model
var componentMapper = {
    templates: 'src/templates/',
    models: '../models/',
    dest: 'build/views/'
};
var partialMapper = {
    templates: 'src/partials/',
    models: '../models/',
    dest: 'build/partials/'
};

// Transform handlebars templates into view files
fs.readdir(componentMapper.templates, (error, files) => {
    if (error) throw error;
    files.forEach((file) => {
        fs.readFile(componentMapper.templates + file, 'UTF-8', (error, source) => {
            var template = hbs.compile(source),
                fileName = path.basename(file, '.html'),
                data = require(componentMapper.models + fileName)[fileName.toUpperCase()],
                view = template(data);

            // Create directory if not exists
            mkdirp(componentMapper.dest, (error) => {
                if (error) throw error;
                fs.writeFile(componentMapper.dest + file, view, (error) => {
                    if (error) throw error;
                });
            });

        });
    });
});
// Transform handlebars partials into view files
fs.readdir(partialMapper.templates, (error, files) => {
    if (error) throw error;
    files.forEach((file) => {
        fs.readFile(partialMapper.templates + file, 'UTF-8', (error, source) => {
            var template = hbs.compile(source),
                fileName = path.basename(file, '.html'),
                data = require(partialMapper.models + fileName)[fileName.toUpperCase()],
                view = template(data);

            // Create directory if not exists
            mkdirp(partialMapper.dest, (error) => {
                if (error) throw error;
                fs.writeFile(partialMapper.dest + file, view, (error) => {
                    if (error) throw error;
                });
            });

        });
    });
});


