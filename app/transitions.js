export default function(){
  this.transition(
    this.fromRoute('color-manager.palettes'),
    this.toRoute('color-manager.colors'),
    this.use('toLeft'),
    this.reverse('toRight')
  );

  this.transition(
    this.fromRoute('color-manager.colors'),
    this.toRoute('color-manager.kuler'),
    this.use('toLeft'),
    this.reverse('toRight')
  );

  this.transition(
    this.fromRoute('color-manager.kuler'),
    this.toRoute('color-manager.palettes'),
    this.use('toRight')
  );
}
