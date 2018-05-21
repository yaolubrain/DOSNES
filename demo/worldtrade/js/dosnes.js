var container, stats;

var camera, scene, renderer;

var light1, light2;

var group;
var sphere;

var mouse;
var mouseFree;
var mouseFreeScale;
var mouseXOnMouseDown = 0;
var mouseYOnMouseDown = 0;

var mouseXOnMouseDown = 0;
var mouseYOnMouseDown = 0;

var raycaster;

var windowHalfX = window.innerWidth / 2;
var windowHalfY = window.innerHeight / 2;

var deltaRotationQuaternion;

var data, classNames;

var labels = [];

var visibleLabels;
var activeLabel;

var labeLPositions = [];
var labeLWeights = [];

var stats;

var activeMaterial;

var textCap;

function init() {
    
    $.ajax({        
        url: "data/dosnes.csv",
        async: false,
        success: function (str) {
            data = $.csv.toArrays(str);        
            console.log(data)
        },
        dataType: "text",
        complete: function () {   
            console.log(data[0])     
        }
    });

    $.ajax({        
        url: "data/labels.txt",
        async: false,
        success: function (str) {
            classNames = str.split("\n");
        },
        dataType: "text",
        complete: function () {   
            console.log(classNames[0])     
        }
    });
        
    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.01, 10 );
    camera.position.z = 1.8;        

    light1 = new THREE.DirectionalLight( 0xeeeeee );
    light1.position.set( 0, 0, 1 );
    light2 = new THREE.AmbientLight( 0x222222 );
    scene.add( light1 );
    scene.add( light2 );
    
    var geometry = new THREE.SphereGeometry( 1, 128, 128 );
    var material  = new THREE.MeshPhongMaterial()
    sphere = new THREE.Mesh(geometry, material);      
     
    var pointMaterial = new THREE.MeshPhongMaterial( { color: 0x0000ff } );            
    var pointsGeo = new THREE.Geometry();
   
    for (var i = 0; i < data.length; ++i) {        
        var pos = new THREE.Vector3( data[i][0], data[i][1], data[i][2] );
        labeLPositions[i] = pos;
        labeLWeights[i] = data[i][4];

        var zAxis = new THREE.Vector3(0,0,1);
        var rotAxis = new THREE.Vector3();
        rotAxis.crossVectors( zAxis, pos );
        rotAxis.normalize();
    
        var pointGeo = new THREE.CircleGeometry( 0.005 * data[i][4], 16 );
        pointGeo.applyMatrix( new THREE.Matrix4().makeTranslation( 0, 0, 1.001 ) );
        pointGeo.applyMatrix( new THREE.Matrix4().makeRotationAxis( rotAxis, pos.angleTo(zAxis) ) );

        pointsGeo.merge(pointGeo);
    }
        

    var points = new THREE.Mesh(pointsGeo, pointMaterial);
               
    visibleLabels = new THREE.Object3D();
    for (var i = 0; i < data.length; ++i) {        
        var label = makeTextSprite( classNames[i], 2.5, { r:0, g:0, b:0, a:1.0 } );        
        label.userData = { index: i, weight: data[i][4] };
        label.position.set( data[i][0], data[i][1], data[i][2] );
        visibleLabels.add(label);        
    }

    data = null;


    group = new THREE.Object3D();  
    group.add(points);

    activeLabel = new THREE.Object3D();  

    scene.add( sphere );
    scene.add( group );
    scene.add( visibleLabels );    
    scene.add( activeLabel );    

    renderer = new THREE.WebGLRenderer( { antialias: true, alpha: true, preserveDrawingBuffer: true } );
    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.sortObjects = false
    renderer.setClearColor( 0xC2DFFF, 1);

    container = document.getElementById( 'container' );
    container.appendChild( renderer.domElement );

    mouse = new THREE.Vector2();
    mouseFree = new THREE.Vector2();
    mouseFreeScale = new THREE.Vector2();

    raycaster = new THREE.Raycaster();

    activeMaterial = new THREE.MeshPhongMaterial( { color: 0xff0000 } );         
    activeMaterial.depthWrite = false;
    activeMaterial.depthTest = false;

    textCap = document.createElement('div');
    textCap.style.position = 'absolute';
    textCap.style.backgroundColor = "white";
    textCap.style.display = 'inline-block';
    document.body.appendChild(textCap);

    document.addEventListener( 'mousedown', onDocumentMouseDown, false );
    document.addEventListener( 'mousewheel', onDocumentMouseWheel, false );
    document.addEventListener( 'DOMMouseScroll', onDocumentMouseWheel, false);
    document.addEventListener( 'mousemove', onDocumentMouseFreeMove, false );
    window.addEventListener( 'keydown', onKeyDown, false);
    window.addEventListener( 'resize', onWindowResize, false );    

}

