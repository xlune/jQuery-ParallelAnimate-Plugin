module.exports = function(grunt) {

	grunt.initConfig({

		// Import package manifest
		pkg: grunt.file.readJSON("parallelanimate.jquery.json"),

		// Banner definitions
		meta: {
			banner: "/*\n" +
				" *  <%= pkg.title || pkg.name %> - v<%= pkg.version %>\n" +
				" *  <%= pkg.description %>\n" +
				" *  <%= pkg.homepage %>\n" +
				" *\n" +
				" *  Made by <%= pkg.author.name %>\n" +
				" *  Under <%= pkg.licenses[0].type %> License (<%= pkg.licenses[0].url %>)\n" +
				" */\n"
		},

		//server
		connect: {
			server: {
				options: {
					port: 9100,
					hostname: 'localhost'
				}
			}
		},

		//watch
		watch: {
			scripts: {
				files: 'src/*.coffee',
				tasks: ['coffee', 'uglify']
			}
		},

		// Concat definitions
		concat: {
			dist: {
				src: ["dist/jquery.parallelanimate.js"],
				dest: "dist/jquery.parallelanimate.js"
			},
			options: {
				banner: "<%= meta.banner %>"
			}
		},

		// Lint definitions
		// jshint: {
		// 	files: ["src/jquery.parallelanimate.js"],
		// 	options: {
		// 		jshintrc: ".jshintrc"
		// 	}
		// },

		// Minify definitions
		uglify: {
			my_target: {
				src: ["dist/jquery.parallelanimate.js"],
				dest: "dist/jquery.parallelanimate.min.js"
			},
			options: {
				banner: "<%= meta.banner %>"
			}
		},

		// CoffeeScript compilation
		coffee: {
			compile: {
				files: {
					"dist/jquery.parallelanimate.js": "src/jquery.parallelanimate.coffee"
				}
			}
		}

	});

	grunt.loadNpmTasks("grunt-contrib-concat");
	grunt.loadNpmTasks("grunt-contrib-jshint");
	grunt.loadNpmTasks("grunt-contrib-uglify");
	grunt.loadNpmTasks("grunt-contrib-coffee");
	grunt.loadNpmTasks("grunt-contrib-connect");
	grunt.loadNpmTasks("grunt-contrib-watch");

	grunt.registerTask("default", ["coffee", "concat", "uglify"]);
	// grunt.registerTask("travis", ["jshint"]);
	grunt.registerTask("server", ["coffee", "concat", "uglify", "connect", "watch"]);

};
