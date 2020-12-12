const transitionOptions = { duration: 300, easing: 'easeInOut' };
export default function () {
  this.transition(
    this.fromRoute('palettes'),
    this.toRoute('colors'),
    this.use('toLeft', transitionOptions),
    this.reverse('toRight', transitionOptions)
  );

  this.transition(
    this.fromRoute('colors'),
    this.toRoute('kuler'),
    this.use('toLeft', transitionOptions),
    this.reverse('toRight', transitionOptions)
  );

  this.transition(
    this.fromRoute('kuler'),
    this.toRoute('palettes'),
    this.use('toRight', transitionOptions)
  );

  this.transition(
    this.toRoute('contrast'),
    this.use('toLeft', transitionOptions),
    this.reverse('toRight', transitionOptions)
  );

  this.transition(
    this.toRoute('settings'),
    this.use('toLeft', transitionOptions),
    this.reverse('toRight', transitionOptions)
  );

  this.transition(
    this.fromRoute('welcome.index'),
    this.toRoute('welcome.auto-start'),
    this.use('toLeft', transitionOptions),
    this.reverse('toRight', transitionOptions)
  );

  this.transition(
    this.fromRoute('welcome.auto-start'),
    this.toRoute('welcome.dock-icon'),
    this.use('toLeft', transitionOptions),
    this.reverse('toRight', transitionOptions)
  );

  this.transition(
    this.fromRoute('settings.index'),
    this.toRoute('settings.cloud'),
    this.use('fade', transitionOptions)
  );

  this.transition(
    this.fromRoute(function (routeName) {
      return /^settings/.test(routeName);
    }),
    this.toRoute(function (routeName) {
      return /^settings/.test(routeName);
    }),
    this.use('fade', transitionOptions)
  );

  // This is a default transition when transitioning to palettes from the welcome screen
  this.transition(this.toRoute('palettes'), this.use('crossFade'));
}
