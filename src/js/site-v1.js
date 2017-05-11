"use strict";
//console.log(ghData)
var container;
var filteredGitHubData;
var currLineId;
var camera, scene, raycaster, renderer, parentTransform, sphereInter;
var mouse = new THREE.Vector2();
var el = document.getElementById('screen');
var radius = 100,
    theta = 0;
var currentIntersected;
var commitsAdded = document.getElementById('commits-added');
var commitsRemoved = document.getElementById('commits-removed');
var codes = []; // stores code snippets for faster display

// DOM element holders
var commitDesc;
var commitAdded;
var commitRemoved;
var commitCode;
var commitNumber;


// The red and the green. it's possible to pass three numbers to generate a color e.g. 1, 0, .5 hence the arrays
const vcolors = {
  additions : [0x8de8c3],
  // additions : [0xffffff],
  deletions : [0xf90673],
}

filteredGitHubData = gitHubData('zacacollier')
// window.setTimeout(filteredGitHubData, 300)
// window.setTimeout(fetchGitHubCommits, 1700)
window.setInterval(filteredGitHubData, 7200000)
window.setInterval(fetchGitHubCommits, 7200000)
window.setTimeout(init, 2000)
window.setTimeout(animate, 2000)
console.log(filteredGitHubData)

// Design sidenotes
// #ffe502 background could go to this with black text
//

function updateInfo(o) {
  // We won't redisplay the same info as is displaying currently
  if (o.id === currLineId) {
    return
  }

  commitDesc = document.getElementById('commit-desc');
  commitAdded = document.getElementById('commit-added');
  commitRemoved = document.getElementById('commit-removed');
  commitCode = document.getElementById('commit-code');
  commitNumber = document.getElementById('commit-number');

  var stat = ghData.statsResponse.find(x => x.sha === o.id);

  var codeSample;
  try {
    function isString(o) {
      return (typeof o === 'string' || o instanceof String)
    }

    // console.log(stat)

    codeSample = codes[o.id] || stat.files.reduce((prev, curr) => prev + curr.patch, 10);

    // for performance let's store our collated codes
    if (!codes[o.id]) {
      codes[o.id] = codeSample; 
    }
  } catch (e) {
    codeSample = 'Codes not available';
  }

  // console.log(codeSample)

  commitNumber.innerText = ' ' + stat.commit.tree.sha;
  // commitCode.innerText = codeSample;
  animateCommit(codeSample);
  commitDesc.innerHTML = `<a title="Explore this commit on Github" href="${stat.html_url}" target="_blank">${stat.commit.message}</a>`;
  commitAdded.innerHTML = "+" + stat.stats.additions;
  commitRemoved.innerHTML = "-" + stat.stats.deletions;

  return currLineId = o.id
}

var animateIn, animateOut;

function animateTextOut(txt) {
  clearInterval(animateOut);
  var fromText = commitCode.innerText.split(' ');

  animateOut = setInterval(
    () => {
      commitCode.innerText = fromText.join(' ');
      fromText.pop();
      if (!fromText.length) {
        clearInterval(animateOut);
        animateTextIn(txt)
      }
    }, 50);
}

function animateTextIn(txt) {
  clearInterval(animateIn);
  var toText = txt.split(' '); // commitCode.innerText.split('').reverse();
  var targetText = txt.split(' ');
  var currentText = new Array(targetText.length).fill('x');
  animateIn = setInterval(
    () => {
      commitCode.innerText = currentText.join(' ');
      currentText.push(targetText.pop())
      if (!targetText.length) {
        clearInterval(animateIn);
        console.log('done');
      }
    }, 50);
}
// ntxt is new text that should animate in
function animateCommit (ntext) {
  // just use first thousand lines
  ntext =  ntext.slice(0, 5000);
  // animateTextOut(ntext);
  
  commitCode.innerText = ntext;
  // animate current code out

  // animate next code in 
  // var shuffleInterval = setInterval(function(){

    // // Generate random strings. You can modify the generator function range
    // // (Math.random()*(to-from+1)+from);
    // var shuffledText = '';
    // var j = originalText.length;
    // while(j--) shuffledText += String.fromCharCode((Math.random()*94+33) | 0);
    // // You can also use this generator to use only the remaining letters
    // // while(j--) shuffledText += originalText[(Math.random()*j) | 0];

    // // On every 10 cycles, remove a character from the original text to the decoded text
    // if(i++ % 10 === 0) decryptedText += originalText.pop();

    // // Display
    // decrypted.textContent = decryptedText;
    // encrypted.textContent = shuffledText;

    // // Stop when done
    // if(!shuffledText.length) clearInterval(shuffleInterval);

  //   // 50ms looks more dramatic
  // },50);

}

// Summary of activity for the lead. I'm sure there are slicker ways to calculate this
function updateSummary() {
  var acount = 0;
  var dcount = 0;

  for (let i = 0; i < ghData.statsResponse.length; i++) {
    // console.log(ghData.statsResponse[i])
    var stat = ghData.statsResponse[i].stats;
    acount += (stat.additions || 0);
    dcount += (stat.deletions || 0);
  }

  commitsAdded.innerHTML = acount;
  commitsRemoved.innerHTML = dcount;
}

