var container, stats;

var camera, scene, renderer;

var light1, light2;

var labelPos;
var sphere;

var mouse;
var mouseXOnMouseDown = 0;
var mouseYOnMouseDown = 0;

var raycaster;

var windowHalfX = window.innerWidth / 2;
var windowHalfY = window.innerHeight / 2;

var deltaRotationQuaternion;

var data, classNames;

var points;

var stats;


function init() {
    
    $.ajax({        
        url: "data/mnist_data.csv",
        async: false,
        success: function (str) {
            data = $.csv.toArrays(str);   
        },
        dataType: "text",
        complete: function () {   
            console.log(data[0])     
        }
    });

    $.ajax({        
        url: "data/mnist_label_pos.csv",
        async: false,
        success: function (str) {
            labelPos = $.csv.toArrays(str);  
        },
        dataType: "text",
        complete: function () {   
            console.log(labelPos[0])     
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

    var geometry = new THREE.Geometry();

    var classColor = [];  
    classColor[0] = new THREE.Color( 0x40004b );      
    classColor[1] = new THREE.Color( 0x1f78b4 );      
    classColor[2] = new THREE.Color( 0xb2df8a );      
    classColor[3] = new THREE.Color( 0x33a02c );      
    classColor[4] = new THREE.Color( 0xfb9a99 );      
    classColor[5] = new THREE.Color( 0xe31a1c );      
    classColor[6] = new THREE.Color( 0xfdbf6f );      
    classColor[7] = new THREE.Color( 0xff7f00 );      
    classColor[8] = new THREE.Color( 0xcab2d6 );      
    classColor[9] = new THREE.Color( 0x6a3d9a );      
    

    var colors = [];
    for ( var i = 0; i < data.length; ++i ) {        
        geometry.vertices.push( new THREE.Vector3(data[i][0], data[i][1], data[i][2]) );
        var color = classColor[data[i][3] - 1];
        colors[i] = color.clone();
    }

    geometry.colors = colors;
    pMaterial = new THREE.PointsMaterial( {
        size: 0.003,
        transparent: false,        
        vertexColors: THREE.VertexColors
    } );

    points = new THREE.Points( geometry, pMaterial );


    labels = new THREE.Object3D();
    for (var i = 0; i < labelPos.length; ++i) {
        var label = makeTextSprite( i, 5, { r:0, g:0, b:0, a:1.0 } );        
        label.position.set( labelPos[i][0], labelPos[i][1], labelPos[i][2] );
        labels.add(label)        
    }


    scene.add( sphere );
    scene.add( points );
    scene.add( labels );

    renderer = new THREE.WebGLRenderer( { antialias: true, alpha: true, preserveDrawingBuffer: true } );
    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.setClearColor( 0xC2DFFF, 1);

    container = document.getElementById( 'container' );
    container.appendChild( renderer.domElement );

    mouse = new THREE.Vector2();


    document.addEventListener( 'mousedown', onDocumentMouseDown, false );
    document.addEventListener( 'mousewheel', onDocumentMouseWheel, false );
    document.addEventListener( 'DOMMouseScroll', onDocumentMouseWheel, false);    
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


function onDocumentMouseMove( event ) {
    mouse.x = event.clientX - windowHalfX;
    mouse.y = event.clientY - windowHalfY;

    deltaRotationQuaternion = new THREE.Quaternion()
            .setFromEuler(new THREE.Euler(
                (mouse.y - mouseYOnMouseDown) * Math.PI / 10000,
                (mouse.x - mouseXOnMouseDown) * Math.PI / 10000,                
                0, 'XYZ'));

    points.quaternion.multiplyQuaternions( deltaRotationQuaternion, points.quaternion );
    labels.quaternion.multiplyQuaternions( deltaRotationQuaternion, labels.quaternion );
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
        saveFile(imgData.replace(strMime, strDownloadMime), "mnist_dosnes.png");
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

    labels.updateMatrixWorld()
    for (var i = 0; i < labels.children.length; ++i) {
        var pos = labels.children[i].position.clone();
        pos.applyMatrix4( labels.matrixWorld );

        if (pos.z >= 1/ camera.position.z ) {
            labels.children[i].visible = true;
        }  else {
            labels.children[i].visible = false;
        }

    }

    renderer.render( scene, camera );    
        
    requestAnimationFrame( animate );

    stats.update();
}

init();
animate();