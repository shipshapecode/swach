module.exports = {
  theme: {
    extend: {
      colors: {
        alt: 'var(--alt-color)',
        main: 'var(--main-color)'
      }
    },
    stroke: theme => ({
      'alt': theme('colors.alt'),
      'main': theme('colors.main')
    })
  },
  variants: {},
  plugins: []
};
