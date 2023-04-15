/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/index.html',
    './app/components/**/*.hbs',
    './app/templates/**/*.hbs',
  ],
  theme: {
    extend: {
      colors: {
        alt: 'var(--alt-color)',
        'alt-hover': 'var(--alt-hover-color)',
        'btn-bg-primary': 'var(--btn-bg-primary)',
        'btn-bg-primary-hover': 'var(--btn-bg-primary-hover)',
        'btn-bg-secondary': 'var(--btn-bg-secondary)',
        'btn-bg-secondary-hover': 'var(--btn-bg-secondary-hover)',
        'btn-text-primary': 'var(--btn-text-primary)',
        'btn-text-secondary': 'var(--btn-text-secondary)',
        checkbox: 'var(--checkbox)',
        heading: 'var(--heading-color)',
        'input-bg': 'var(--input-bg)',
        'input-border': 'var(--input-border)',
        main: 'var(--main-color)',
        menu: 'var(--menu-color)',
        'menu-text': 'var(--menu-text-color)',
        'menu-text-hover': 'var(--menu-text-hover-color)',
        'main-text': 'var(--main-text)',
        'sub-text': 'var(--sub-text)',
      },
      fontSize: {
        smallest: '0.5rem',
        xxs: '0.65rem',
      },
      width: {
        36: '9rem',
      },
    },
    fill: (theme) => ({
      alt: theme('colors.alt'),
      'alt-hover': theme('colors.alt-hover'),
      main: theme('colors.main'),
    }),
    stroke: (theme) => ({
      alt: theme('colors.alt'),
      'alt-hover': theme('colors.alt-hover'),
      main: theme('colors.main'),
    }),
  },
  plugins: [
    require('@tailwindcss/forms')({
      strategy: 'class',
    }),
  ],
};
