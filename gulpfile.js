const {
	src,
	dest,
	watch,
	series,
	parallel
} = require('gulp');

// Импорты через require
const sass = require('gulp-dart-sass');
const autoprefixer = require('gulp-autoprefixer');
const cleanCSS = require('gulp-clean-css');
const terser = require('gulp-terser');
const concat = require('gulp-concat');
const svgstore = require('gulp-svgstore');
const rename = require('gulp-rename');
const sharp = require('sharp');
const browsersync = require('browser-sync').create();
const ttf2woff = require('ttf2woff');
const ttf2woff2 = require('ttf2woff2');
const ttf2eot = require('ttf2eot');

// Импорт fs и path для конвертации шрифтов
const fs = require('fs');
const path = require('path');
const through2 = require('through2');


const paths = {
	styles: {
		src: [
			'app/libs/**/*.css',
			'app/template/**/*.sass',
			'app/template/**/*.scss',
			'app/template/**/*.css',
			'app/sass/**/*.sass',
			'app/sass/**/*.scss',
			'app/sass/**/*.css',
		],
		dest: 'app/css'
	},
	scripts: {
		src: [
			'app/libs/**/*.js',
			'app/template/**/*.js',
			'app/js/app.js'
		],
		dest: 'app/js'
	},
	images: {
		src: 'app/images/src/**/*',
		dest: 'app/images'
	},
	svgs: {
		src: 'app/svg/*.svg',
		dest: 'app/images'
	},
	fonts: {
		src: 'app/fonts/**/*',
		dest: 'app/fonts'
	},
	fontsConvert: {
		src: 'app/fonts/*.ttf',
		dest: 'app/fonts'
	},
	html: {
		src: 'app/*.html',
		dest: 'app'
	}
};

// Компиляция SASS и CSS
function compileStylesMinified() {
	return src(paths.styles.src)
		.pipe(sass({
			quietDeps: true,
			silenceDeprecations: [
				'legacy-js-api',
				'import',
				'global-builtin',
				'color-functions'
			]
		}).on('error', sass.logError))
		.pipe(autoprefixer())
		.pipe(cleanCSS())
		.pipe(concat('app.min.css'))
		.pipe(dest(paths.styles.dest))
		.pipe(browsersync.stream());
}

// Объединение и минификация JS
function minifyScripts() {
	return src(paths.scripts.src)
		.pipe(concat('app.min.js'))
		.pipe(terser())
		.pipe(dest(paths.scripts.dest))
		.pipe(browsersync.stream());
}

// Оптимизация изображений через sharp
function optimizeImages() {
	return src(paths.images.src)
		.pipe(through2.obj((file, enc, cb) => {
			if (file.isNull()) return cb(null, file);
			if (file.isStream()) return cb(new Error('Streaming not supported'));

			const ext = path.extname(file.path).toLowerCase().slice(1);
			if (['svg', 'ico'].includes(ext)) {
				return cb(null, file);
			}

			if (!file.isBuffer()) {
				return cb(null, file);
			}

			let pipeline = sharp(file.contents);

			if (['jpg', 'jpeg'].includes(ext)) {
				pipeline = pipeline.jpeg({
					quality: 80,
					progressive: true
				});
			} else if (ext === 'png') {
				pipeline = pipeline.png({
					quality: 85,
					compressionLevel: 6
				});
			} else if (ext === 'webp') {
				pipeline = pipeline.webp({
					quality: 85
				});
			} else if (ext === 'gif') {
				pipeline = pipeline.gif({
					effort: 4
				});
			} else {
				return cb(null, file);
			}

			pipeline.toBuffer()
				.then(data => {
					file.contents = data;
					cb(null, file);
				})
				.catch(err => {
					console.error('Ошибка оптимизации:', file.path, err.message);
					cb(err);
				});
		}))
		.pipe(dest(paths.images.dest));
}

// Создание SVG-спрайта из папки app/svg/
function createSprite() {
	return src(paths.svgs.src)
		.pipe(svgstore({
			inlineSvg: true
		}))
		.pipe(rename('sprite.svg'))
		.pipe(dest(paths.svgs.dest));
}

// Копирование шрифтов
function copyFonts() {
	return src(paths.fonts.src)
		.pipe(dest(paths.fonts.dest));
}

// Конвертация .ttf в .woff, .woff2, .eot
function convertTtfToOtherFormats() {
	const fontDir = 'app/fonts/';
	const ttfFiles = fs.readdirSync(fontDir).filter(file => path.extname(file) === '.ttf');

	ttfFiles.forEach(file => {
		const filePath = `${fontDir}${file}`;
		const fontName = path.basename(file, '.ttf');

		const ttfBuffer = fs.readFileSync(filePath);

		let woffBuffer = ttf2woff(ttfBuffer, {});
		if (!(woffBuffer instanceof Buffer)) woffBuffer = Buffer.from(woffBuffer);
		fs.writeFileSync(`${fontDir}${fontName}.woff`, woffBuffer);

		let woff2Buffer = ttf2woff2(ttfBuffer);
		if (!(woff2Buffer instanceof Buffer)) woff2Buffer = Buffer.from(woff2Buffer);
		fs.writeFileSync(`${fontDir}${fontName}.woff2`, woff2Buffer);

		let eotBuffer = ttf2eot(ttfBuffer);
		if (!(eotBuffer instanceof Buffer)) eotBuffer = Buffer.from(eotBuffer);
		fs.writeFileSync(`${fontDir}${fontName}.eot`, eotBuffer);
	});

	return src('app/fonts/*.ttf', {
		read: false
	});
}

// Запуск локального сервера
function serve() {
	browsersync.init({
		server: './app',
		open: true,
		notify: false
	});

	watch(paths.styles.src, compileStylesMinified);
	watch(paths.scripts.src, minifyScripts);

	watch(paths.images.src, {
		events: ['add', 'change', 'unlink']
	}, (cb) => {
		optimizeImages().on('end', () => {
			browsersync.reload();
			cb();
		});
	});

	watch(paths.svgs.src, {
		events: ['add', 'change', 'unlink']
	}, (cb) => {
		createSprite().on('end', () => {
			browsersync.reload();
			cb();
		});
	});

	watch(paths.fonts.src, {
		ignored: ['**/*.woff', '**/*.woff2', '**/*.eot']
	}, series(copyFonts, () => browsersync.reload()));
	watch(paths.html.src).on('change', browsersync.reload);
}

// Экспорт задач
exports.styles = compileStylesMinified;
exports.scripts = minifyScripts;
exports.images = optimizeImages;
exports.sprite = createSprite;
exports.fonts = copyFonts;
exports.font = convertTtfToOtherFormats;

// Сборка проекта
exports.build = parallel(
	exports.styles,
	exports.scripts,
	exports.images,
	exports.sprite,
	exports.fonts
);

// Запуск сервера и слежение
exports.default = series(
	exports.build,
	serve
);