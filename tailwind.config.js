module.exports = {
  theme: {
    extend: {
      colors: {
        alt: 'var(--alt-color)',
        'alt-hover': 'var(--alt-hover-color)',
        main: 'var(--main-color)',
        menu: 'var(--menu-color)',
      }
    },
    fill: theme => ({
      'alt': theme('colors.alt'),
      'alt-hover': theme('colors.alt-hover'),
      'main': theme('colors.main')
    }),
    stroke: theme => ({
      'alt': theme('colors.alt'),
      'alt-hover': theme('colors.alt-hover'),
      'main': theme('colors.main')
    })
  },
  variants: {},
  plugins: []
};
