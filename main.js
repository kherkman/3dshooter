/**
 * main.js
 * The core game engine. Initializes the game, manages the main loop,
 * handles level loading, and global state management.
 */

// --- GLOBAL SETUP ---
let scene, camera, renderer, controls, audioListener;
let playerObject, damageFlashElement, mapCanvas, mapCtx, mapBackgroundCanvas;
let levelObjects = {}; // To hold ground, lights etc. for easy removal
const clock = new THREE.Clock();

// --- AUDIO ---
const gameSounds = {};
let backgroundMusic;
let hasInteracted = false;
const gameSettings = { sfxVolume: 0.4, musicVolume: 0.2 };

// --- GAME OBJECTS & COLLECTIONS ---
const player = {}; // Will be populated from GameWorld.player
const bullets = [], rockets = [], plasmaRings = [], grenades = [], clusters = [], aliens = [], alienDebris = [], hitScatters = [], alienProjectiles = [], cyborgProjectiles = [], buildingColliders = [], shellCasings = [], blackHoles = [], shardProjectiles = [];
const collectibles = { jetpack: null, health: [], ammo: [], weaponPickups: [], fuelCells: [], glowingOrbs: [], xrayGoggles: null };
const interactables = [];
let spacecraft = null, motorcycle = null;
const vegetation = [], bunkers = [], bombs = [];
let gunModels = [];
let cockpitJoystick, cockpitHexHUD, starfield, wormAttackOverlay, toxicRainParticles;
const originalMaterials = new Map();
let xrayMaterials = {};

let initialInstructionsHTML = '';
const gunBasePosition = new THREE.Vector3(0.5, -0.4, -1);
let score = 0, health = 500, isGameOver = false, lastHealth = 500, isPaused = false;
let hyperspaceData = { time: 0, duration: 5.0, fadeTime: 1.5 };
const keys = {}, mouse = { isDown: false, x: 0, y: 0 };
let fKeyPressed = false;
const GRAVITY = 35.0;
let currentLevel = 'city';
let interactionPromptElement, inventoryMenu, cockpitOverlayElement;
let toxicStorm = { active: false, timer: 60 };
let lightningTimer = 5;

// --- DEBUG MENU ---
let debugMenu, previewRenderer, previewScene, previewCamera, previewObject, previewClock, previewAnimationId;
let isDebugMenuInitialized = false;
let previewAnimationState = null;


// --- INITIALIZATION ---
init();
animate();

function init() {
    initialInstructionsHTML = document.getElementById('instructions').innerHTML;

    scene = new THREE.Scene();
    Object.assign(player, GameWorld.player.initialState);
    player.velocity = new THREE.Vector3();

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, GameWorld.player.height, 0);
    audioListener = new THREE.AudioListener();
    camera.add(audioListener);
    loadSounds();
    playerObject = new THREE.Object3D();
    playerObject.position.set(0, 0, 10);
    playerObject.add(camera);
    scene.add(playerObject);

    damageFlashElement = document.getElementById('damage-flash');
    mapCanvas = document.getElementById('map-canvas');
    mapCtx = mapCanvas.getContext('2d');
    interactionPromptElement = document.getElementById('interaction-prompt');
    inventoryMenu = document.getElementById('inventory-menu');
    cockpitOverlayElement = document.getElementById('cockpit-overlay');
    wormAttackOverlay = document.getElementById('worm-attack-overlay');

    GameData.weapons.forEach(w => gunModels.push(w.model(true)));
    cockpitJoystick = GameWorld.spacecraft.createJoystickModel();
    cockpitHexHUD = GameWorld.spacecraft.createCockpitHUDModel();
    starfield = GameWorld.spacecraft.createStarfield();
    
    xrayMaterials = {
        wall: new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true, transparent: true, opacity: 0.15, depthWrite: false }),
        enemy: new THREE.MeshBasicMaterial({ color: 0xff0000, emissive: 0xff0000, emissiveIntensity: 2.0, depthWrite: false }),
        fuelCell: new THREE.MeshBasicMaterial({ color: 0x00ffff, emissive: 0x00ffff, emissiveIntensity: 2.0, depthWrite: false }),
        spacecraft: new THREE.MeshBasicMaterial({ color: 0x00ff00, emissive: 0x00ff00, emissiveIntensity: 2.0, depthWrite: false }),
    };
    
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.body.appendChild(renderer.domElement);
    
    setupHUD();
    gunModels.forEach((gun, index) => { 
        gun.position.copy(gunBasePosition);
        gun.visible = (index === player.currentWeaponIndex); 
        camera.add(gun);
    });
    camera.add(cockpitJoystick);
    camera.add(cockpitHexHUD);
    camera.add(starfield);

    setupControls(); 
    loadLevel('city', true);
    window.addEventListener('resize', onWindowResize);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// --- CORE GAME STATE & LOOP ---

