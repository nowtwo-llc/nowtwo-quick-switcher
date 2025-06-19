const requirejs = require('requirejs');
const config = require('./rjs-config');
const fs = require('fs');
const { minify } = require('terser');

requirejs.optimize(config, async function (buildResponse) {
  console.log('Built with RequireJS:', buildResponse);

  const inputPath = config.out;
  const outputPath = inputPath.replace(/\.js$/, '.min.js');
  const sourceMapPath = config.map;

  try {
    const code = fs.readFileSync(inputPath, 'utf8');
    const result = await minify(code, {
        sourceMap: {
            filename: 'quick-switcher.min.js',   // The name of the minified file
            url: 'quick-switcher.min.js.map',    // The source map file name that will be linked inside min.js
        },
        format: {
            comments: false,
        },
    });

    fs.writeFileSync(outputPath, result.code, 'utf8');
    fs.writeFileSync(sourceMapPath, result.map, 'utf8');
    fs.unlinkSync(inputPath);

    console.log(`Minified output written to ${outputPath}`);
  } catch (err) {
    console.error('Terser minify error:', err);
  }
}, function (err) {
  console.error('RequireJS build failed:', err);
});