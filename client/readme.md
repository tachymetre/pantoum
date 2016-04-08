**Pantoum - Client**
============

This is the official installation steps for the client side of `pantoum`. There are 3 parent folders in the repo that are designated to particular function and parent files which provide the similar coverage as followed: 

- [dist]: consists gulp task and configuration needed in development environment. These tasks simplify build setups and push continuous work flow to the maximum level
- [src]: contains the most important contents of the whole site including all applications and their assets. Served as the critical foundation for all development progress
- [tests]: provides tests coverage to the whole site. It has test cases for the whole site as one bundle 
- `.gitignore`: lists out which insignificant folders to not be included in the repo
- `.jshintrc`: 
- `bower.json`: contains details of all bower_components modules that are being used throughout the application
- `package.json`: is the npm BFF file. Includes all packages needed for node_modules and custom npm commands
- `readme.md`: is all that are contained in this very own file

If you've never used [Node](http://nodejs.org/) or [npm](https://www.npmjs.com/) before, you'll need to install Node.
If you use homebrew, do:

```
brew install node
```

Otherwise, you can download and install from [here](http://nodejs.org/download/). Make sure to have [Bower](http://bower.io/) executable as well in the directory. If not, use:

```
npm install -g bower
```

### Clear caches when initializing the project

```
npm run app-clean
```

### Remove `.gitignore` folders from npm and bower

```
npm run app-remove
```

To remove the staging step (the "build" folder), run the following:

```
npm run clean-build
```

### Install all needed packages and modules

```
npm run app-update
```

This will run through and install all dependencies listed in `package.json` as well as `bower.json` and download them
to `node_modules`, `bower_components` folders in your project directory. Make sure everything passed and no error(s) in the output results

### Build the app and be amazed

```
npm start
```

This will build the application for the development process with a local server on port 9000. Also, a watch task in executed to watch all the changes to the assets so no reload is needed. If you want to get the production version, run the following:

```
npm legacy
```

### Run tests for the application

```
npm run test
```

To run a single test, use: 

```
npm run test-single-run
```