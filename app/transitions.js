export default function(){
  this.transition(
    this.fromRoute('color-manager.palettes'),
    this.toRoute('color-manager.colors'),
    this.use('toLeft'),
    this.reverse('toRight')
  );
}
