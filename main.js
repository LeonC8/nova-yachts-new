let scene, camera, renderer, globe, raycaster, mouse, tooltip;
let countries = [];
let revenueData = {};
let countryHoverData = null;
let rotationSpeed = 0.001;
let isRotating = true;

// Initialize the scene
function init() {
    // Create scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);

    // Create camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 200;

    // Create renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.getElementById('container').appendChild(renderer.domElement);

    // Add lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 3, 5);
    scene.add(directionalLight);

    // Create raycaster for interactions
    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();

    // Add controls
    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.rotateSpeed = 0.5;
    controls.addEventListener('start', () => { isRotating = false; });
    controls.addEventListener('end', () => { isRotating = true; });

    // Get tooltip element
    tooltip = document.getElementById('tooltip');

    // Event listeners
    window.addEventListener('resize', onWindowResize);
    window.addEventListener('mousemove', onMouseMove);

    // Load data and create globe
    loadData();
}

// Load GeoJSON and revenue data
async function loadData() {
    try {
        // Load GeoJSON data
        const geoResponse = await fetch('https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson');
        const geoData = await geoResponse.json();
        
        // Generate random revenue data for demonstration
        // In a real application, you would load actual data
        geoData.features.forEach(country => {
            const id = country.properties.ISO_A3;
            revenueData[id] = {
                revenue: Math.random() * 1000, // Random revenue between 0-1000
                name: country.properties.ADMIN
            };
        });
        
        // Create the globe
        createGlobe(geoData);
        
        // Hide loading message
        document.getElementById('loading').style.display = 'none';
        
        // Start animation
        animate();
    } catch (error) {
        console.error('Error loading data:', error);
        document.getElementById('loading').innerHTML = 'Error loading data. Please refresh.';
    }
}

// Create globe with countries
function createGlobe(geoData) {
    // Create base globe
    const globeGeometry = new THREE.SphereGeometry(100, 64, 64);
    const globeMaterial = new THREE.MeshPhongMaterial({
        color: 0x3377ff,
        transparent: true,
        opacity: 0.2
    });
    globe = new THREE.Mesh(globeGeometry, globeMaterial);
    scene.add(globe);

    // Create country meshes
    const projection = d3.geoOrthographic().scale(100).translate([0, 0]);
    
    geoData.features.forEach(feature => {
        try {
            const countryId = feature.properties.ISO_A3;
            const revenue = revenueData[countryId]?.revenue || 0;
            
            // Skip countries with no geometry
            if (!feature.geometry) return;
            
            const color = getColorFromRevenue(revenue);
            const material = new THREE.MeshPhongMaterial({
                color: new THREE.Color(color),
                side: THREE.DoubleSide
            });
            
            // Create shapes from coordinates
            const shapes = [];
            
            if (feature.geometry.type === 'Polygon') {
                const shape = createShapeFromCoordinates(feature.geometry.coordinates[0], projection);
                shapes.push(shape);
            } else if (feature.geometry.type === 'MultiPolygon') {
                feature.geometry.coordinates.forEach(polygon => {
                    const shape = createShapeFromCoordinates(polygon[0], projection);
                    shapes.push(shape);
                });
            }
            
            shapes.forEach(shape => {
                if (shape.curves.length > 0) {
                    const geometry = new THREE.ShapeGeometry(shape);
                    const mesh = new THREE.Mesh(geometry, material);
                    mesh.userData = {
                        countryId: countryId,
                        name: feature.properties.ADMIN,
                        revenue: revenue
                    };
                    
                    // Extrude the country shape slightly
                    mesh.position.z = 0.5;
                    
                    countries.push(mesh);
                    globe.add(mesh);
                }
            });
        } catch (e) {
            console.error(`Error creating country ${feature.properties.ADMIN}:`, e);
        }
    });
}

// Helper to create a shape from coordinates
function createShapeFromCoordinates(coordinates, projection) {
    const shape = new THREE.Shape();
    
    coordinates.forEach((coord, i) => {
        const projectedCoord = projection(coord);
        if (projectedCoord) {
            const [x, y] = projectedCoord;
            if (i === 0) {
                shape.moveTo(x, y);
            } else {
                shape.lineTo(x, y);
            }
        }
    });
    
    return shape;
}

// Get color based on revenue value
function getColorFromRevenue(revenue) {
    // Normalize revenue to 0-1 range for color scale
    const normalizedRevenue = revenue / 1000;
    
    // Use d3 color scale - you can change to any d3 scale you prefer
    return d3.interpolateYlOrRd(normalizedRevenue);
}

// Handle window resize
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// Handle mouse movement for hover effects
function onMouseMove(event) {
    // Calculate mouse position in normalized device coordinates
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    
    // Position tooltip
    tooltip.style.left = `${event.clientX + 15}px`;
    tooltip.style.top = `${event.clientY + 15}px`;
    
    // Check for intersections
    raycaster.setFromCamera(mouse, camera);
    
    // Flatten the countries to check intersections
    const countryMeshes = countries.filter(country => country.userData);
    
    const intersects = raycaster.intersectObjects(countryMeshes);
    
    if (intersects.length > 0) {
        const country = intersects[0].object;
        
        // Display tooltip
        tooltip.innerHTML = `
            <i class="fas fa-globe"></i> <strong>${country.userData.name}</strong><br>
            <i class="fas fa-dollar-sign"></i> Revenue: $${country.userData.revenue.toFixed(2)}M
        `;
        tooltip.style.opacity = 1;
        
        // Highlight country
        if (countryHoverData && countryHoverData.country !== country) {
            // Reset previous country
            countryHoverData.country.material.emissive.setHex(0x000000);
        }
        
        // Highlight current country
        country.material.emissive.setHex(0x555555);
        countryHoverData = { country };
    } else {
        // Reset hover effects if not hovering over any country
        if (countryHoverData) {
            countryHoverData.country.material.emissive.setHex(0x000000);
            countryHoverData = null;
        }
        
        // Hide tooltip
        tooltip.style.opacity = 0;
    }
}

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    
    // Auto-rotate if not being controlled
    if (isRotating) {
        globe.rotation.y += rotationSpeed;
    }
    
    renderer.render(scene, camera);
}

// Initialize the application
init(); 