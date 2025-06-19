module.exports = {
    baseUrl: 'src',
    name: '../node_modules/almond/almond',
    include: ['quick-switcher'],
    out: 'dist/quick-switcher.js',
    map: 'dist/quick-switcher.min.js.map',
    optimize: 'none',
    wrap: {
      startFile: '.almond/start.frag',
      endFile: '.almond/end.frag',
    },
    paths: {
      text: '../node_modules/text/text',
    },
  };