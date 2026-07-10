/*
  Generador de partículas direccionales para Adobe After Effects
  -------------------------------------------------------------
  Ejecuta este archivo desde File > Scripts > Run Script File...
  Crea una composición con partículas tipo triángulo, círculo y línea inspiradas
  en la imagen de referencia, más un Null llamado "CONTROLES - Particulas".

  Todos los parámetros principales quedan editables con Slider Controls y Color
  Controls. La dirección se define en grados: 0 = derecha, 90 = abajo,
  180 = izquierda, 270 = arriba.
*/

(function directionalParticlesGenerator() {
  app.beginUndoGroup('Crear partículas direccionales ajustables');

  var compWidth = 1080;
  var compHeight = 1920;
  var compDuration = 10;
  var compFps = 30;
  var maxTriangles = 70;
  var maxCircles = 70;
  var maxLines = 45;

  var comp = app.project && app.project.activeItem instanceof CompItem
    ? app.project.activeItem
    : app.project.items.addComp('Particulas direccionales neon', compWidth, compHeight, 1, compDuration, compFps);

  compWidth = comp.width;
  compHeight = comp.height;

  var bg = comp.layers.addSolid([0.02, 0.03, 0.20], 'Fondo azul neon', compWidth, compHeight, 1, comp.duration);
  bg.moveToEnd();
  var ramp = bg.Effects.addProperty('ADBE Ramp');
  ramp.property('Start Color').setValue([0.05, 0.02, 0.30, 1]);
  ramp.property('End Color').setValue([0.02, 0.12, 0.48, 1]);
  ramp.property('Start of Ramp').setValue([0, compHeight]);
  ramp.property('End of Ramp').setValue([compWidth, 0]);

  var controls = comp.layers.addNull();
  controls.name = 'CONTROLES - Particulas';
  controls.threeDLayer = false;
  controls.property('Position').setValue([compWidth / 2, compHeight / 2]);

  addSlider(controls, 'Velocidad', 360);
  addSlider(controls, 'Direccion (angulo)', -35);
  addSlider(controls, 'Cantidad total', 120);
  addSlider(controls, 'Duracion vida', 3.2);
  addSlider(controls, 'Tiempo fade muerte', 0.65);
  addSlider(controls, 'Dispersion perpendicular', 520);
  addSlider(controls, 'Tamano minimo', 10);
  addSlider(controls, 'Tamano maximo', 54);
  addSlider(controls, 'Cantidad triangulos', 45);
  addColor(controls, 'Color triangulos', [0.12, 0.23, 1, 1]);
  addSlider(controls, 'Cantidad circulos', 45);
  addColor(controls, 'Color circulos', [0.06, 0.95, 1, 1]);
  addSlider(controls, 'Cantidad lineas', 30);
  addColor(controls, 'Color lineas', [1, 0.05, 0.95, 1]);

  var allLayers = [];
  for (var t = 1; t <= maxTriangles; t += 1) allLayers.push(createTriangle(comp, t));
  for (var c = 1; c <= maxCircles; c += 1) allLayers.push(createCircle(comp, c));
  for (var l = 1; l <= maxLines; l += 1) allLayers.push(createLine(comp, l));

  for (var i = 0; i < allLayers.length; i += 1) {
    allLayers[i].moveBefore(bg);
  }
  controls.moveToBeginning();

  app.endUndoGroup();

  function addSlider(layer, name, value) {
    var fx = layer.Effects.addProperty('ADBE Slider Control');
    fx.name = name;
    fx.property('Slider').setValue(value);
    return fx;
  }

  function addColor(layer, name, value) {
    var fx = layer.Effects.addProperty('ADBE Color Control');
    fx.name = name;
    fx.property('Color').setValue(value);
    return fx;
  }

  function createTriangle(compItem, index) {
    var layer = compItem.layers.addShape();
    layer.name = 'Triangulo ' + pad(index);
    var root = layer.property('Contents');
    var group = root.addProperty('ADBE Vector Group');
    group.name = 'Triangulo';
    var contents = group.property('Contents');
    var path = contents.addProperty('ADBE Vector Shape - Group');
    var shape = new Shape();
    shape.vertices = [[0, -28], [25, 18], [-25, 18]];
    shape.inTangents = [[0, 0], [0, 0], [0, 0]];
    shape.outTangents = [[0, 0], [0, 0], [0, 0]];
    shape.closed = true;
    path.property('Path').setValue(shape);
    var stroke = contents.addProperty('ADBE Vector Graphic - Stroke');
    stroke.property('Stroke Width').setValue(3);
    stroke.property('Color').expression = colorExpression('Color triangulos');
    applyCommonExpressions(layer, index, 'Cantidad triangulos', maxTriangles, 0);
    return layer;
  }

  function createCircle(compItem, index) {
    var layer = compItem.layers.addShape();
    layer.name = 'Circulo ' + pad(index);
    var root = layer.property('Contents');
    var group = root.addProperty('ADBE Vector Group');
    group.name = 'Circulo';
    var contents = group.property('Contents');
    var ellipse = contents.addProperty('ADBE Vector Shape - Ellipse');
    ellipse.property('Size').setValue([48, 48]);
    var stroke = contents.addProperty('ADBE Vector Graphic - Stroke');
    stroke.property('Stroke Width').setValue(3);
    stroke.property('Color').expression = colorExpression('Color circulos');
    applyCommonExpressions(layer, index, 'Cantidad circulos', maxCircles, 1000);
    return layer;
  }

  function createLine(compItem, index) {
    var layer = compItem.layers.addShape();
    layer.name = 'Linea ' + pad(index);
    var root = layer.property('Contents');
    var group = root.addProperty('ADBE Vector Group');
    group.name = 'Linea';
    var contents = group.property('Contents');
    var path = contents.addProperty('ADBE Vector Shape - Group');
    var shape = new Shape();
    shape.vertices = [[-95, 0], [95, 0]];
    shape.inTangents = [[0, 0], [0, 0]];
    shape.outTangents = [[0, 0], [0, 0]];
    shape.closed = false;
    path.property('Path').setValue(shape);
    var stroke = contents.addProperty('ADBE Vector Graphic - Stroke');
    stroke.property('Stroke Width').setValue(8);
    stroke.property('Line Cap').setValue(2);
    stroke.property('Color').expression = colorExpression('Color lineas');
    applyCommonExpressions(layer, index, 'Cantidad lineas', maxLines, 2000);
    return layer;
  }

  function applyCommonExpressions(layer, index, countControlName, maxForType, seedOffset) {
    layer.property('Position').expression = positionExpression(index + seedOffset);
    layer.property('Scale').expression = scaleExpression(index + seedOffset);
    layer.property('Rotation').expression = rotationExpression(index + seedOffset);
    layer.property('Transform').property('Opacity').expression = opacityExpression(index, countControlName, maxForType, seedOffset);
  }

  function colorExpression(controlName) {
    return 'thisComp.layer("CONTROLES - Particulas").effect("' + controlName + '")("Color")';
  }

  function positionExpression(seed) {
    return [
      'ctrl = thisComp.layer("CONTROLES - Particulas");',
      'speed = ctrl.effect("Velocidad")("Slider");',
      'angle = degreesToRadians(ctrl.effect("Direccion (angulo)")("Slider"));',
      'life = Math.max(0.1, ctrl.effect("Duracion vida")("Slider"));',
      'spread = ctrl.effect("Dispersion perpendicular")("Slider");',
      'seedRandom(' + seed + ', true);',
      'cycle = (time + random(0, life)) % life;',
      'progress = cycle / life;',
      'dir = [Math.cos(angle), Math.sin(angle)];',
      'perp = [-dir[1], dir[0]];',
      'travel = speed * life;',
      'center = [thisComp.width / 2, thisComp.height / 2];',
      'originOffset = random(-spread, spread);',
      'start = center - dir * travel * 0.55 + perp * originOffset;',
      'jitter = perp * wiggle(0.7, 18)[0] * 0.04;',
      'start + dir * travel * progress + jitter;'
    ].join('\n');
  }

  function scaleExpression(seed) {
    return [
      'ctrl = thisComp.layer("CONTROLES - Particulas");',
      'minSize = ctrl.effect("Tamano minimo")("Slider");',
      'maxSize = ctrl.effect("Tamano maximo")("Slider");',
      'seedRandom(' + seed + ', true);',
      's = random(minSize, maxSize);',
      '[s, s];'
    ].join('\n');
  }

  function rotationExpression(seed) {
    return [
      'ctrl = thisComp.layer("CONTROLES - Particulas");',
      'base = ctrl.effect("Direccion (angulo)")("Slider");',
      'seedRandom(' + seed + ', true);',
      'base + random(-28, 28) + time * random(-35, 35);'
    ].join('\n');
  }

  function opacityExpression(index, countControlName, maxForType, seedOffset) {
    return [
      'ctrl = thisComp.layer("CONTROLES - Particulas");',
      'typeCount = ctrl.effect("' + countControlName + '")("Slider");',
      'totalCount = ctrl.effect("Cantidad total")("Slider");',
      'life = Math.max(0.1, ctrl.effect("Duracion vida")("Slider"));',
      'fade = Math.min(life, Math.max(0.01, ctrl.effect("Tiempo fade muerte")("Slider")));',
      'activeByType = ' + index + ' <= typeCount;',
      'activeByTotal = ' + index + ' <= totalCount;',
      'if (!activeByType || !activeByTotal) { 0 } else {',
      '  seedRandom(' + (index + seedOffset) + ', true);',
      '  cycle = (time + random(0, life)) % life;',
      '  fadeIn = linear(cycle, 0, fade, 0, 100);',
      '  fadeOut = linear(cycle, life - fade, life, 100, 0);',
      '  Math.max(0, Math.min(100, fadeIn, fadeOut));',
      '}'
    ].join('\n');
  }

  function pad(number) {
    return ('000' + number).slice(-3);
  }
}());