function clearScene() {
    toggleXRayEffect(false); // Restore all materials before clearing
    
    for (let i = scene.children.length - 1; i >= 0; i--) {
        const obj = scene.children[i];
        if (obj === playerObject || obj === camera || obj instanceof THREE.AudioListener) {
            continue;
        }
        
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
             if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose());
             else obj.material.dispose();
        }
        scene.remove(obj);
    }
    
    if (levelObjects.hemisphereLight) scene.remove(levelObjects.hemisphereLight);
    if (levelObjects.directionalLight) scene.remove(levelObjects.directionalLight);
    if (levelObjects.ground) scene.remove(levelObjects.ground);
    if (toxicRainParticles) scene.remove(toxicRainParticles);
    levelObjects = {};

    aliens.length = 0; bullets.length = 0; rockets.length = 0; plasmaRings.length = 0; grenades.length = 0; clusters.length = 0; alienDebris.length = 0; hitScatters.length = 0; alienProjectiles.length = 0; cyborgProjectiles.length = 0; shellCasings.length = 0; blackHoles.length = 0; shardProjectiles.length = 0;
    collectibles.health.length = 0; collectibles.ammo.length = 0; collectibles.weaponPickups.length = 0; collectibles.jetpack = null; collectibles.fuelCells.length = 0; collectibles.glowingOrbs.length = 0; collectibles.xrayGoggles = null;
    interactables.length = 0; spacecraft = null; motorcycle = null;
    buildingColliders.length = 0; vegetation.length = 0; bunkers.length = 0; bombs.length = 0;
    toxicRainParticles = null;
}

