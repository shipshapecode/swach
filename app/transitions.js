export default function() {
  this.transition(
    this.fromRoute('palettes'),
    this.toRoute('colors'),
    this.use('toLeft', { easing: 'easeInOut' }),
    this.reverse('toRight', { easing: 'easeInOut' })
  );

  this.transition(
    this.fromRoute('colors'),
    this.toRoute('kuler'),
    this.use('toLeft', { easing: 'easeInOut' }),
    this.reverse('toRight', { easing: 'easeInOut' })
  );

  this.transition(
    this.fromRoute('kuler'),
    this.toRoute('palettes'),
    this.use('toRight', { easing: 'easeInOut' })
  );

  this.transition(
    this.toRoute('contrast'),
    this.use('toLeft', { easing: 'easeInOut' }),
    this.reverse('toRight', { easing: 'easeInOut' })
  );

  this.transition(
    this.toRoute('settings'),
    this.use('toLeft', { easing: 'easeInOut' }),
    this.reverse('toRight', { easing: 'easeInOut' })
  );
}
