var container;
var camera, scene, raycaster, renderer, parentTransform, sphereInter;
var mouse = new THREE.Vector2();
var el = document.getElementById('screen');
var radius = 100,
  theta = 0;
var currentIntersected;
init();
animate();

// Design sidenotes
// #ffe502 background could go to this with black text


// Update the info panel with stats on chosen commit
function updateInfo(o) {
  var commitDesc = document.getElementById('commit-desc');
  // var commitDate = document.getElementById('commit-date');
  var commitAdded = document.getElementById('commit-added');
  var commitRemoved = document.getElementById('commit-removed');

  var matches = gitHubData.filter(function(commit) {
    return commit.lineId === o.id;
  });

  var match = matches[0];

  // console.log(o.id + '?' + match.commit);
  commitDesc.innerHTML = match.commit;
  // commitDate.innerHTML = match.date;
  commitAdded.innerHTML = "+" + match.lines_added;
  commitRemoved.innerHTML = "-" + match.lines_removed;
}

function fakeData() {
  var data = new Array(50);
  var len = data.length;
  while (len--) {
    data[len] = ({
      created_at: new Date(),
      commit: "test " + Math.random(),
      lines_added: Math.round(Math.random() * 100),
      lines_removed: Math.round(Math.random() * 100)
    })
  }
  return data;
}

function init() {
  // temporary until github
  gitHubData = gitHubData('zacacollier');

  container = document.createElement('div');
  el.appendChild(container);
  camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 1, 10000);
  scene = new THREE.Scene();
  var geometry = new THREE.SphereGeometry(5);
  var materialSphere = new THREE.MeshBasicMaterial({
    color: 0x999999
  });
  sphereInter = new THREE.Mesh(geometry, materialSphere);
  sphereInter.visible = false;
  scene.add(sphereInter);
  var geometry = new THREE.Geometry();
  var point = new THREE.Vector3();
  var direction = new THREE.Vector3();

  // 50 would be lines length
  // (T)
  for (var i = 0; i < 50; i++) {
    direction.x += Math.random() - 0.5;
    direction.y += Math.random() - 0.5;
    direction.z += Math.random() - 0.5;
    direction.normalize().multiplyScalar(10);
    point.add(direction);
    geometry.vertices.push(point.clone());
  }

  console.log(geometry.vertices.length);
  for (var i = 0; i < geometry.vertices.length; i++) {
    var r = i > 20 ? 1 : 0;
    var g = i < 20 ? 1 : .3;
    var b = i < 20 ? 0 : .50;
    geometry.colors[i] = new THREE.Color(r, g, b);
    // geometry.colors[i] = new THREE.Color(Math.random(), Math.random(), Math.random());
    // geometry.colors[i+1] = geometry.colors[i];
  }

  var materialLine = new THREE.LineBasicMaterial({
    linewidth: 1,
    color: 0x999999,
    vertexColors: THREE.VertexColors
  });
  // var material = new THREE.LineBasicMaterial({
  //   linewidth: 1,
  //   color: 0xffffff,
  //   vertexColors: THREE.VertexColors
  // });

  parentTransform = new THREE.Object3D();
  parentTransform.position.x = Math.random() * 40 - 20;
  parentTransform.position.y = Math.random() * 40 - 20;
  parentTransform.position.z = Math.random() * 40 - 20;
  parentTransform.rotation.x = Math.random() * 2 * Math.PI;
  parentTransform.rotation.y = Math.random() * 2 * Math.PI;
  parentTransform.rotation.z = Math.random() * 2 * Math.PI;
  parentTransform.scale.x = Math.random() + 0.5;
  parentTransform.scale.y = Math.random() + 0.5;
  parentTransform.scale.z = Math.random() + 0.5;

  // Put a bunch of lines composed of segments we built in (T)
  for (var i = 0; i < gitHubData.length /*50*/ ; i++) {
    var object;
    // var materialx = new THREE.LineBasicMaterial({
    //   color: i > 25 ? 0xFF0000 : 0x00FF00,
    // });
    if (Math.random()) {
      object = new THREE.Line(geometry, materialLine);
    } else {
      object = new THREE.LineSegments(geometry);
    }
    gitHubData[i].lineId = object.id;
    object.position.x = Math.random() * 400 - 200;
    object.position.y = Math.random() * 400 - 200;
    object.position.z = Math.random() * 400 - 200;
    object.rotation.x = Math.random() * 2 * Math.PI;
    object.rotation.y = Math.random() * 2 * Math.PI;
    object.rotation.z = Math.random() * 2 * Math.PI;
    object.scale.x = Math.random() + 0.5;
    object.scale.y = Math.random() + 0.5;
    object.scale.z = Math.random() + 0.5;
    parentTransform.add(object);
  }
  scene.add(parentTransform);
  raycaster = new THREE.Raycaster();
  raycaster.linePrecision = 3;
  renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true
  });
  renderer.setClearColor(0x999999, 0);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  container.appendChild(renderer.domElement);
  document.addEventListener('mousemove', onDocumentMouseMove, false);
  //
  window.addEventListener('resize', onWindowResize, false);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function onDocumentMouseMove(event) {
  event.preventDefault();
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
}
//
function animate() {
  requestAnimationFrame(animate);
  render();
}

function render() {
  theta += 0.1;
  camera.position.x = radius * Math.sin(THREE.Math.degToRad(theta));
  camera.position.y = radius * Math.sin(THREE.Math.degToRad(theta));
  camera.position.z = radius * Math.cos(THREE.Math.degToRad(theta));
  camera.lookAt(scene.position);
  camera.updateMatrixWorld();
  // find intersections
  raycaster.setFromCamera(mouse, camera);
  var intersects = raycaster.intersectObjects(parentTransform.children, true);
  if (intersects.length > 0) {
    if (currentIntersected !== undefined) {
      currentIntersected.material.linewidth = 1;
    }
    currentIntersected = intersects[0].object;
    updateInfo(currentIntersected);
    currentIntersected.material.linewidth = 5;
    sphereInter.visible = true;
    sphereInter.position.copy(intersects[0].point);
  } else {
    if (currentIntersected !== undefined) {
      currentIntersected.material.linewidth = 1;
    }
    currentIntersected = undefined;
    sphereInter.visible = false;
  }
  renderer.render(scene, camera);
}
