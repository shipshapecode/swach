export default function(){
  this.transition(
    this.fromRoute('palettes'),
    this.toRoute('colors'),
    this.use('toLeft'),
    this.reverse('toRight')
  );

  this.transition(
    this.fromRoute('colors'),
    this.toRoute('kuler'),
    this.use('toLeft'),
    this.reverse('toRight')
  );

  this.transition(
    this.fromRoute('kuler'),
    this.toRoute('palettes'),
    this.use('toRight')
  );

  this.transition(
    this.toRoute('contrast'),
    this.use('toLeft'),
    this.reverse('toRight')
  );

  this.transition(
    this.toRoute('settings'),
    this.use('toLeft'),
    this.reverse('toRight')
  );
}
