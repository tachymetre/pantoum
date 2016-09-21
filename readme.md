**Pantoum**
============

Pantoum is a web-based personal blogging service that utilizes web technologies from both client and server sides. It opens a platform for authenticated users to create, edit, and maintain their blogging articles. As one might suggest, writing is the closest form to time-travel we have for human-beings.

For system requirements and installation guides, please head over to the project's [wiki](https://github.com/tachymetre/pantoum/wiki)

## Techology Stack

Pantoum uses a number of open source projects to work properly:

### **Front-End**
---

* [AngularJS][an] - Superheroic JavaScript MVW Framework
* [angular-ui-router][an-u] - The de-facto solution to flexible routing with nested views in AngularJS
* [jQuery][jq] - A fast, small, and feature-rich JavaScript library 
* [Bootstrap][bt] - The most popular HTML, CSS, and JS framework for developing responsive on the web
* [normalize.css][nc] - A modern, HTML5-ready alternative to CSS resets
* [satellizer][sz] - Token-based AngularJS Authentication
* [angular-permission][ap] - Simple route authorization via roles/permissions
* [Browserify][br] - Browser-side `require()` the Node.js way
* [live-server][lv] - A simple development http server with live reload capability
* [imagemin-newer][in] - Minify images with "imagemin" only if they need to be updated
* [ESLint][es] - The pluggable linting utility for JavaScript and JSX
* [Jasmine][jm] - DOM-less simple JavaScript testing framework 
* [Karma][km] - Spectacular Test Runner for Javascript
* [Sass][ss] - Syntactically Awesome Style Sheets
* [Modernizr][mz] - The feature detection library for HTML5/CSS3
* [Protractor][pt] - End-to-end test framework for AngularJS applications
* [npm-scripts][ns] - No need for build tools, enter NPM Scripts
* [npm-run-all][nra] - A CLI tool to run multiple npm-scripts in parallel or sequential
* [parallelshell][ps] - Run multiple shell commands in parallel
* [rerun-script][rs] - Invoke "npm scripts" upon file changes. Configure via `package.json` using glob patterns
* [UglifyJS2][ujs2] - JavaScript parser / mangler / compressor / beautifier toolkit

### **Back-End**
---

* [Laravel][la] - The PHP Framework For Web Artisans
* [laravel-cors][la-c] - Adds CORS headers support in your Laravel application
* [laravel-extended-generators][la-gn] - Extends the core file generators that are included with Laravel 5 
* [faker][fa] - PHP library that generates fake data for you
* [jwt-auth][jwt] - JSON Web Token Authentication for Laravel & Lumen
* [mockery][mo] - PHP mock object framework for use in unit testing
* [PHPUnit][pu] - Programmer-oriented testing framework for PHP

## Version
1.0.0

## License

Pantoum is written and maintained by [Minh Pham](https://github.com/tachymetre), and is licensed under [MIT](https://opensource.org/licenses/MIT).

[//]: # (These are reference links used in the body of this note and get stripped out when the markdown processor does its job. http://stackoverflow.com/questions/4823468/store-comments-in-markdown-syntax)

[an]: <https://angularjs.org/>
[an-u]: <https://github.com/angular-ui/ui-router>
[jq]: <https://jquery.com/>
[bt]: <http://getbootstrap.com/>
[nc]: <https://necolas.github.io/normalize.css/>
[sz]: <https://github.com/sahat/satellizer>
[ap]: <https://github.com/Narzerus/angular-permission>
[br]: <http://browserify.org/>
[lv]: <https://github.com/tapio/live-server>
[in]: <https://github.com/paulcpederson/imagemin-newer>
[es]: <http://eslint.org/>
[jm]: <https://github.com/jasmine/jasmine>
[km]: <https://karma-runner.github.io/0.13/index.html>
[ss]: <http://sass-lang.com/>
[mz]: <https://modernizr.com/>
[pt]: <https://angular.github.io/protractor/#/>
[ns]: <https://medium.freecodecamp.com/why-i-left-gulp-and-grunt-for-npm-scripts-3d6853dd22b8#.bcfyapjob>
[nra]: <https://github.com/mysticatea/npm-run-all>
[ps]: <https://github.com/keithamus/parallelshell>
[rs]: <https://github.com/wilmoore/rerun-script>
[ujs2]: <https://github.com/mishoo/UglifyJS2>
[la]: <https://laravel.com/>
[la-c]: <https://github.com/barryvdh/laravel-cors>
[la-gn]: <https://github.com/laracasts/Laravel-5-Generators-Extended>
[fa]: <https://github.com/fzaninotto/Faker>
[jwt]: <https://github.com/tymondesigns/jwt-auth>
[mo]: <https://github.com/padraic/mockery>
[pu]: <https://phpunit.de/>