module.exports = {
  theme: {
    extend: {
      colors: {
        alt: 'var(--alt-color)',
        main: 'var(--main-color)',
        menu: 'var(--menu-color)',
      }
    },
    fill: theme => ({
      'alt': theme('colors.alt'),
      'main': theme('colors.main')
    }),
    stroke: theme => ({
      'alt': theme('colors.alt'),
      'main': theme('colors.main')
    })
  },
  variants: {},
  plugins: []
};
