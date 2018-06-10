module.exports = function(grunt) {

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    watch: {
      options: {
        livereload: true
      },
      pug: {
        tasks: ["pug:debug"],
        files: ["**/*.pug", "**/*.md", "!layouts/*.pug"]
      }
    },

    pug: {
      options: {
        pretty: true,
        files: {
          "*": ["**/*.pug", "!layouts/*.pug"]
        }
      },
      debug: {
        options: {
          data: {
            debug: true
          }
        }
      },
      release: {
        options: {
          data: {
            debug: false
          }
        }
      }
    },

    web: {
      options: {
        port: 8001
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-pug');

  grunt.registerTask('default', ['pug:debug', 'web']);
  grunt.registerTask('release', ['pug:release']);

  grunt.registerTask('web', 'Start web server...', function() {
    var options = this.options();
    var express = require('express');
    var app = express()
    app.listen(options.port);
    app.set("view engine", "pug");
    app.get('/', (req, res) => res.render('index'));
    console.log('http://localhost:%s', options.port);

    grunt.task.run(["watch:pug"]);
  });

};