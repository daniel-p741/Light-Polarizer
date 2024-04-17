window.onload = function () {
    let showSineWave = false;
    let showCircularWave = false;
    let showUnpolarizedWave = false;
    // Get the DOM element to attach the scene
    const container = document.querySelector('#canvas-container');


    let clock = new THREE.Clock();

    // Create the scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xabcdef);

    // Create and position the camera
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    // Position the camera closer to the object
    camera.position.set(0, 0, 10);
    camera.lookAt(scene.position);

    // Create the renderer and attach it to the DOM
    //const renderer = new THREE.WebGLRenderer();
    const renderer = new THREE.WebGLRenderer({ antialias: true });

    renderer.setSize(container.offsetWidth, container.offsetHeight);
    container.appendChild(renderer.domElement);

    //const polarizerGeometry = new THREE.BoxGeometry(120, 73, 10, 104, 104, 1); // Added depth of 10

    const polarizerWidth = 1.5;

    const polarizerHeight = 0.1;
    const polarizerGeometry = new THREE.BoxGeometry(polarizerWidth, polarizerHeight, 3);


    const polarizerMaterial = new THREE.MeshPhongMaterial({
        color: 0x808080, // gray color
        transparent: true,
        opacity: 0.24, // more transparent
        shininess: 100,
        reflectivity: 0.5,
        flatShading: true,
    });

    const polarizer = new THREE.Mesh(polarizerGeometry, polarizerMaterial);
    polarizer.position.set(0, 0, 5);
    polarizer.rotation.x = 2;

    polarizer.rotation.z = 2.1;

    scene.add(polarizer);



    const visibleWidthAtZDepth = (depth, camera) => {
        const cameraOffset = camera.position.z;
        if (depth < cameraOffset) depth -= cameraOffset;
        else depth += cameraOffset;

        const vFOV = camera.fov * Math.PI / 180;
        const height = 2 * Math.tan(vFOV / 2) * Math.abs(depth);
        const aspect = camera.aspect;
        const width = height * aspect;
        return width;
    }



    const polarizerZ = polarizer.position.z;
    const totalWidth = visibleWidthAtZDepth(polarizerZ, camera);
    const leftMostPoint = -totalWidth / 2;
    const aspect = window.innerWidth / window.innerHeight;
    const rightMostPoint = aspect * camera.fov * Math.abs(polarizerZ);

    const left_material = new MeshLineMaterial({
        useMap: false,
        color: new THREE.Color(0xffff00),
        lineWidth: 0.015,  // Adjust line width
        sizeAttenuation: false, // Line width is constant regardless of distance from camera
        transparent: true,
    });

    const left_points = [];
    for (let i = leftMostPoint; i <= 0; i += 0.1) {
        left_points.push(new THREE.Vector3(i, 0, polarizerZ));
    }

    const left_line = new MeshLine();
    left_line.setPoints(left_points);

    const left_mesh = new THREE.Mesh(left_line.geometry, left_material);
    scene.add(left_mesh);



    document.getElementById('linearlyPolarizedButton').addEventListener('click', function () {
        showSineWave = !showSineWave;
        showCircularWave = false;  // Ensure only one type of polarization is active
        showUnpolarizedWave = false;  // Ensure only one type of polarization is active

    });

    document.getElementById('circularlyPolarizedButton').addEventListener('click', function () {
        showCircularWave = !showCircularWave;
        showSineWave = false;  // Ensure only one type of polarization is active
        showUnpolarizedWave = false;  // Ensure only one type of polarization is active
    });

    document.getElementById('unPolarizedButton').addEventListener('click', function () {
        showUnpolarizedWave = !showUnpolarizedWave;
        showSineWave = false;  // Ensure only one type of polarization is active
        showCircularWave = false;  // Ensure only one type of polarization is active
    });

    // Create a yellow line
    const material = new MeshLineMaterial({
        useMap: false,
        color: new THREE.Color(0xffff00), // Yellow color
        lineWidth: 0.015,  // Adjust line width
        sizeAttenuation: false, // Line width is constant regardless of distance from camera
        transparent: true,
    });

    //let unpolarizedPhase = 0;
    //let unpolarizedAmplitude = 1;  // Same amplitude as polarized waves for comparable crests
    //let amplitudeY = 1;
    //let amplitudeZ = 1;
    const maxAmplitude = 1;  // Maximum crest height
    const maxFrequency = 1;  // Frequency, measured in cycles per 2π radians
    //let randomAmplitude = maxAmplitude * (0.5 + Math.random() * 0.5); // Random amplitude between 0.5 and 1
    //let randomFrequency = maxFrequency * (0.75 + Math.random() * 0.25); // Random frequency between 0.75 and 1 cycles per 2π

    let updateFrequency = 100;  // Update every 100 frames
    let frameCounter = 0;
    let randomAmplitude = maxAmplitude * (0.5 + Math.random() * 0.5); // Initial random amplitude
    let randomFrequency = maxFrequency * (0.75 + Math.random() * 0.25); // Initial random frequency

    const points = [];
    for (let i = polarizerWidth / 2; i <= rightMostPoint; i += 0.1) {
        if (showSineWave) {
            points.push(new THREE.Vector3(i, Math.sin(i), 0));
        } else if (showCircularWave) {
            points.push(new THREE.Vector3(i, Math.sin(i), Math.cos(i)));
        } else if (showUnpolarizedWave) {
            // Applying random amplitude and frequency within bounds
            let y = Math.sin(randomFrequency * i) * randomAmplitude;
            let z = Math.cos(randomFrequency * i) * randomAmplitude;
            points.push(new THREE.Vector3(i, y, z));
        } else {
            points.push(new THREE.Vector3(i, 0, 0));
        }
    }

    const lineGeometry = new MeshLine();
    lineGeometry.setPoints(points);

    const line = new THREE.Mesh(lineGeometry.geometry, material);
    scene.add(line);

    // Shift the starting point down
    const shiftDown = 2.2;
    points[0].y -= shiftDown;

    function animate() {
        requestAnimationFrame(animate);
        const time = clock.getElapsedTime();

        // Increment frame counter at the start of each frame
        frameCounter++;

        // Update random amplitude and frequency at a controlled rate
        if (frameCounter % updateFrequency === 0) {
            randomAmplitude = maxAmplitude * (0.5 + Math.random() * 0.5);  // Random amplitude between 0.5 and 1
            randomFrequency = maxFrequency * (0.75 + Math.random() * 0.25);  // Random frequency between 0.75 and 1 cycles per 2π
        }

        for (let i = 0; i < points.length; i++) {
            if (showSineWave) {
                points[i].y = Math.sin(points[i].x + time);
                points[i].z = 0;
            } else if (showCircularWave) {
                points[i].y = Math.sin(points[i].x + time);
                points[i].z = Math.cos(points[i].x + time);
            } else if (showUnpolarizedWave) {
                points[i].y = Math.sin(randomFrequency * (points[i].x + time)) * randomAmplitude;
                points[i].z = Math.cos(randomFrequency * (points[i].x + time)) * randomAmplitude;
            } else {
                points[i].y = 0;
                points[i].z = 0;
            }
        }

        lineGeometry.setPoints(points);  // Re-assigning updated points to the geometry
        line.geometry.attributes.position.needsUpdate = true;  // Informing Three.js that the positions need an update

        renderer.render(scene, camera);
    }
    animate();
};