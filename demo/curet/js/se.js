var container, stats;

var camera, scene, renderer;

var group, text, plane;

var mouseX = 0;
var mouseXOnMouseDown = 0;

var mouseY = 0;
var mouseYOnMouseDown = 0;

var windowHalfX = window.innerWidth / 2;
var windowHalfY = window.innerHeight / 2;

var finalRotationY;

var deltaRotationQuaternion;

var data;

init();
animate();

function init() {

    $.ajax({
        url: "data/se.csv",
        async: false,
        success: function (csvd) {
            data = $.csv.toArrays(csvd);        
        },
        dataType: "text",
        complete: function () {   
            console.log(data[0])     
        }
    });

        
    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.001, 10000 );
    camera.position.z = 1.8;          

    light = new THREE.DirectionalLight( 0xeeeeee );
    light.position.set( 0, 0, 1 );
    scene.add( light );

    light = new THREE.AmbientLight( 0x222222 );
    scene.add( light );
    
    var geometry = new THREE.SphereGeometry( 1, 128, 128 );

    var material  = new THREE.MeshPhongMaterial()
    var sphere = new THREE.Mesh(geometry, material);      

    var points = new THREE.Object3D();
    for (var c = 0; c < 100; ++c) {
        var pointMaterial = new THREE.MeshPhongMaterial( { color: (c / 100 + 0.01) * 0xffff00 } );      
        var pointsGeo = new THREE.Geometry();
   
        for (var i = 0; i < data.length; ++i) {    
            if (data[i][3] == c) {
                var pos = new THREE.Vector3( data[i][0], data[i][1], data[i][2] );
                
                var zAxis = new THREE.Vector3(0,0,1);
                var rotAxis = new THREE.Vector3();
                rotAxis.crossVectors( zAxis, pos );
                rotAxis.normalize();
            
                var pointGeo = new THREE.CircleGeometry( 0.01, 16 );
                pointGeo.applyMatrix( new THREE.Matrix4().makeTranslation( 0, 0, 1.001 + 0.0001*c ) );
                pointGeo.applyMatrix( new THREE.Matrix4().makeRotationAxis( rotAxis, pos.angleTo(zAxis) ) );

                pointsGeo.merge(pointGeo);
            }                        
        }

        var classPoints = new THREE.Mesh(pointsGeo, pointMaterial);
        points.add(classPoints);
    }
	
        
    var labels = new THREE.Object3D();
    for (var i = 0; i < 0; ++i) {
        var text = createText2D(i.toString());            
        text.position.set( 0, 0, 1.001);

        var label = new THREE.Object3D();
        label.add(text);
        label.rotation.x = 10*Math.random(); 
        label.rotation.y = 10*Math.random(); 
        label.rotation.z = 10*Math.random(); 
        labels.add(label);
    }

    group = new THREE.Object3D();  
    group.add( sphere );
    group.add( points );
    group.add( labels );    
    scene.add( group );

    renderer = new THREE.WebGLRenderer( { antialias: true, alpha: true, preserveDrawingBuffer: true } );
    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.setClearColor( 0xC2DFFF, 1);

    container = document.getElementById( 'container' );
    container.appendChild( renderer.domElement );

    document.addEventListener( 'mousedown', onDocumentMouseDown, false );
    document.addEventListener( 'mousewheel', onDocumentMouseWheel, false );
    document.addEventListener( 'DOMMouseScroll', onDocumentMouseWheel, false);
    window.addEventListener( 'keydown', onKeyDown, false);
    window.addEventListener( 'resize', onWindowResize, false );    
}

function createTextCanvas(text, color, font, size) {
    size = size || 80;
    var canvas = document.createElement('canvas');
    var ctx = canvas.getContext('2d');
    var fontStr = (size + 'px ') + (font || 'Arial');
    ctx.font = fontStr;
    var w = ctx.measureText(text).width;
    var h = Math.ceil(size);
    canvas.width = w;
    canvas.height = h;
    ctx.font = fontStr;
    ctx.fillStyle = color || 'black';
    ctx.fillText(text, 0, Math.ceil(size * 0.8));
    return canvas;
}

function createText2D(text, color, font, size, segW, segH) {
    var canvas = createTextCanvas(text, color, font, size);
    var plane = new THREE.PlaneGeometry(canvas.width, canvas.height, segW, segH);
    plane.center();
    var tex = new THREE.Texture(canvas);
    tex.needsUpdate = true;
    var planeMat = new THREE.MeshPhongMaterial({
        map: tex,
        color: 0xffffff,
        transparent: true
    });
    var mesh = new THREE.Mesh(plane, planeMat);
    mesh.scale.set(0.0025, 0.0025, 0.0025);
    mesh.doubleSided = true;
    return mesh;
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

    mouseX = event.clientX - windowHalfX;
    mouseY = event.clientY - windowHalfY;

    deltaRotationQuaternion = new THREE.Quaternion()
            .setFromEuler(new THREE.Euler(
                (mouseY - mouseYOnMouseDown) * Math.PI / 10000,
                (mouseX - mouseXOnMouseDown) * Math.PI / 10000,                
                0, 'XYZ'));

    group.quaternion.multiplyQuaternions(deltaRotationQuaternion, group.quaternion);
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
        saveFile(imgData.replace(strMime, strDownloadMime), "curet_se.png");
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
    requestAnimationFrame( animate );
    renderer.render( scene, camera );
}