function loadLevel(levelName, isInitialLoad = false, isLanding = false) {
    // --- PERSISTENT STATE ---
    // Store current state before clearing, if not initial load
    const preservedState = isInitialLoad ? 
        GameWorld.player.initialState : 
        {
            unlockedWeapons: [...player.unlockedWeapons],
            ammo: {...player.ammo},
            hasJetpack: player.hasJetpack,
            jetpackFuel: player.jetpackFuel,
            hasXRayGoggles: player.hasXRayGoggles
        };
    
    currentLevel = levelName;
    
    // Reset player state but keep persistent items
    Object.assign(player, GameWorld.player.initialState); // Reset to defaults first
    Object.assign(player, preservedState); // Then apply preserved state
    player.velocity = new THREE.Vector3();
    player.xrayGogglesActive = false; // Always turn off goggles on level change
    
    if (starfield) starfield.visible = false;
    if (isPaused) { document.getElementById('options-menu').style.display = 'none'; isPaused = false; }
    if (isGameOver) isGameOver = false;

    clearScene();
    
    const levelData = GameWorld.levels[levelName].create(scene, buildingColliders, vegetation, bunkers);
    levelObjects = { ...levelData };
    
    // Set player position and rotation first, BEFORE calculating relative object positions
    if (levelName === 'city') {
        playerObject.position.set(0, 0, 10);
    } else if (levelName === 'volcanic') {
        playerObject.position.set(0, 0, 55); // Spawn outside the pyramid
    } else {
        playerObject.position.set(0, 0, 0);
    }
    playerObject.quaternion.identity();
    camera.rotation.set(0,0,0);
    
    // Now, calculate the spacecraft landing position
    let spacecraftPosition;
    if (levelData.landingPadPosition) {
        spacecraftPosition = levelData.landingPadPosition;
    } else if (levelName === 'volcanic') {
        spacecraftPosition = new THREE.Vector3(60, 1.0, 60); // Land far from pyramid
    } else {
        spacecraftPosition = playerObject.position.clone().add(new THREE.Vector3(0, 1.0, -25));
    }
    
    if (isLanding) {
        player.state = 'landing_sequence';
        playerObject.position.copy(spacecraftPosition).setY(250); // Player is "in" the ship high up
        document.getElementById('doom-hud').style.display = 'none';
        document.getElementById('crosshair').style.display = 'none';
        cockpitOverlayElement.style.display = 'block';
        cockpitJoystick.visible = true;
        cockpitHexHUD.visible = true;
        gunModels.forEach(g => g.visible = false);
    } else {
        document.getElementById('doom-hud').style.display = 'grid'; 
        document.getElementById('crosshair').style.display = 'block';
        cockpitOverlayElement.style.display = 'none';
        cockpitJoystick.visible = false;
        cockpitHexHUD.visible = false;
        setActiveWeapon(0); // Only set active weapon on a normal start
    }

    // Reset health and score on every level, unless specified otherwise
    if (isInitialLoad) {
        health = 500;
        score = 0;
    }
    lastHealth = health;
    
    // Update HUD for persistent items that don't depend on visibility state
    document.getElementById('jetpack-hud-container').style.display = player.hasJetpack ? 'flex' : 'none';
    for (let i = 0; i < GameData.weapons.length; i++) {
        const sprite = document.getElementById(`weapon-sprite-${i}`);
        if(sprite) {
            sprite.style.display = player.unlockedWeapons[i] ? 'block' : 'none';
            sprite.classList.remove('weapon-active');
        }
    }
    
    spawnAliens(15, true);
    spawnInitialCollectibles();
    if (spacecraftPosition) spawnSpacecraft(spacecraftPosition, isLanding);
    if (levelData.motorcyclePosition) spawnMotorcycle(levelData.motorcyclePosition);

    if (levelName === 'toxic') { toxicStorm = { active: false, timer: 30 + Math.random() * 30 }; } else { toxicStorm.active = false; }
    if (levelName === 'volcanic') { lightningTimer = 3 + Math.random() * 4; }
    
    setTimeout(() => {
        spawnDelayedEnemies(5);
    }, 3000);
    createMapBackground();
    
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    if (!isInitialLoad && !isLanding) {
        const blocker = document.getElementById('blocker');
        blocker.innerHTML = `<div id="instructions" class="menu-box">${initialInstructionsHTML}</div>`;
        blocker.style.flexDirection = '';
        if (!isTouchDevice && !document.pointerLockElement && !document.getElementById('debug-menu').style.display.includes('flex')) {
            document.body.requestPointerLock();
        }
    }
}


function restartGame() {
    loadLevel(currentLevel, true);
}

function gameOver(message = "COMPLIANCE FAILED") {
    isGameOver = true;
    controls.isLocked = false;
    if (document.pointerLockElement) document.exitPointerLock();
    const blocker = document.getElementById('blocker');
    blocker.innerHTML = `<div class="menu-box"><h1>${message}</h1><p>Final Score: ${score}</p><p style="font-size: 24px; margin-top: 20px;">Click or Press SPACE to Restart</p><div class="options-buttons" style="margin-top:20px;"><button id="options-button-gameover">Options</button></div></div>`;
    blocker.style.display = 'flex';
    blocker.style.flexDirection = 'column';
}

function winGame() {
    gameOver("OBJECTIVE COMPLETE. MANKIND IS SAVED.");
}

function loadSounds() {
    const audioLoader = new THREE.AudioLoader();
    const soundsToLoad = [ 'background_music', 'player_damage', 'alien_death', 'cyborg_death', 'cyborg_shoot', 'gun_pistol', 'gun_shotgun', 'gun_machinegun', 'gun_rocket', 'gun_plasma', 'gun_grenade', 'gun_axe', 'gun_sniper', 'gun_blackhole', 'blackhole_open', 'blackhole_close' ];
    soundsToLoad.forEach(name => {
        audioLoader.load(`${name}.wav`, 
            (buffer) => {
                if (name === 'background_music') {
                    backgroundMusic = new THREE.Audio(audioListener);
                    backgroundMusic.setBuffer(buffer);
                    backgroundMusic.setLoop(true);
                    backgroundMusic.setVolume(gameSettings.musicVolume);
                } else {
                    gameSounds[name] = buffer;
                }
            },
            () => {},
            () => console.warn(`Could not load sound: ${name}.wav`)
        );
    });
}

