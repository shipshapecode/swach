const transitionOptions = { duration: 250, easing: 'easeInOut' };
export default function () {
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
    this.fromRoute(function (routeName) {
      return !routeName.startsWith('welcome');
    }),
    this.toRoute(function (routeName) {
      return !routeName.startsWith('welcome');
    }),
    this.use('fade', transitionOptions)
  );

  // This is a default transition when transitioning to palettes from the welcome screen
  this.transition(this.toRoute('palettes'), this.use('crossFade'));
}
