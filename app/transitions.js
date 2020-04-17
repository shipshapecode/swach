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
}