function playSound(name) {
    if (!gameSounds[name] || !audioListener) return;
    const sound = new THREE.Audio(audioListener);
    sound.setBuffer(gameSounds[name]);
    sound.setVolume(gameSettings.sfxVolume);
    sound.play();
}

function animate() {
    requestAnimationFrame(animate);
    
    if (health <= 0 && !isGameOver) gameOver();
    if (isGameOver) return;
    
    const delta = clock.getDelta();
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

    // --- Simulation Updates ---
    // This block is skipped when the game is paused on desktop.
    if (!isPaused || isTouchDevice) {
        switch(player.state) {
            case 'on_foot':
                if (mouse.isDown && ['Machine Gun', 'Plasma Gun'].includes(GameData.weapons[player.currentWeaponIndex].name)) shoot();
                if (health < lastHealth) { damageFlashElement.style.opacity = 0.5; setTimeout(() => { damageFlashElement.style.opacity = 0; }, 120); }
                lastHealth = health;
                updatePlayer(delta);
                updateInteractions();
                break;
            case 'driving_motorcycle':
                if (mouse.isDown) shoot();
                updatePlayerVehicle(delta);
                break;
            case 'entering_spacecraft':
                updateCockpitSequence(delta);
                break;
            case 'hyperspace':
                updateHyperspace(delta);
                break;
            case 'landing_sequence':
                updateLandingSequence(delta);
                break;
        }
        
        if (player.state === 'on_foot' || player.state === 'driving_motorcycle') {
            updateHUD();
            updateCollectibles(delta);
        }

        if (currentLevel === 'toxic') updateToxicStorm(delta);
        if (currentLevel === 'volcanic') updateLightning(delta);

        updateBullets(delta);
        updateRockets(delta);
        updatePlasmaRings(delta);
        updateGrenades(delta);
        updateClusters(delta);
        updateBlackHoles(delta);
        updateAliens(delta);
        updateAlienProjectiles(delta);
        updateCyborgProjectiles(delta);
        updateShardProjectiles(delta);
        updateBombs(delta);
        updateDebris(delta);
        updateShellCasings(delta);
        updateHitScatters(delta);
        
        if(keys['Tab']) updateMap();
    }

    // --- Visual-only Updates ---
    // These run even when paused for smooth animations (e.g. gun bobbing).
    updateGun(delta);
    
    // --- Rendering ---
    // The renderer always runs to prevent a black screen.
    renderer.render(scene, camera);
}

function toggleXRayEffect(isActive) {
    if (isActive) {
        if (originalMaterials.size > 0) return; // Already on

        // Store original materials and apply new ones
        scene.traverse(obj => {
            if (obj.isMesh) {
                 // Skip guns attached to camera
                let isPlayerGun = false;
                for(const gun of gunModels) {
                    if(gun === obj || (gun.children && gun.getObjectById(obj.id))) {
                        isPlayerGun = true;
                        break;
                    }
                }
                if (isPlayerGun) return;

                let xrayMatToApply = null;

                // --- POSITIVE IDENTIFICATION (Priority) ---
                if (aliens.some(a => a === obj || a.getObjectById(obj.id))) {
                    xrayMatToApply = xrayMaterials.enemy;
                } else if (spacecraft && (spacecraft === obj || spacecraft.getObjectById(obj.id))) {
                    xrayMatToApply = xrayMaterials.spacecraft;
                } else if (collectibles.fuelCells.some(fc => fc === obj || (fc && fc.getObjectById(obj.id)))) {
                    xrayMatToApply = xrayMaterials.fuelCell;
                }
                // --- NEGATIVE IDENTIFICATION (If not a priority target) ---
                else {
                     const isDynamic = bullets.includes(obj) ||
                                    rockets.includes(obj) ||
                                    plasmaRings.includes(obj) ||
                                    grenades.includes(obj) ||
                                    clusters.includes(obj) ||
                                    blackHoles.includes(obj) ||
                                    alienProjectiles.includes(obj) ||
                                    cyborgProjectiles.includes(obj) ||
                                    shardProjectiles.includes(obj) ||
                                    bombs.includes(obj) ||
                                    shellCasings.includes(obj) ||
                                    hitScatters.some(s=>s.mesh===obj) ||
                                    alienDebris.some(d=>d.mesh===obj) ||
                                    Object.values(collectibles).flat().some(c => c === obj || (c && c.getObjectById && c.getObjectById(obj.id)));


                    // If it's not a known dynamic object, it's environment
                    if (!isDynamic) {
                        xrayMatToApply = xrayMaterials.wall;
                    }
                }

                if (xrayMatToApply) {
                    originalMaterials.set(obj, obj.material);
                    obj.material = xrayMatToApply;
                }
            }
        });

        scene.background = new THREE.Color(0x000000);
        scene.fog = null;

    } else { // Deactivating
        if (originalMaterials.size === 0) return; // Already off

        originalMaterials.forEach((originalMat, obj) => {
            if (obj) obj.material = originalMat;
        });
        originalMaterials.clear();

        const levelData = GameWorld.levels[currentLevel];
        scene.background = new THREE.Color(levelData.fogColor);
        if (levelData.fogDensity) {
            scene.fog = new THREE.FogExp2(levelData.fogColor, levelData.fogDensity);
        } else {
             const fogDistance = { city: 70, desert: 100, volcanic: 80, ice: 120, toxic: 80, crystal: 90 }[currentLevel] || 100;
             scene.fog = new THREE.Fog(levelData.fogColor, 0, fogDistance);
        }
    }
}


