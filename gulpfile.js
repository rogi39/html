const {
	src,
	dest,
	watch,
	series,
	parallel
} = require('gulp');

// Импорты через require
const sass = require('gulp-dart-sass'); // ← заменён на dart-sass
const autoprefixer = require('gulp-autoprefixer');
const cleanCSS = require('gulp-clean-css');
const terser = require('gulp-terser');
const concat = require('gulp-concat');
const svgstore = require('gulp-svgstore');
const rename = require('gulp-rename');
const browsersync = require('browser-sync').create();
const ttf2woff = require('ttf2woff');
const ttf2woff2 = require('ttf2woff2');
const ttf2eot = require('ttf2eot');

// Импорт fs и path для конвертации шрифтов
const fs = require('fs');
const path = require('path');

// Пути к файлам
const paths = {
	styles: {
		src: [
			'public/sass/**/*.sass',
			'public/sass/**/*.scss',
			'public/components/**/*.sass',
			'public/components/**/*.scss',
			'public/components/**/*.css',
			'public/libs/**/*.css'
		],
		dest: 'public/css'
	},
	scripts: {
		src: [
			'public/libs/**/*.js',
			'public/js/script.js'
		],
		dest: 'public/js'
	},
	images: {
		src: 'public/images/src/**/*',
		dest: 'public/images'
	},
	svgs: {
		src: 'public/svg-icons/*.svg',
		dest: 'public/images'
	},
	fonts: {
		src: 'public/fonts/**/*',
		dest: 'public/fonts'
	},
	fontsConvert: {
		src: 'public/fonts/src/*.ttf',
		dest: 'public/fonts'
	},
	html: {
		src: 'public/*.html',
		dest: 'public'
	}
};

// Компиляция SASS и CSS в style.min.css (с минификацией)
function compileStylesMinified() {
	return src(paths.styles.src)
		.pipe(sass({
			quietDeps: true, // ← отключает предупреждения от зависимостей
			silenceDeprecations: [
				'legacy-js-api', // ← отключает предупреждение о legacy API
				'import', // ← отключает предупреждение о @import
				'global-builtin', // ← отключает предупреждение о global built-ins
				'color-functions' // ← отключает предупреждение о цветовых функциях
			]
		}).on('error', sass.logError))
		.pipe(autoprefixer())
		.pipe(cleanCSS())
		.pipe(concat('style.min.css'))
		.pipe(dest(paths.styles.dest))
		.pipe(browsersync.stream());
}

// Объединение и минификация JS (библиотеки + твой script.js) в script.min.js
function minifyScripts() {
	return src(paths.scripts.src)
		.pipe(concat('script.min.js'))
		.pipe(terser())
		.pipe(dest(paths.scripts.dest))
		.pipe(browsersync.stream());

}

// Просто копирование изображений (без оптимизации)
function copyImages() {
	return src(paths.images.src)
		.pipe(dest(paths.images.dest));
}

// Создание SVG-спрайта (с именем sprite.svg, без префикса icon-)
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

// Конвертация .ttf в .woff, .woff2, .eot + копирование исходного .ttf
function convertTtfToOtherFormats() {
	const ttfFiles = fs.readdirSync('public/fonts/src/').filter(file => path.extname(file) === '.ttf');

	ttfFiles.forEach(file => {
		const srcPath = `public/fonts/src/${file}`;
		const destPath = `public/fonts/${file}`;
		const fontName = path.basename(file, '.ttf');

		// Копируем исходный .ttf в public/fonts/
		fs.copyFileSync(srcPath, destPath);

		// Читаем .ttf файл для конвертации
		const ttfBuffer = fs.readFileSync(srcPath);

		// Конвертация в .woff
		let woffBuffer = ttf2woff(ttfBuffer, {});
		if (!(woffBuffer instanceof Buffer)) {
			woffBuffer = Buffer.from(woffBuffer);
		}
		fs.writeFileSync(`public/fonts/${fontName}.woff`, woffBuffer);

		// Конвертация в .woff2
		let woff2Buffer = ttf2woff2(ttfBuffer);
		if (!(woff2Buffer instanceof Buffer)) {
			woff2Buffer = Buffer.from(woff2Buffer);
		}
		fs.writeFileSync(`public/fonts/${fontName}.woff2`, woff2Buffer);

		// Конвертация в .eot
		let eotBuffer = ttf2eot(ttfBuffer);
		if (!(eotBuffer instanceof Buffer)) {
			eotBuffer = Buffer.from(eotBuffer);
		}
		fs.writeFileSync(`public/fonts/${fontName}.eot`, eotBuffer);
	});

	return src('public/fonts/src/*.ttf', {
		read: false
	});
}

// Запуск локального сервера
function serve() {
	browsersync.init({
		server: './public',
		open: true,
		notify: false
	});

	// Для стилей — компилируем, потом перезагружаем
	watch(paths.styles.src, compileStylesMinified);

	// Для JS — компилируем, потом перезагружаем
	watch(paths.scripts.src, minifyScripts);

	// Для изображений — копируем, потом перезагружаем
	watch(paths.images.src, (done) => {
		copyImages();
		setTimeout(() => browsersync.reload(), 100);
		done();
	});

	// Для SVG — спрайт, потом перезагружаем
	watch(paths.svgs.src, (done) => {
		createSprite();
		setTimeout(() => browsersync.reload(), 100);
		done();
	});

	// Для шрифтов — копируем, потом перезагружаем
	watch(paths.fonts.src, {
		ignored: ['**/*.woff', '**/*.woff2', '**/*.eot']
	}, (done) => {
		copyFonts();
		setTimeout(() => browsersync.reload(), 100);
		done();
	});

	// Для HTML — перезагружаем
	watch(paths.html.src, () => browsersync.reload());
}

// Экспорт задач
exports.styles = compileStylesMinified;
exports.scripts = minifyScripts;
exports.images = copyImages;
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