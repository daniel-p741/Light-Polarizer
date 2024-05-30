window.onload = function () {
    let showSineWave = true;
    let showCircularWave = false;
    let showUnpolarizedWave = false;

    const container = document.querySelector('#canvas-container');


    let clock = new THREE.Clock();


    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xabcdef);


    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

    camera.position.set(0, 0, 10);
    camera.lookAt(scene.position);



    const renderer = new THREE.WebGLRenderer({ antialias: true });

    renderer.setSize(container.offsetWidth, container.offsetHeight);
    container.appendChild(renderer.domElement);



    const polarizerWidth = 1.5;

    const polarizerHeight = 0.1;
    const polarizerGeometry = new THREE.BoxGeometry(polarizerWidth, polarizerHeight, 3);


    const polarizerMaterial = new THREE.MeshPhongMaterial({
        color: 0x808080,
        transparent: true,
        opacity: 0.24,
        shininess: 100,
        reflectivity: 0.5,
        flatShading: true,
    });

    const polarizer = new THREE.Mesh(polarizerGeometry, polarizerMaterial);
    polarizer.position.set(0, 0, 5);
    polarizer.rotation.x = 2;

    polarizer.rotation.z = 2.1;

    scene.add(polarizer);


    const rotationSlider = document.getElementById('Rotation');
    const rotationValue = document.getElementById('RotationValue');



    rotationSlider.addEventListener('input', function () {
        const degrees = parseInt(this.value);
        rotationValue.textContent = degrees;
        const radians = degrees * (Math.PI / 180);
        polarizer.rotation.y = radians;

    });







    const polarizerZ = polarizer.position.z;

    const aspect = window.innerWidth / window.innerHeight;
    const leftMostPoint = -aspect * camera.fov * Math.abs(polarizerZ);

    const rightMostPoint = aspect * camera.fov * Math.abs(polarizerZ);

    const left_material = new MeshLineMaterial({
        useMap: false,
        color: new THREE.Color(0xffff00),
        lineWidth: 0.015,
        sizeAttenuation: false,
        transparent: true,
    });


    const maxAmplitude = 1;
    const maxFrequency = 1;

    let updateFrequency = 100;
    let frameCounter = 0;
    let randomAmplitude = maxAmplitude * (0.5 + Math.random() * 0.5);
    let randomFrequency = maxFrequency * (0.75 + Math.random() * 0.25);

    const left_points = [];
    for (let i = -polarizerWidth / 2; i >= leftMostPoint; i -= 0.1) {
        if (showSineWave) {
            left_points.push(new THREE.Vector3(i, Math.sin(i), 0));
        } else if (showCircularWave) {
            left_points.push(new THREE.Vector3(i, Math.sin(i), Math.cos(i)));
        } else if (showUnpolarizedWave) {
            // Applying random amplitude and frequency within bounds
            let y = Math.sin(randomFrequency * i) * randomAmplitude;
            let z = Math.cos(randomFrequency * i) * randomAmplitude;
            left_points.push(new THREE.Vector3(i, y, z));
        } else {
            left_points.push(new THREE.Vector3(i, 0, 0));
        }

    }

    const left_line = new MeshLine();
    left_line.setPoints(left_points);

    const left_mesh = new THREE.Mesh(left_line.geometry, left_material);
    scene.add(left_mesh);



    document.getElementById('linearlyPolarizedButton').addEventListener('click', function () {
        showSineWave = true;
        showCircularWave = false;
        showUnpolarizedWave = false;

    });

    document.getElementById('circularlyPolarizedButton').addEventListener('click', function () {
        showCircularWave = true;
        showSineWave = false;
        showUnpolarizedWave = false;
    });

    document.getElementById('unPolarizedButton').addEventListener('click', function () {
        showUnpolarizedWave = true;
        showSineWave = false;
        showCircularWave = false;
    });


    const material = new MeshLineMaterial({
        useMap: false,
        color: new THREE.Color(0xffff00),
        lineWidth: 0.015,
        sizeAttenuation: false,
        transparent: true,
    });



    const points = [];
    for (let i = polarizerWidth / 2; i <= rightMostPoint; i += 0.1) {

        points.push(new THREE.Vector3(i, Math.sin(i), 0));
    }

    const lineGeometry = new MeshLine();
    lineGeometry.setPoints(points);

    const line = new THREE.Mesh(lineGeometry.geometry, material);
    scene.add(line);


    const shiftDown = 2.2;
    points[0].y -= shiftDown;

    document.getElementById('Speed').addEventListener('input', function () {
        document.getElementById('SpeedValue').textContent = this.value;
        speedFactor = parseFloat(this.value);
    });

    document.getElementById('Frequency').addEventListener('input', function () {
        document.getElementById('FrequencyValue').textContent = this.value;
        frequencyFactor = parseFloat(this.value);
    });

    let speedFactor = parseFloat(document.getElementById('Speed').value);
    let frequencyFactor = parseFloat(document.getElementById('Frequency').value);



    function calculateIntensity() {
        const theta = polarizer.rotation.y;
        return Math.pow(Math.cos(theta), 2); // using Malus's Law
    }

    function animate() {
        requestAnimationFrame(animate);
        const intensity = calculateIntensity();
        material.opacity = intensity;
        const time = clock.getElapsedTime() * speedFactor;
        frameCounter++;

        // Update random amplitude and frequency at a controlled rate
        if (frameCounter % updateFrequency === 0) {
            randomAmplitude = maxAmplitude * (0.5 + Math.random() * 0.5);  // Random amplitude between 0.5 and 1
            randomFrequency = maxFrequency * (0.75 + Math.random() * 0.25);  // Random frequency between 0.75 and 1 cycles per 2π
        }

        for (let i = 0; i < points.length; i++) {
            let phase = frequencyFactor * (-points[i].x + time);

            points[i].y = Math.sin(phase) * intensity;
            points[i].z = 0;

        }
        lineGeometry.setPoints(points);
        line.geometry.attributes.position.needsUpdate = true;

        for (let i = 0; i < left_points.length; i++) {
            let phase = frequencyFactor * (left_points[i].x - time);
            if (showSineWave) {
                left_points[i].y = Math.sin(phase);
                left_points[i].z = 0;
            } else if (showCircularWave) {
                left_points[i].y = Math.sin(phase);
                left_points[i].z = Math.cos(phase);
            } else if (showUnpolarizedWave) {
                // For unpolarized waves, vary amplitude and frequency randomly
                left_points[i].y = Math.sin(randomFrequency * phase) * randomAmplitude;
                left_points[i].z = Math.cos(randomFrequency * phase) * randomAmplitude;


            } else {
                left_points[i].y = 0;
                left_points[i].z = 0;
            }
        }

        left_line.setPoints(left_points);
        left_mesh.geometry.attributes.position.needsUpdate = true;

        renderer.render(scene, camera);
    }
    animate();
};