function updateToxicStorm(delta) {
    toxicStorm.timer -= delta;
    if (toxicStorm.timer <= 0) {
        toxicStorm.active = !toxicStorm.active;
        toxicStorm.timer = toxicStorm.active ? (20 + Math.random() * 10) : (40 + Math.random() * 20);
        
        if (toxicStorm.active) {
            scene.fog = new THREE.FogExp2(0x226622, 0.03);
            const rainGeo = new THREE.BufferGeometry();
            const vertices = [];
            for (let i = 0; i < 5000; i++) {
                vertices.push(Math.random() * 200 - 100, Math.random() * 100, Math.random() * 200 - 100);
            }
            rainGeo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
            const rainMat = new THREE.PointsMaterial({color: 0x66ff66, size: 0.2, transparent: true, opacity: 0.6});
            toxicRainParticles = new THREE.Points(rainGeo, rainMat);
            toxicRainParticles.position.copy(playerObject.position);
            scene.add(toxicRainParticles);
        } else {
            scene.fog = new THREE.FogExp2(GameWorld.levels.toxic.fogColor, GameWorld.levels.toxic.fogDensity);
            if (toxicRainParticles) scene.remove(toxicRainParticles);
            toxicRainParticles = null;
        }
    }

    if (toxicStorm.active) {
        // MODIFIED: Check for shelter plants in addition to bunkers
        if (!player.isSafeInBunker && !player.isSafeInShelter) {
            health = Math.max(0, health - 10 * delta);
        }
        if (toxicRainParticles) {
            const positions = toxicRainParticles.geometry.attributes.position.array;
            for(let i=0; i < positions.length; i += 3) {
                positions[i+1] -= 50 * delta;
                if(positions[i+1] < 0) positions[i+1] = 100;
            }
            toxicRainParticles.geometry.attributes.position.needsUpdate = true;
            toxicRainParticles.position.x = playerObject.position.x;
            toxicRainParticles.position.z = playerObject.position.z;
        }
    }
}

function updateLightning(delta) {
    lightningTimer -= delta;
    if (lightningTimer <= 0) {
        lightningTimer = 2 + Math.random() * 5;
        const strikePos = new THREE.Vector3().copy(playerObject.position);
        strikePos.x += (Math.random() - 0.5) * 60;
        strikePos.z += (Math.random() - 0.5) * 60;
        
        const lightningBolt = new THREE.Mesh(
            new THREE.CylinderGeometry(0.5, 0.2, 200, 8),
            new THREE.MeshBasicMaterial({ color: 0x88ffff, transparent: true, opacity: 0.9 })
        );
        lightningBolt.position.set(strikePos.x, 100, strikePos.z);
        scene.add(lightningBolt);
        
        const pointLight = new THREE.PointLight(0x88ffff, 5, 100);
        pointLight.position.copy(strikePos);
        scene.add(pointLight);

        if (playerObject.position.distanceTo(strikePos) < 5) {
            health = Math.max(0, health - 25);
            playSound('player_damage');
        }

        setTimeout(() => {
            scene.remove(lightningBolt);
            scene.remove(pointLight);
        }, 150);
    }
}