function makeTextSprite( message, weight, color ) {
    var fontface = "Monospace";
    var fontsize = 50;
    var borderThickness = 0;
    var borderColor = color;
    var backgroundColor = { r:255, g:255, b:255, a:1.0 };
    var textColor = color;

    var canvas = document.createElement('canvas');
    canvas.width = 512
    canvas.height = 128
    var context = canvas.getContext('2d');
    context.font = fontsize + "px " + fontface;
    var metrics = context.measureText( message );
    var textWidth = metrics.width;

    context.fillStyle = "rgba("+textColor.r+", "+textColor.g+", "+textColor.b+", 1.0)";
    context.fillText( message, (canvas.width/2) - (textWidth / 2), 60);
    context.textBaseline = 'middle';
    context.textAlign = "center";

    var texture = new THREE.Texture(canvas) 
    texture.needsUpdate = true;

    var spriteMaterial = new THREE.SpriteMaterial( { map: texture} );
    spriteMaterial.depthWrite = false;
    spriteMaterial.depthTest = false;
        
    var sprite = new THREE.Sprite( spriteMaterial );
    sprite.scale.set( 0.002*weight * fontsize, 0.001*weight * fontsize, 0.01 * fontsize);
    return sprite;  
}


function onWindowResize() {
    windowHalfX = window.innerWidth / 2;
    windowHalfY = window.innerHeight / 2;

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );
}

function onDocumentMouseDown( event ) {
    event.preventDefault();

    document.addEventListener( 'mousemove', onDocumentMouseMove, false );
    document.addEventListener( 'mouseup', onDocumentMouseUp, false );
    document.addEventListener( 'mouseout', onDocumentMouseOut, false );

    mouseXOnMouseDown = event.clientX - windowHalfX;    
    mouseYOnMouseDown = event.clientY - windowHalfY;    
}

function onDocumentMouseFreeMove( event ) {
    mouseFree.x = event.clientX;
    mouseFree.y = event.clientY;
}

function onDocumentMouseMove( event ) {
    mouse.x = event.clientX - windowHalfX;
    mouse.y = event.clientY - windowHalfY;

    deltaRotationQuaternion = new THREE.Quaternion()
            .setFromEuler(new THREE.Euler(
                (mouse.y - mouseYOnMouseDown) * Math.PI / 10000,
                (mouse.x - mouseXOnMouseDown) * Math.PI / 10000,                
                0, 'XYZ'));

    group.quaternion.multiplyQuaternions( deltaRotationQuaternion, group.quaternion );
    visibleLabels.quaternion.multiplyQuaternions( deltaRotationQuaternion, visibleLabels.quaternion );
    activeLabel.quaternion.multiplyQuaternions( deltaRotationQuaternion, activeLabel.quaternion );
}

function onDocumentMouseUp( event ) {
    document.removeEventListener( 'mousemove', onDocumentMouseMove, false );
    document.removeEventListener( 'mouseup', onDocumentMouseUp, false );
    document.removeEventListener( 'mouseout', onDocumentMouseOut, false );
}

function onDocumentMouseOut( event ) {
    document.removeEventListener( 'mousemove', onDocumentMouseMove, false );
    document.removeEventListener( 'mouseup', onDocumentMouseUp, false );
    document.removeEventListener( 'mouseout', onDocumentMouseOut, false );
}