/* After designated setTimeout,
 * initData will be logged to the console
 * for convenience during development
 */
function init() {
  /*
   * Bootstraps and initializes Three.js utilities
   */
  updateSummary();
  container = document.createElement('div');
  container.classList.add("easel");
  el.appendChild(container);
  camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 1, 10000);
  scene = new THREE.Scene();

  // Make sphere
  var geometrySphere = new THREE.SphereGeometry(5);
  var materialSphere = new THREE.MeshBasicMaterial({
    // color: 0x318177
    color: 0xFFFFFF
  });
  sphereInter = new THREE.Mesh(geometrySphere , materialSphere);
  sphereInter.visible = false;
  scene.add(sphereInter);

  const pi = 3.1415926535
  parentTransform = new THREE.Object3D();
  parentTransform.position.x = Math.random() * 40 - 20;
  parentTransform.position.y = Math.random() * 40 - 20;
  parentTransform.position.z = Math.random() * 40 - 20;
  parentTransform.rotation.x = Math.random() * 2 * pi;
  parentTransform.rotation.y = Math.random() * 2 * pi;
  parentTransform.rotation.z = Math.random() * 2 * pi;
  parentTransform.scale.x = Math.random() + 0.5;
  parentTransform.scale.y = Math.random() + 0.5;
  parentTransform.scale.z = Math.random() + 0.5;

  // console.log(ghData.statsResponse)

  var geometries = []
  var materialLines = []

  // Make lines (L)
  for (let i = 0; i < ghData.statsResponse.length; i++) {
    // ThreeJS building blocks for lines
    var geometry = new THREE.Geometry();
    var point = new THREE.Vector3();
    var direction = new THREE.Vector3();

    // Data stuff
    var commit = ghData.statsResponse[i];
    var numAdditions = commit.stats.additions;
    var numDeletions = commit.stats.deletions;
    var total = commit.stats.total;
    // Our line size would be derived from commit size. But some commits are
    // huge in terms of lines changed, so we must scale things
    // Scaling doesn't have to be exact. Just sorta accurate for our purposes
    var ratio = Math.min(numAdditions, numDeletions) / total;

    // Let's redefine our stats locally so we can build a smaller line
    numAdditions =  Math.min(60, numAdditions * numAdditions/total) | 0;
    numDeletions =  Math.min(60, numDeletions * numDeletions/total) | 0;
    total = numAdditions + numDeletions;

    // Make segments which make up the line
    for (let j = 0; j < total; j++) {
      direction.x += Math.random() - 0.5;
      direction.y += Math.random() - 0.5;
      direction.z += Math.random() - 0.5;
      direction.normalize().multiplyScalar(30);
      point.add(direction);
      geometry.vertices.push(point.clone());
      // We can get away with this because there are two types only
      let type = j < numAdditions ? 'additions' : 'deletions';
      geometry.colors[j] = new THREE.Color(...vcolors[type]);
    }
    // create the right color values
    // pick a material and assign the right color values
    var materialLine = new THREE.LineBasicMaterial({
      linewidth: 1,
      vertexColors: THREE.VertexColors
    });

    geometries.push(geometry);
    materialLines.push(materialLine);

    var object;
    object = new THREE.Line(geometries[i], materialLines[i]);
    ghData.statsResponse[i].sha = object.id;
    object.position.x = Math.random() * 400 - 200;
    object.position.y = Math.random() * 400 - 200;
    object.position.z = Math.random() * 400 - 200;
    object.rotation.x = Math.random() * 2 * pi;
    object.rotation.y = Math.random() * 2 * pi;
    object.rotation.z = Math.random() * 2 * pi;
    object.scale.x = Math.random() + 0.5;
    object.scale.y = Math.random() + 0.5;
    object.scale.z = Math.random() + 0.5;
    parentTransform.add(object);
  }

  // Math.PI is expensive, but we'll retain it here in a variable if needed
  // var Pi = Math.PI;

  // Put a bunch of lines composed of segments we built in (T)
  // NB: ghData is loaded from 'src/js/ghData.js'

  // SW: Create the line objects so that the lines appear
  // Each line is made from a geometry and a material that we
  // have crafted (L) for each of the N lines in our system

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

/*
 * (T):
 * Loop through GitHub data,
 * calculate and set vertices
 * for 'additions' and 'deletions'.
 * (e.g. statsResponse[x].stats.additions)
 */
/* g is a geometry object */
function calculateVertices(type, geo, limitTo) {
  var vcolors = {
    additions : [0, 1, 0],
    deletions : [1, 0, 0],
  }

  var clen = geo && geo.colors.length;

  for (let i = clen; i < limitTo + clen; i++) {
    geo.colors[i] = new THREE.Color(...vcolors[type]);
    //console.log(type+':'+vcolors[type])
  }

  return geo;
}
