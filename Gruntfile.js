module.exports = function(grunt) {
    'use strict';

    require("load-grunt-tasks")(grunt);

    grunt.initConfig({

        clean: {
            dist: ['dist/']
        },

        concat: {
            options: {
                separator: ';'
            },
            solo: {
                src: ['src/deckard.js'],
                dest: 'dist/deckard.js'
            },
            withPolyfill: {
                src: ['src/web-animations.js', 'src/deckard.js'],
                dest: 'dist/deckard.polyfill.js'
            }
        },

        uglify: {
            options: {
                report: "min",
                compress: {
                    dead_code: true,
                    drop_console: true
                }
            },
            solo: {
                src: ["src/deckard.js"],
                dest: "dist/deckard.min.js"
            },
            withPolyfill: {
                src: ["dist/deckard.polyfill.js"],
                dest: "dist/deckard.polyfill.min.js"
            }
        }
    });

    grunt.registerTask("default", ["clean:dist", "concat", "uglify"]);

};