function onDocumentMouseWheel( event ) {      
    var d = ((typeof event.wheelDelta != "undefined") ? (-event.wheelDelta) : event.detail);
    camera.position.z += 0.02*d;       

    if (camera.position.z < 1.1) {
        camera.position.z = 1.1;
    }    
}

function onKeyDown( event ) {      
    if (event.keyCode == "80") {
        var strDownloadMime = "image/octet-stream";
        var strMime = "image/png";
        imgData = renderer.domElement.toDataURL(strMime);
        saveFile(imgData.replace(strMime, strDownloadMime), "nips_dosnes.png");
        console.log('screen shot');
    }
}

var saveFile = function (strData, filename) {
    var link = document.createElement('a');
    if (typeof link.download === 'string') {
        document.body.appendChild(link); //Firefox requires the link to be in the body
        link.download = filename;
        link.href = strData;
        link.click();
        document.body.removeChild(link); //remove the link when done
    } else {
        location.replace(uri);
    }
}

function animate() {

	visibleLabels.updateMatrixWorld()

    var vec = new THREE.Vector3(0,0,1);
    vec.applyMatrix4( visibleLabels.matrixWorld );
	
    // ray tracing to highlight the active label
    mouseFreeScale.x = (mouseFree.x / window.innerWidth ) * 2 - 1;
    mouseFreeScale.y = - ( mouseFree.y / window.innerHeight ) * 2 + 1;     

    raycaster.setFromCamera( mouseFreeScale, camera );
    var intersects = raycaster.intersectObjects( [sphere] );

    for (var i = 0; i < visibleLabels.children.length; ++i) {
        var pos = labeLPositions[ visibleLabels.children[i].userData.index ].clone();
        pos.applyMatrix4( visibleLabels.matrixWorld );

        if (pos.z >= 1/ camera.position.z ) {
            visibleLabels.children[i].visible = true;
        }  else {
            visibleLabels.children[i].visible = false;
        }

    }


    activeSet = [];

	for (var i = 0; i < labeLPositions.length; ++i) {

        var pos = labeLPositions[i].clone()
        pos.applyMatrix4( visibleLabels.matrixWorld );

        if (intersects.length > 0) {
            var hitPos = intersects[0].point;     
            var dist = pos.distanceTo(hitPos);
            if (dist < 0.005 * labeLWeights[i]) {
                activeSet.push([i, pos, dist, 0.005 * labeLWeights[i]]);
            }
        }
    }


    var pointIdx;
    var minDist = 10;
    for (var i = 0; i < activeSet.length; ++i) {
        var dist = activeSet[i][2];
        if (dist < minDist) {
            minDist = dist;
            pointIdx = i;
        }
    }

    var point;
    if (activeSet.length > 0) {
        var idx = activeSet[pointIdx][0];
        var pos = activeSet[pointIdx][1];
        var radius = activeSet[pointIdx][3];

        var zAxis = new THREE.Vector3(0,0,1);
        var rotAxis = new THREE.Vector3();
        rotAxis.crossVectors( zAxis, pos );
        rotAxis.normalize();

        var pointGeo = new THREE.CircleGeometry( radius, 16 );
        pointGeo.applyMatrix( new THREE.Matrix4().makeTranslation( 0, 0, 1.001 ) );
        pointGeo.applyMatrix( new THREE.Matrix4().makeRotationAxis( rotAxis, pos.angleTo(zAxis) ) );

        point = new THREE.Mesh(pointGeo, activeMaterial);
        scene.add(point);
    }

    textCap.innerHTML = classNames[idx];
    textCap.style.top = mouseFree.y + 20 + 'px';
    textCap.style.left = mouseFree.x + 20 + 'px';
    

    if (activeSet.length == 0) {
        textCap.style.visibility = "hidden";
    } else {
        textCap.style.visibility = "visible";
    }
    
    
    renderer.render( scene, camera );    

    if (activeSet.length != 0) {
        scene.remove(point);
    }
        
    requestAnimationFrame( animate );

}

init();
animate();
