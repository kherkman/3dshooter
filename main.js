/**
 * main.js
 * The core game engine. Initializes the game, manages the main loop,
 * handles level loading, and global state management.
 */

// --- GLOBAL SETUP ---
let scene, camera, renderer, controls, audioListener, stereoCamera;
let playerObject, damageFlashElement, mapCanvas, mapCtx, mapBackgroundCanvas, attackIndicatorContainer, fuzzyVisionOverlay;
let levelObjects = {}; // To hold ground, lights etc. for easy removal
const clock = new THREE.Clock();

// --- INTRO STATE ---
let introStep = 0; // 0: Title only, 1: Story & Controls revealed, 2: Game running
let isIntroActive = true;

// --- AUDIO ---
const gameSounds = {};
let backgroundMusic = new Audio(); // HTML5 Audio globally declared to unlock on mobile interaction
let currentlyLoadingTrack = null;
let hasInteracted = false;
const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

// SFX Volume default increased to 0.45, Music Volume increased to 0.4
const gameSettings = { 
    sfxVolume: 0.45, 
    musicVolume: 0.4, 
    touchControlsEnabled: isTouchDevice, 
    sbs3dEnabled: false, 
    retroEffectEnabled: false, 
    sbsEyeSep: 0.064, 
    gyroLookEnabled: false,
    texturesEnabled: true
};

// --- JETPACK & SPACECRAFT SOUNDS STATE ---
let jetpackSound = null;
let jetpackSoundActive = false;
let lastPlayerState = 'on_foot';

// --- GAME OBJECTS & COLLECTIONS ---
const player = {}; 
const bullets = [], rockets = [], plasmaRings = [], grenades = [], clusters = [], aliens = [], alienDebris = [], hitScatters = [], alienProjectiles = [], cyborgProjectiles = [], buildingColliders = [], shellCasings = [], blackHoles = [], shardProjectiles = [];
const glassShards = []; // Array for active glass shards
const cityWindows = []; // Cache for city level window meshes to optimize collision checking
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
let score = 0, health = 500, isGameOver = false, isGameWon = false, lastHealth = 500, isPaused = true;
let lastAttackerPosition = null;
let attackIndicatorTimeout = null;
let hyperspaceData = { time: 0, duration: 5.0, fadeTime: 1.5 };
const keys = {}, mouse = { isDown: false, x: 0, y: 0 };
let fKeyPressed = false;
const GRAVITY = 35.0;
let currentLevel = 'city';
let interactionPromptElement, inventoryMenu, cockpitOverlayElement;
let toxicStorm = { active: false, timer: 60 };
let lightningTimer = 5;

// --- TEXTURES ---
let cityWallTexture, cityWindowTexture, cityFloorTexture, cityWindowBrokenTexture;
let desertRockTexture, toxicFloorTexture, toxicStemTexture, toxicLeafTexture;
let iceRockTexture, iceFloorTexture, castleTexture, crystalRockTexture, crystalFloorTexture;
let pyramidTexture, volcanicFloorTexture, volcanicRockTexture, desertFloorTexture;
let spacecraftTexture, hoverbikeTexture;
let gunWoodTexture, gunMetalTexture;
let shardRollerTexture, shardMiteTexture, stalkerMouthTexture, domeGuardianTexture;
let enemyBlackTexture;
let cyborgGrayTexture;
let crystalWallTexture, crystalBlockTexture;

// New Collectible Item Textures
let fuelCellTexture, jetpackTexture, gogglesTexture, healthTexture, glowingOrbTexture;

// --- DEBUG MENU ---
let debugMenu, previewRenderer, previewScene, previewCamera, previewObject, previewClock, previewAnimationId;
let isDebugMenuInitialized = false;
let previewAnimationState = null;


// --- INITIALIZATION ---
init();
animate();

function init() {
    // Inject custom CSS to ensure perfect title centering
    const centeringStyle = document.createElement('style');
    centeringStyle.textContent = `
        .menu-header { position: relative !important; display: flex !important; justify-content: center !important; align-items: center !important; width: 100% !important; margin-bottom: 20px !important; }
        .horror-title { text-align: center !important; margin: 0 auto !important; width: 100% !important; display: block !important; }
        .menu-header .header-close-button { position: absolute !important; right: 10px !important; top: 50% !important; transform: translateY(-50%) !important; margin: 0 !important; }
    `;
    document.head.appendChild(centeringStyle);

    initialInstructionsHTML = document.getElementById('instructions').innerHTML;

    scene = new THREE.Scene();
    Object.assign(player, GameWorld.player.initialState);
    player.velocity = new THREE.Vector3();

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, GameWorld.player.height, 0);
    stereoCamera = new THREE.StereoCamera();
    audioListener = new THREE.AudioListener();
    camera.add(audioListener);
    
    // Web Audio FX Chain: LPF, HPF, Limiter
    const ctx = audioListener.context;
    const lpf = ctx.createBiquadFilter();
    lpf.type = 'lowpass';
    lpf.frequency.setValueAtTime(20000, ctx.currentTime);

    const hpf = ctx.createBiquadFilter();
    hpf.type = 'highpass';
    hpf.frequency.setValueAtTime(20, ctx.currentTime);

    const limiter = ctx.createDynamicsCompressor();
    limiter.threshold.setValueAtTime(-1.0, ctx.currentTime);
    limiter.knee.setValueAtTime(0, ctx.currentTime);
    limiter.ratio.setValueAtTime(20, ctx.currentTime);
    limiter.attack.setValueAtTime(0.003, ctx.currentTime);
    limiter.release.setValueAtTime(0.1, ctx.currentTime);

    // Route audioListener gain through the chain
    audioListener.gain.disconnect();
    audioListener.gain.connect(lpf);
    lpf.connect(hpf);
    hpf.connect(limiter);
    limiter.connect(ctx.destination);

    audioListener.lpf = lpf;
    audioListener.hpf = hpf;
    audioListener.limiter = limiter;

    // Monkey-patch THREE.Audio.stop to prevent crashes if source is null
    if (THREE && THREE.Audio) {
        const originalAudioStop = THREE.Audio.prototype.stop;
        THREE.Audio.prototype.stop = function() {
            if (!this.source) {
                this.isPlaying = false;
                return this;
            }
            try {
                return originalAudioStop.apply(this, arguments);
            } catch (e) {
                console.warn("Bypassed error during THREE.Audio.stop:", e);
                this.isPlaying = false;
                return this;
            }
        };
    }

    loadSounds();
    
    // Initialize Texture Loader and Load City, Desert, and Toxic Textures
    const textureLoader = new THREE.TextureLoader();
    cityWallTexture = textureLoader.load('wall.jpg');
    cityWindowTexture = textureLoader.load('window.jpg');
    cityWindowBrokenTexture = textureLoader.load('windowbroken.jpg'); // Loaded broken window texture
    cityFloorTexture = textureLoader.load('cityfloor.jpg');
    desertRockTexture = textureLoader.load('desertrock.jpg');
    toxicFloorTexture = textureLoader.load('toxicfloor.jpg');
    toxicStemTexture = textureLoader.load('toxicstem.jpg');
    toxicLeafTexture = textureLoader.load('toxicleaf.jpg');

    // Load New Textures
    iceRockTexture = textureLoader.load('icerock.jpg');
    iceFloorTexture = textureLoader.load('icefloor.jpg');
    castleTexture = textureLoader.load('castle.jpg');
    crystalRockTexture = textureLoader.load('crystalrock.jpg');
    crystalFloorTexture = textureLoader.load('crystalfloor.jpg');
    pyramidTexture = textureLoader.load('pyramid.jpg');
    volcanicFloorTexture = textureLoader.load('volcanicfloor.jpg');
    volcanicRockTexture = textureLoader.load('volcanicrock.jpg');
    desertFloorTexture = textureLoader.load('desertfloor.jpg');
    spacecraftTexture = textureLoader.load('spacecraft.jpg');
    hoverbikeTexture = textureLoader.load('hoverbike.jpg');

    // Load Weapon and Enemy Textures with reload fallback for weapons
    let weaponsRegenTimeout = null;
    const onWeaponTextureLoad = () => {
        if (weaponsRegenTimeout) clearTimeout(weaponsRegenTimeout);
        weaponsRegenTimeout = setTimeout(() => {
            if (typeof generateWeaponSprites === 'function') {
                generateWeaponSprites();
            }
            // Rebuild active player gun models once textures are ready
            rebuildPlayerGunModels();
        }, 100);
    };

    gunWoodTexture = textureLoader.load('gunwood.jpg', onWeaponTextureLoad);
    gunMetalTexture = textureLoader.load('gunmetal.jpg', onWeaponTextureLoad);
    shardRollerTexture = textureLoader.load('shardroller.jpg');
    shardMiteTexture = textureLoader.load('shardmite.jpg');
    stalkerMouthTexture = textureLoader.load('stalker.jpg');
    domeGuardianTexture = textureLoader.load('domeguardian.jpg');
    enemyBlackTexture = textureLoader.load('enemyblack.jpg');
    cyborgGrayTexture = textureLoader.load('cyborggray.jpg');
    crystalWallTexture = textureLoader.load('crystalwall.jpg');
    crystalBlockTexture = textureLoader.load('crystalblock.jpg');
    
    // Load Collectible Item Textures
    fuelCellTexture = textureLoader.load('fuelcell.jpg');
    jetpackTexture = textureLoader.load('jetpack.jpg');
    gogglesTexture = textureLoader.load('goggles.jpg');
    healthTexture = textureLoader.load('health.jpg');
    glowingOrbTexture = textureLoader.load('glowingorb.jpg');

    cityWallTexture.wrapS = THREE.RepeatWrapping;
    cityWallTexture.wrapT = THREE.RepeatWrapping;
    cityFloorTexture.wrapS = THREE.RepeatWrapping;
    cityFloorTexture.wrapT = THREE.RepeatWrapping;
    desertRockTexture.wrapS = THREE.RepeatWrapping;
    desertRockTexture.wrapT = THREE.RepeatWrapping;
    toxicFloorTexture.wrapS = THREE.RepeatWrapping;
    toxicFloorTexture.wrapT = THREE.RepeatWrapping;
    toxicStemTexture.wrapS = THREE.RepeatWrapping;
    toxicStemTexture.wrapT = THREE.RepeatWrapping;
    toxicLeafTexture.wrapS = THREE.RepeatWrapping;
    toxicLeafTexture.wrapT = THREE.RepeatWrapping;

    // Set wrapping for New Textures
    iceRockTexture.wrapS = THREE.RepeatWrapping;
    iceRockTexture.wrapT = THREE.RepeatWrapping;
    iceFloorTexture.wrapS = THREE.RepeatWrapping;
    iceFloorTexture.wrapT = THREE.RepeatWrapping;
    castleTexture.wrapS = THREE.RepeatWrapping;
    castleTexture.wrapT = THREE.RepeatWrapping;
    crystalRockTexture.wrapS = THREE.RepeatWrapping;
    crystalRockTexture.wrapT = THREE.RepeatWrapping;
    crystalFloorTexture.wrapS = THREE.RepeatWrapping;
    crystalFloorTexture.wrapT = THREE.RepeatWrapping;
    pyramidTexture.wrapS = THREE.RepeatWrapping;
    pyramidTexture.wrapT = THREE.RepeatWrapping;
    volcanicFloorTexture.wrapS = THREE.RepeatWrapping;
    volcanicFloorTexture.wrapT = THREE.RepeatWrapping;
    volcanicRockTexture.wrapS = THREE.RepeatWrapping;
    volcanicRockTexture.wrapT = THREE.RepeatWrapping;
    desertFloorTexture.wrapS = THREE.RepeatWrapping;
    desertFloorTexture.wrapT = THREE.RepeatWrapping;
    spacecraftTexture.wrapS = THREE.RepeatWrapping;
    spacecraftTexture.wrapT = THREE.RepeatWrapping;
    hoverbikeTexture.wrapS = THREE.RepeatWrapping;
    hoverbikeTexture.wrapT = THREE.RepeatWrapping;

    // Set wrapping for Weapon and Enemy Textures
    gunWoodTexture.wrapS = THREE.RepeatWrapping;
    gunWoodTexture.wrapT = THREE.RepeatWrapping;
    gunMetalTexture.wrapS = THREE.RepeatWrapping;
    gunMetalTexture.wrapT = THREE.RepeatWrapping;
    shardRollerTexture.wrapS = THREE.RepeatWrapping;
    shardRollerTexture.wrapT = THREE.RepeatWrapping;
    shardMiteTexture.wrapS = THREE.RepeatWrapping;
    shardMiteTexture.wrapT = THREE.RepeatWrapping;
    stalkerMouthTexture.wrapS = THREE.RepeatWrapping;
    stalkerMouthTexture.wrapT = THREE.RepeatWrapping;
    domeGuardianTexture.wrapS = THREE.RepeatWrapping;
    domeGuardianTexture.wrapT = THREE.RepeatWrapping;
    enemyBlackTexture.wrapS = THREE.RepeatWrapping;
    enemyBlackTexture.wrapT = THREE.RepeatWrapping;
    cyborgGrayTexture.wrapS = THREE.RepeatWrapping;
    cyborgGrayTexture.wrapT = THREE.RepeatWrapping;
    crystalWallTexture.wrapS = THREE.RepeatWrapping;
    crystalWallTexture.wrapT = THREE.RepeatWrapping;
    crystalBlockTexture.wrapS = THREE.RepeatWrapping;
    crystalBlockTexture.wrapT = THREE.RepeatWrapping;

    // Set wrapping for Collectible Item Textures
    fuelCellTexture.wrapS = THREE.RepeatWrapping;
    fuelCellTexture.wrapT = THREE.RepeatWrapping;
    jetpackTexture.wrapS = THREE.RepeatWrapping;
    jetpackTexture.wrapT = THREE.RepeatWrapping;
    gogglesTexture.wrapS = THREE.RepeatWrapping;
    gogglesTexture.wrapT = THREE.RepeatWrapping;
    healthTexture.wrapS = THREE.RepeatWrapping;
    healthTexture.wrapT = THREE.RepeatWrapping;
    glowingOrbTexture.wrapS = THREE.RepeatWrapping;
    glowingOrbTexture.wrapT = THREE.RepeatWrapping;

    // Expose textures globally so game-world.js and game-data.js can access them
    window.cityWallTexture = cityWallTexture;
    window.cityWindowTexture = cityWindowTexture;
    window.cityWindowBrokenTexture = cityWindowBrokenTexture;
    window.cityFloorTexture = cityFloorTexture;
    window.desertRockTexture = desertRockTexture;
    window.toxicFloorTexture = toxicFloorTexture;
    window.toxicStemTexture = toxicStemTexture;
    window.toxicLeafTexture = toxicLeafTexture;

    // Expose New Textures globally
    window.iceRockTexture = iceRockTexture;
    window.iceFloorTexture = iceFloorTexture;
    window.castleTexture = castleTexture;
    window.crystalRockTexture = crystalRockTexture;
    window.crystalFloorTexture = crystalFloorTexture;
    window.pyramidTexture = pyramidTexture;
    window.volcanicFloorTexture = volcanicFloorTexture;
    window.volcanicRockTexture = volcanicRockTexture;
    window.desertFloorTexture = desertFloorTexture;
    window.spacecraftTexture = spacecraftTexture;
    window.hoverbikeTexture = hoverbikeTexture;

    // Expose Weapon and Enemy Textures globally
    window.gunWoodTexture = gunWoodTexture;
    window.gunMetalTexture = gunMetalTexture;
    window.shardRollerTexture = shardRollerTexture;
    window.shardMiteTexture = shardMiteTexture;
    window.stalkerMouthTexture = stalkerMouthTexture;
    window.domeGuardianTexture = domeGuardianTexture;
    window.enemyBlackTexture = enemyBlackTexture;
    window.cyborgGrayTexture = cyborgGrayTexture;
    window.crystalWallTexture = crystalWallTexture;
    window.crystalBlockTexture = crystalBlockTexture;

    // Expose Collectible Item Textures globally
    window.fuelCellTexture = fuelCellTexture;
    window.jetpackTexture = jetpackTexture;
    window.gogglesTexture = gogglesTexture;
    window.healthTexture = healthTexture;
    window.glowingOrbTexture = glowingOrbTexture;

    playerObject = new THREE.Object3D();
    playerObject.position.set(0, 0, 10);
    playerObject.add(camera);
    scene.add(playerObject);

    attackIndicatorContainer = document.getElementById('attack-indicator-container');
    damageFlashElement = document.getElementById('damage-flash');
    fuzzyVisionOverlay = document.getElementById('fuzzy-vision-overlay');
    mapCanvas = document.getElementById('map-canvas');
    mapCtx = mapCanvas.getContext('2d');
    interactionPromptElement = document.getElementById('interaction-prompt');
    inventoryMenu = document.getElementById('inventory-menu');
    cockpitOverlayElement = document.getElementById('cockpit-overlay');
    wormAttackOverlay = document.getElementById('worm-attack-overlay');
    
    // Initialize debugMenu right away so it is never undefined
    debugMenu = document.getElementById('debug-menu');

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

    // Override the global showPickupNotification to play pickup sounds dynamically
    if (typeof showPickupNotification !== 'undefined') {
        const originalShowPickupNotification = showPickupNotification;
        showPickupNotification = function(itemName) {
            originalShowPickupNotification(itemName);
            if (itemName === 'Health Pack') {
                playSound('pickup_health');
            } else if (itemName === 'Fuel Cell') {
                playSound('pickup_fuel_cell');
            } else if (itemName.includes('Ammo') || itemName === 'Singularity Canister') {
                playSound('pickup_ammo');
            } else {
                // Jetpack, X-Ray Goggles, Weapons, Glowing Orb, etc.
                playSound('pickup_item');
            }
        };
    }

    // Wrap createLightningBolt to play spatialized lightning blast sounds
    if (typeof createLightningBolt !== 'undefined') {
        const originalCreateLightningBolt = createLightningBolt;
        createLightningBolt = function(startPos, endPos, damage) {
            originalCreateLightningBolt(startPos, endPos, damage);
            playSound('lightning_shoot', startPos);
        };
    }

    // Wrap createExplosion to dynamically play specific explosion sounds
    if (typeof createExplosion !== 'undefined') {
        const originalCreateExplosion = createExplosion;
        createExplosion = function(position, radius) {
            originalCreateExplosion(position, radius);
            if (radius === 8 || radius === 10) {
                playSound('rocket_explosion', position);
            } else if (radius === 6 || radius === 3.5) {
                playSound('grenade_explosion', position);
            }
        };
    }

    // Wrap pickUpObject to play specific glowing orb pickup sound
    if (typeof pickUpObject !== 'undefined') {
        const originalPickUpObject = pickUpObject;
        pickUpObject = function(object) {
            originalPickUpObject(object);
            if (object && object.userData && object.userData.key === 'glowing_orb') {
                playSound('pickup_glowingorb');
            }
        };
    }

    // Wrap throwCarriedObject to play specific glowing orb throw sound
    if (typeof throwCarriedObject !== 'undefined') {
        const originalThrowCarriedObject = throwCarriedObject;
        throwCarriedObject = function() {
            const isCarryingOrb = player.carriedObject && player.carriedObject.userData && player.carriedObject.userData.key === 'glowing_orb';
            originalThrowCarriedObject();
            if (isCarryingOrb) {
                playSound('throw_glowingorb');
            }
        };
    }

    // Wrap createHitScatter to play tentacle rising sound
    if (typeof createHitScatter !== 'undefined') {
        const originalCreateHitScatter = createHitScatter;
        createHitScatter = function(position, color) {
            originalCreateHitScatter(position, color);
            if (color === 0xffffff) {
                playSound('tentacles_rise', position);
            }
        };
    }

    // Dynamic Options Close X Injection
    const optionsContent = document.getElementById('options-content');
    if (optionsContent) {
        const h1 = optionsContent.querySelector('h1');
        if (h1) {
            h1.className = 'menu-header';
            const span = document.createElement('span');
            span.textContent = h1.textContent;
            h1.textContent = '';
            h1.appendChild(span);
            
            const closeBtn = document.createElement('button');
            closeBtn.id = 'close-options-x';
            closeBtn.className = 'header-close-button';
            closeBtn.innerHTML = '&times;';
            closeBtn.addEventListener('click', () => toggleOptionsMenu(false));
            closeBtn.addEventListener('touchend', (e) => {
                e.preventDefault();
                toggleOptionsMenu(false);
            });
            h1.appendChild(closeBtn);
        }
    }

    // Stepped Intro interaction handler
    const blockerEl = document.getElementById('blocker');
    if (blockerEl) {
        const handleBlockerClick = (event) => {
            if (isGameOver) {
                restartGame();
                return;
            }
            // Allow menu buttons to be clicked inside the blocker without advancing or closing the intro
            if (event.target.closest('button')) {
                return;
            }
            event.preventDefault();
            event.stopPropagation();
            advanceIntro();
        };
        blockerEl.addEventListener('click', handleBlockerClick, true);
        blockerEl.addEventListener('touchend', handleBlockerClick, true);
    }

    // Preempt standard key events during intro using capture phase
    document.addEventListener('keydown', (event) => {
        if (isIntroActive) {
            // Keep options toggleable
            if (event.code === 'KeyO' || event.key === 'Escape') {
                return;
            }
            event.preventDefault();
            event.stopPropagation();
            advanceIntro();
        }
    }, true);

    // Dynamic Pause handler for Esc/Pointer Lock loss during gameplay
    document.addEventListener('pointerlockchange', () => {
        if (document.pointerLockElement !== document.body) {
            if (!isIntroActive) {
                isPaused = true;
            }
        } else {
            if (!isIntroActive) {
                isPaused = false;
            }
        }
    });

    // Wrap toggleOptionsMenu globally to ensure the game pauses and unpauses correctly during gameplay
    if (typeof toggleOptionsMenu !== 'undefined') {
        const originalToggleOptionsMenu = toggleOptionsMenu;
        toggleOptionsMenu = function(forceOpen = null) {
            const optionsMenu = document.getElementById('options-menu');
            const isCurrentlyOpen = optionsMenu && optionsMenu.style.display.includes('flex');
            const shouldBeOpen = forceOpen !== null ? forceOpen : !isCurrentlyOpen;

            // Prevent requesting pointer lock if intro is still active
            const originalRequestPointerLock = document.body.requestPointerLock;
            if (!shouldBeOpen && isIntroActive) {
                document.body.requestPointerLock = function() {
                    console.log("Pointer lock bypass: Intro screen active.");
                };
            }

            // Restore pointer lock capability
            if (!shouldBeOpen && isIntroActive) {
                document.body.requestPointerLock = originalRequestPointerLock;
            }

            originalToggleOptionsMenu(forceOpen);

            if (isIntroActive) {
                isPaused = true;
            } else {
                isPaused = shouldBeOpen;
            }
        };
    }

    // WebAudio Autoplay bypass & Mobile HTML5 Audio unlocking
    const startIntroMusicOnInteraction = () => {
        if (!hasInteracted) {
            hasInteracted = true;
            if (audioListener && audioListener.context && audioListener.context.state === 'suspended') {
                audioListener.context.resume();
            }
            
            const blocker = document.getElementById('blocker');
            const isIntroActiveScreen = blocker && blocker.style.display !== 'none';
            
            if (backgroundMusic && isIntroActiveScreen) {
                backgroundMusic.play().catch(e => console.warn("Background music failed on first click:", e));
            }
        }
    };
    window.addEventListener('click', startIntroMusicOnInteraction, { once: true });
    window.addEventListener('touchstart', startIntroMusicOnInteraction, { once: true });

    // Dynamic Orientation Warning for Mobile Devices
    if (isTouchDevice) {
        const warningDiv = document.createElement('div');
        warningDiv.id = 'portrait-warning';
        warningDiv.style.position = 'fixed';
        warningDiv.style.top = '0';
        warningDiv.style.left = '0';
        warningDiv.style.width = '100vw';
        warningDiv.style.height = '100vh';
        warningDiv.style.backgroundColor = '#1e140a';
        warningDiv.style.color = '#ffaa00';
        warningDiv.style.display = 'none';
        warningDiv.style.flexDirection = 'column';
        warningDiv.style.justifyContent = 'center';
        warningDiv.style.alignItems = 'center';
        warningDiv.style.zIndex = '9999';
        warningDiv.style.textAlign = 'center';
        warningDiv.style.padding = '20px';
        warningDiv.style.boxSizing = 'border-box';
        warningDiv.style.fontFamily = "'Courier New', Courier, monospace";
        warningDiv.innerHTML = `
            <h1 style="font-size: 24px; margin-bottom: 10px; text-shadow: 1px 1px 3px #000;">Please Rotate Your Device</h1>
            <p style="font-size: 16px; text-shadow: 1px 1px 3px #000;">This game requires landscape orientation to display the HUD and controls properly.</p>
        `;
        document.body.appendChild(warningDiv);

        window.addEventListener('orientationchange', () => {
            setTimeout(onWindowResize, 200);
        });

        document.addEventListener('fullscreenchange', () => {
            if (document.fullscreenElement && screen.orientation && screen.orientation.lock) {
                screen.orientation.lock('landscape').catch(err => {
                    console.warn('Screen orientation lock rejected:', err);
                });
            }
        });
    }

    // Intro Background Media Handling (intro.png / intro.mp4)
    const instructions = document.getElementById('instructions');
    if (instructions) {
        // Set parent background to transparent so our custom background is visible
        instructions.style.setProperty('background', 'transparent', 'important');

        const introBgContainer = document.createElement('div');
        introBgContainer.id = 'intro-media-bg-container';
        // Use the original gradient as the default background of our media container
        introBgContainer.style.cssText = 'position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: -1; overflow: hidden; pointer-events: none; background: radial-gradient(circle, #2a0800 0%, #050100 100%);';
        
        // Insert as the first child to ensure it's rendered underneath other elements
        instructions.insertBefore(introBgContainer, instructions.firstChild);
        
        let hasVideo = false;
        let hasImage = false;
        
        const img = document.createElement('img');
        img.src = 'intro.png';
        img.style.cssText = 'position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover; opacity: 0; transition: opacity 1s ease-in-out;';
        
        const video = document.createElement('video');
        video.src = 'intro.mp4';
        video.muted = true;
        video.playsInline = true;
        video.style.cssText = 'position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover; opacity: 0; transition: opacity 1s ease-in-out;';
        
        img.onload = () => {
            hasImage = true;
            introBgContainer.appendChild(img);
            if (!hasVideo) {
                img.style.opacity = '1';
            }
        };
        img.onerror = () => {
            hasImage = false;
        };
        
        video.oncanplaythrough = () => {
            if (hasVideo) return;
            hasVideo = true;
            introBgContainer.appendChild(video);
            video.style.opacity = '1';
            video.play().catch(e => console.warn("Intro video playback failed:", e));
            
            video.onended = () => {
                video.style.opacity = '0';
                if (hasImage) {
                    img.style.opacity = '1';
                }
                setTimeout(() => {
                    if (video.parentNode) {
                        introBgContainer.removeChild(video);
                    }
                }, 1000);
            };
        };
        video.onerror = () => {
            hasVideo = false;
            if (hasImage) {
                img.style.opacity = '1';
            }
        };
    }
}

function advanceIntro() {
    const instructions = document.getElementById('instructions');
    if (!instructions) return;

    const storyP = instructions.querySelector('p');
    const controlsList = instructions.querySelector('.controls-list-intro');
    const ctaP = Array.from(instructions.querySelectorAll('p')).find(p => p.textContent.includes('Comply') || p.textContent.includes('SPACE') || p.textContent.includes('Mission'));

    // Force context resume and music start
    if (!hasInteracted) {
        hasInteracted = true;
        if (audioListener && audioListener.context && audioListener.context.state === 'suspended') {
            audioListener.context.resume();
        }
        if (backgroundMusic) {
            backgroundMusic.play().catch(e => console.warn("Failed to trigger background music inside advanceIntro:", e));
        }
    }

    if (introStep === 0) {
        // Step 1: Reveal story and controls
        if (storyP) storyP.style.display = 'block';
        if (controlsList) controlsList.style.display = 'block';
        if (ctaP) {
            ctaP.textContent = 'Click or Press SPACE to Comply';
        }
        introStep = 1;
    } else if (introStep === 1) {
        // Step 2: Dismiss intro and start actual game
        introStep = 2;
        isIntroActive = false;
        isPaused = false;
        
        const blocker = document.getElementById('blocker');
        if (blocker) blocker.style.display = 'none';

        switchMusicToLevel(currentLevel);
        showLevelStartNotification(currentLevel);

        document.body.requestPointerLock();
    }
}

function onWindowResize() {
    const w = window.innerWidth;
    const h = window.innerHeight;

    // Check for mobile orientation warning display
    const warning = document.getElementById('portrait-warning');
    if (isTouchDevice && warning) {
        if (h > w) {
            warning.style.display = 'flex';
        } else {
            warning.style.display = 'none';
        }
    }

    if (gameSettings.sbs3dEnabled) {
        stereoCamera.aspect = (w / 2) / h;
    } else {
        camera.aspect = w / h;
    }
    camera.updateProjectionMatrix();
    stereoCamera.update(camera);
    
    renderer.setSize(w, h);
}


// --- CORE GAME STATE & LOOP ---

function clearScene() {
    toggleXRayEffect(false); 
    
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

    aliens.length = 0; bullets.length = 0; rockets.length = 0; plasmaRings.length = 0; grenades.length = 0; clusters.length = 0; alienDebris.length = 0; hitScatters.length = 0; alienProjectiles.length = 0; cyborgProjectiles.length = 0; buildingColliders.length = 0; shellCasings.length = 0; blackHoles.length = 0; shardProjectiles.length = 0;
    
    // Clear glass shards
    glassShards.forEach(s => {
        scene.remove(s.mesh);
        if (s.mesh.geometry) s.mesh.geometry.dispose();
        if (s.mesh.material) s.mesh.material.dispose();
    });
    glassShards.length = 0;
    cityWindows.length = 0;

    collectibles.health.length = 0; collectibles.ammo.length = 0; collectibles.weaponPickups.length = 0; collectibles.jetpack = null; collectibles.fuelCells.length = 0; collectibles.glowingOrbs.length = 0; collectibles.xrayGoggles = null;
    interactables.length = 0; spacecraft = null; motorcycle = null;
    buildingColliders.length = 0; vegetation.length = 0; bunkers.length = 0; bombs.length = 0;
    toxicRainParticles = null;
}

function loadLevel(levelName, isInitialLoad = false, isLanding = false) {
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
    
    Object.assign(player, GameWorld.player.initialState); 
    Object.assign(player, preservedState); 
    player.velocity = new THREE.Vector3();
    player.xrayGogglesActive = false; 
    
    if (starfield) starfield.visible = false;
    
    if (isPaused) { 
        document.getElementById('options-menu').style.display = 'none'; 
        if (!isInitialLoad) {
            isPaused = false; 
        }
    }
    if (isGameOver) isGameOver = false;

    clearScene();
    
    const levelData = GameWorld.levels[levelName].create(scene, buildingColliders, vegetation, bunkers);
    levelObjects = { ...levelData };

    // Display level start notification on normal gameplay transition
    if (!isInitialLoad) {
        showLevelStartNotification(levelName);
    }
    
    if (levelName === 'city') {
        playerObject.position.set(0, 0, 10);
    } else if (levelName === 'volcanic') {
        playerObject.position.set(0, 0, 55); 
    } else {
        playerObject.position.set(0, 0, 0);
    }
    playerObject.quaternion.identity();
    camera.rotation.set(0,0,0);
    
    let spacecraftPosition;
    if (levelData.landingPadPosition) {
        spacecraftPosition = levelData.landingPadPosition;
    } else if (levelName === 'volcanic') {
        spacecraftPosition = new THREE.Vector3(60, 1.0, 60); 
    } else {
        spacecraftPosition = playerObject.position.clone().add(new THREE.Vector3(0, 1.0, -25));
    }
    
    if (isLanding) {
        player.state = 'landing_sequence';
        playerObject.position.copy(spacecraftPosition).setY(250); 
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
        setActiveWeapon(0); 
    }

    if (isInitialLoad) {
        health = 500;
        score = 0;
        isGameWon = false;
        isIntroActive = true;
        introStep = 0;

        const blocker = document.getElementById('blocker');
        if (blocker) {
            blocker.style.display = 'flex';
            blocker.innerHTML = `<div id="instructions" class="menu-box">${initialInstructionsHTML}</div>`;
            
            // Hide the progress bar canvas on the first intro screen
            const introProgressionCanvas = document.getElementById('level-progression-intro');
            if (introProgressionCanvas) {
                introProgressionCanvas.style.display = 'none';
            }

            const instructions = document.getElementById('instructions');
            if (instructions) {
                const storyP = instructions.querySelector('p');
                const controlsList = instructions.querySelector('.controls-list-intro');
                const ctaP = Array.from(instructions.querySelectorAll('p')).find(p => p.textContent.includes('Comply') || p.textContent.includes('SPACE'));
                if (storyP) storyP.style.display = 'none';
                if (controlsList) controlsList.style.display = 'none';
                if (ctaP) {
                    ctaP.textContent = 'Click or Press SPACE to Reveal Mission';
                }
            }
        }
    }
    lastHealth = health;
    
    document.getElementById('jetpack-hud-container').style.display = player.hasJetpack ? 'flex' : 'none';
    for (let i = 0; i < GameData.weapons.length; i++) {
        const sprite = document.getElementById(`weapon-sprite-${i}`);
        if(sprite) {
            sprite.style.display = 'none'; 
            sprite.classList.remove('weapon-active');
        }
    }
    
    const alienCount = GameWorld.levels[levelName].initialAlienCount || 15;
    spawnAliens(alienCount, true);
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
        
        // Re-draw mission progress (planet view) as innerHTML has been completely reset
        if (typeof drawLevelProgression === 'function') {
            drawLevelProgression('level-progression-intro');
        }

        if (!isIntroActive) {
            if (!isTouchDevice && !document.pointerLockElement && (!debugMenu || !debugMenu.style.display.includes('flex'))) {
                document.body.requestPointerLock();
            }
        }
    }

    if (hasInteracted && !isIntroActive) {
        switchMusicToLevel(levelName);
    }

    // Dynamic city window identification and caching for quick retrieval
    cityWindows.length = 0;
    if (levelName === 'city') {
        scene.traverse(child => {
            if (child.isMesh && child.material && child.material.emissive && child.material.emissive.getHex() === 0xffaa00) {
                child.userData.isWindow = true;
                child.userData.isBroken = false;
                cityWindows.push(child);
            }
        });
    }
}

function showLevelStartNotification(levelName) {
    const levelIndex = GameWorld.levelOrder.indexOf(levelName);
    const levelDisplayName = GameWorld.levels[levelName].name;
    const notificationContainer = document.getElementById('level-notification-container');
    if (notificationContainer) {
        notificationContainer.innerHTML = `Level ${levelIndex + 1}/6: ${levelDisplayName}`;
        notificationContainer.classList.add('show');
        setTimeout(() => {
            notificationContainer.classList.remove('show');
        }, 5000); 
    }
}


function restartGame() {
    const levelToLoad = isGameWon ? 'city' : currentLevel;
    loadLevel(levelToLoad, true);
}

function gameOver(message = "COMPLIANCE FAILED") {
    isGameOver = true;
    controls.isLocked = false;
    if (document.pointerLockElement) document.exitPointerLock();
    const blocker = document.getElementById('blocker');
    blocker.innerHTML = `<div class="menu-box">
                            <h1 class="menu-header">
                                <span>${message}</span>
                                <button id="close-gameover" class="header-close-button">&times;</button>
                            </h1>
                            <p>Final Score: ${score}</p>
                            <p style="font-size: 24px; margin-top: 20px;">Click or Press SPACE to Restart</p>
                            <div class="options-buttons" style="margin-top:20px;">
                                <button id="options-button-gameover">Options</button>
                            </div>
                        </div>`;
    blocker.style.display = 'flex';
    blocker.style.flexDirection = 'column';

    const closeGameOverButton = document.getElementById('close-gameover');
    if(closeGameOverButton) {
        closeGameOverButton.addEventListener('click', () => {
             document.getElementById('blocker').style.display = 'none';
        });
    }
}

function questComplete() {
    isGameOver = true;
    isGameWon = true; 
    controls.isLocked = false;
    if (document.pointerLockElement) document.exitPointerLock();
    
    safeStopMusic(); // Stop active level music (e.g. music_crystal.mp3) immediately
    
    const blocker = document.getElementById('blocker');
    
    // Transparent content template to eliminate the radial wrapper box entirely and show full-bleed finish.mp4
    blocker.innerHTML = `
        <div class="menu-box" style="background: transparent !important; border: none !important; box-shadow: none !important; z-index: 2; position: relative;">
            <h1 class="menu-header">
                <span class="win-header-spooky" style="font-family: 'Creepster', cursive, sans-serif !important; font-size: 3.5rem !important; color: #00ffff !important; text-shadow: 0 0 10px #00ffff, 0 0 20px #bd00ff, 2px 2px 4px #000 !important;">You Have Successfully Finished the Quest.</span>
            </h1>
            <p style="font-size: 1.5rem !important; color: #e0e0ff !important; text-shadow: 1px 1px 2px #000 !important; margin: 15px 0 !important;">Final Score: ${score}</p>
            <p style="font-size: 24px; margin-top: 20px; text-shadow: 1px 1px 2px #000; color: #00ffff;">Click or Press SPACE to Play Again</p>
        </div>
        <div id="finish-media-bg-container" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 1; overflow: hidden; pointer-events: none; background: #000;">
            <video src="finish.mp4" autoplay loop muted playsinline style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover; opacity: 1;"></video>
        </div>
    `;
    blocker.style.display = 'flex';
    blocker.style.flexDirection = 'column';
    blocker.style.background = '#000';
}

function winGame() {
    gameOver("OBJECTIVE COMPLETE. MANKIND IS SAVED.");
}

function loadSounds() {
    const audioLoader = new THREE.AudioLoader();
    const soundsToLoad = [ 
        'player_damage', 'player_death', 'alien_death', 'cyborg_death', 'cyborg_shoot', 
        'gun_pistol', 'gun_shotgun', 'gun_machinegun', 'gun_rocket', 
        'gun_plasma', 'gun_grenade', 'gun_axe', 'gun_sniper', 'gun_blackhole', 
        'blackhole_open', 'blackhole_close',
        'jetpack', 'hoverbike', 'spacecraft', 'pickup_health', 'pickup_fuel_cell',
        'pickup_ammo', 'pickup_item', 'pickup_glowingorb',
        'rocket_explosion', 'grenade_explosion',
        'tentacles_rise', 'throw_glowingorb',
        'flyer_shoot', 'shard_roller_shoot', 'stingray_bomb_drop', 'lightning_shoot',
        'glass_break' // Added glass break sound effect loading
    ];
    
    // Initializing Background Music with native HTML5 Audio to bypass asynchronous mobile loading blocks
    backgroundMusic = new Audio('music_intro.mp3');
    backgroundMusic.loop = true;
    backgroundMusic.volume = gameSettings.musicVolume;
    
    const blocker = document.getElementById('blocker');
    const isIntroActiveScreen = blocker && blocker.style.display !== 'none';
    if (hasInteracted && isIntroActiveScreen) {
        backgroundMusic.play().catch(e => console.warn("Failed to autoplay intro music:", e));
    }

    soundsToLoad.forEach(name => {
        audioLoader.load(`${name}.mp3`, 
            (buffer) => {
                gameSounds[name] = buffer;
            },
            () => {},
            () => {
                console.warn(`Could not load sound: ${name}.mp3. Sound is disabled.`);
                gameSounds[name] = null;
            }
        );
    });
}

function safeStopMusic() {
    if (backgroundMusic) {
        try {
            backgroundMusic.pause();
            backgroundMusic.currentTime = 0;
        } catch (e) {
            console.warn("Bypassed error during stopMusic:", e);
        }
    }
}

function switchMusicToLevel(levelName) {
    const levelMusicMap = {
        city: 'music_city.mp3',
        desert: 'music_desert.mp3',
        volcanic: 'music_volcanic.mp3',
        ice: 'music_ice.mp3',
        toxic: 'music_toxic.mp3',
        crystal: 'music_crystal.mp3'
    };
    const trackToLoad = levelMusicMap[levelName] || 'music_intro.mp3';
    
    if (currentlyLoadingTrack === trackToLoad) return;
    currentlyLoadingTrack = trackToLoad;
    
    safeStopMusic();
    
    if (!backgroundMusic) {
        backgroundMusic = new Audio();
        backgroundMusic.loop = true;
    }
    backgroundMusic.src = trackToLoad;
    backgroundMusic.volume = gameSettings.musicVolume;
    
    if (hasInteracted) {
        backgroundMusic.play()
            .then(() => {
                currentlyLoadingTrack = null;
            })
            .catch(err => {
                console.warn(`Could not play level music: ${trackToLoad}. Trying fallback.`, err);
                // Fallback to intro music if specific level file is missing or misspelled
                if (trackToLoad !== 'music_intro.mp3') {
                    backgroundMusic.src = 'music_intro.mp3';
                    backgroundMusic.play().catch(e => console.error("Fallback music play blocked:", e));
                }
                currentlyLoadingTrack = null;
            });
    } else {
        currentlyLoadingTrack = null;
    }
}

function playSound(name, sourcePosition = null) {
    let pan = 0;
    let distanceMultiplier = 1.0;
    
    if (camera) {
        if (!sourcePosition) {
            if (name === 'cyborg_shoot') {
                let closestCyborg = null;
                let minDist = Infinity;
                aliens.forEach(a => {
                    if (a.userData.type === 'cyborg' && a.userData.state === 'shooting') {
                        const dist = a.position.distanceTo(playerObject.position);
                        if (dist < minDist) {
                            minDist = dist;
                            closestCyborg = a;
                        }
                    }
                });
                if (closestCyborg) sourcePosition = closestCyborg.position;
            } else if (name === 'cyborg_death' || name === 'alien_death') {
                let closestDead = null;
                let minDist = Infinity;
                aliens.forEach(a => {
                    if (a.userData.health <= 0 || a.userData.state === 'dying') {
                        const dist = a.position.distanceTo(playerObject.position);
                        if (dist < minDist) {
                            minDist = dist;
                            closestDead = a;
                        }
                    }
                });
                if (closestDead) sourcePosition = closestDead.position;
            } else if (name === 'player_damage' && lastAttackerPosition) {
                sourcePosition = lastAttackerPosition;
            }
        }

        if (sourcePosition) {
            const camPos = new THREE.Vector3();
            camera.getWorldPosition(camPos);
            const dist = camPos.distanceTo(sourcePosition);
            
            // Calculate distance attenuation (inverse distance model)
            const referenceDistance = 5;
            const maxDistance = 120;
            
            if (dist > referenceDistance) {
                distanceMultiplier = referenceDistance / (referenceDistance + 1.2 * (dist - referenceDistance));
            }
            
            if (dist > maxDistance) {
                distanceMultiplier = 0;
            } else {
                const fadeStart = maxDistance * 0.8;
                if (dist > fadeStart) {
                    const fadeProgress = (dist - fadeStart) / (maxDistance - fadeStart);
                    distanceMultiplier *= (1 - fadeProgress);
                }
            }
            distanceMultiplier = Math.max(0, Math.min(1, distanceMultiplier));

            // Calculate stereo panning
            const dir = sourcePosition.clone().sub(camPos).normalize();
            const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.getWorldQuaternion(new THREE.Quaternion()));
            pan = dir.dot(right);
            pan = Math.max(-1, Math.min(1, pan)); 
        }
    }

    // Optimization: If the sound is too far and completely silent, don't play it
    if (distanceMultiplier <= 0) return;

    if (!gameSounds[name]) {
        return;
    }
    if (!audioListener) return;
    
    const sound = new THREE.Audio(audioListener);
    sound.setBuffer(gameSounds[name]);
    sound.setVolume(gameSettings.sfxVolume * distanceMultiplier);
    
    if (pan !== 0 && audioListener.context.createStereoPanner) {
        const panner = audioListener.context.createStereoPanner();
        panner.pan.setValueAtTime(pan, audioListener.context.currentTime);
        
        sound.getOutput().disconnect();
        sound.getOutput().connect(panner);
        panner.connect(audioListener.getInput());
    }
    
    sound.play();
}

function rebuildPlayerGunModels() {
    if (!camera || !gunModels) return;
    // Remove old gun models from camera
    gunModels.forEach(g => {
        if (g && g.parent) camera.remove(g);
    });
    gunModels = [];
    
    // Re-create gun models
    GameData.weapons.forEach(w => gunModels.push(w.model(true)));
    
    // Re-add to camera and set visibility
    gunModels.forEach((gun, index) => { 
        gun.position.copy(gunBasePosition);
        gun.visible = (index === player.currentWeaponIndex); 
        camera.add(gun);
    });
}

function animate() {
    requestAnimationFrame(animate);
    
    if (health <= 0 && !isGameOver) {
        playSound('player_death');
        gameOver();
    }
    if (isGameOver) return;
    
    const delta = clock.getDelta();
    
    if (player.xrayGogglesActive) {
        aliens.forEach(alien => {
            alien.traverse(child => {
                if (child.isMesh) {
                    if (child.material !== xrayMaterials.enemy && !originalMaterials.has(child)) {
                        originalMaterials.set(child, child.material);
                        child.material = xrayMaterials.enemy;
                    }
                }
            });
        });
    }

    if (!isPaused) {
        updateGamepadControls(delta);

        // --- JETPACK SOUND LOOP CONTROL ---
        const isJetpackActive = keys['Space'] && player.hasJetpack && player.jetpackFuel > 0 && !player.canJump && player.state === 'on_foot' && !isPaused;
        if (isJetpackActive) {
            if (!jetpackSoundActive) {
                jetpackSoundActive = true;
                if (gameSounds['jetpack']) {
                    jetpackSound = new THREE.Audio(audioListener);
                    jetpackSound.setBuffer(gameSounds['jetpack']);
                    jetpackSound.setLoop(false);
                    jetpackSound.setVolume(gameSettings.sfxVolume);
                    jetpackSound.play();
                }
            }
        } else {
            if (jetpackSoundActive) {
                jetpackSoundActive = false;
                if (jetpackSound) {
                    try { if (jetpackSound.isPlaying) jetpackSound.stop(); } catch(e) {}
                    jetpackSound = null;
                }
            }
        }

        if (player.state === 'driving_motorcycle' && (keys['KeyW'] || keys['KeyS'])) {
            playSound('hoverbike');
        }

        // --- SPACECRAFT ONE-SHOT TRANSITION SOUND ---
        if (player.state !== lastPlayerState) {
            if (player.state === 'entering_spacecraft') {
                playSound('spacecraft');
            }
            lastPlayerState = player.state;
        }

        switch(player.state) {
            case 'on_foot':
                if ((mouse.isDown || keys['KeyB']) && ['Machine Gun', 'Plasma Gun'].includes(GameData.weapons[player.currentWeaponIndex].name)) {
                    shoot();
                }
                if (health < lastHealth) {
                    if (damageFlashElement) {
                        damageFlashElement.style.opacity = 0.5;
                        setTimeout(() => { damageFlashElement.style.opacity = 0; }, 120);
                    }
                }
                lastHealth = health;
                updatePlayer(delta);
                updateInteractions();
                break;
            case 'driving_motorcycle':
                if (mouse.isDown || keys['KeyB']) shoot();
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
            updateCompass();
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
        
        // Window collision & glass shard animation updates
        checkWindowCollisions();
        updateGlassShards(delta);

        if(keys['Tab']) updateMap();
    }

    updateGun(delta);
    updateAttackIndicator();
    
    if (gameSettings.sbs3dEnabled) {
        const w = window.innerWidth;
        const h = window.innerHeight;
        
        stereoCamera.eyeSep = gameSettings.sbsEyeSep;
        stereoCamera.update(camera);
        renderer.setScissorTest(true);

        renderer.setScissor(0, 0, w / 2, h);
        renderer.setViewport(0, 0, w / 2, h);
        renderer.render(scene, stereoCamera.cameraL);
        
        renderer.setScissor(w / 2, 0, w / 2, h);
        renderer.setViewport(w / 2, 0, w / 2, h);
        renderer.render(scene, stereoCamera.cameraR);

        renderer.setScissorTest(false);
    } else {
        renderer.render(scene, camera);
    }
}

function toggleXRayEffect(isActive) {
    if (isActive) {
        if (originalMaterials.size > 0) return;

        scene.traverse(obj => {
            if (obj.isMesh) {
                let isPlayerGun = false;
                for(const gun of gunModels) {
                    if(gun === obj || (gun.children && gun.getObjectById(obj.id))) {
                        isPlayerGun = true;
                        break;
                    }
                }
                if (isPlayerGun) return;

                let xrayMatToApply = null;

                if (aliens.some(a => a === obj || a.getObjectById(obj.id))) {
                    xrayMatToApply = xrayMaterials.enemy;
                } else if (spacecraft && (spacecraft === obj || spacecraft.getObjectById(obj.id))) {
                    xrayMatToApply = xrayMaterials.spacecraft;
                } else if (collectibles.fuelCells.some(fc => fc === obj || (fc && fc.getObjectById(obj.id)))) {
                    xrayMatToApply = xrayMaterials.fuelCell;
                }
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
                                    glassShards.some(g=>g.mesh===obj) ||
                                    Object.values(collectibles).flat().some(c => c === obj || (c && c.getObjectById && c.getObjectById(obj.id)));

                    if (!isDynamic) {
                        xrayMaterials = {
                            wall: new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true, transparent: true, opacity: 0.15, depthWrite: false }),
                            enemy: new THREE.MeshBasicMaterial({ color: 0xff0000, emissive: 0xff0000, emissiveIntensity: 2.0, depthWrite: false }),
                            fuelCell: new THREE.MeshBasicMaterial({ color: 0x00ffff, emissive: 0x00ffff, emissiveIntensity: 2.0, depthWrite: false }),
                            spacecraft: new THREE.MeshBasicMaterial({ color: 0x00ff00, emissive: 0x00ff00, emissiveIntensity: 2.0, depthWrite: false }),
                        };
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

    } else { 
        if (originalMaterials.size === 0) return; 

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
        strikePos.y = 0; 

        const startPos = strikePos.clone();
        startPos.y = 200; 

        createLightningBolt(startPos, strikePos, 25);
    }
}

// --- OVERRIDES & WINDOW MECHANICS ---

// Override checkBuildingCollision to handle preemptive window hits before wall absorption
const originalCheckBuildingCollision = checkBuildingCollision;
checkBuildingCollision = function(objectBox) {
    if (currentLevel === 'city' && cityWindows.length > 0) {
        const size = new THREE.Vector3();
        objectBox.getSize(size);
        // Detect only small projectiles (bullets/rockets/etc.) to prevent players/enemies breaking windows by walking
        const isSmallProjectile = size.x < 0.5 && size.y < 0.5 && size.z < 0.5;

        if (isSmallProjectile) {
            for (let i = 0; i < cityWindows.length; i++) {
                const win = cityWindows[i];
                if (win.userData.isBroken) continue;

                const windowBox = new THREE.Box3().setFromObject(win);
                windowBox.expandByScalar(0.25); // Expand window collision area to intercept bullet before wall absorbs it

                if (windowBox.intersectsBox(objectBox)) {
                    const hitPos = new THREE.Vector3();
                    objectBox.getCenter(hitPos);
                    breakWindow(win, hitPos);
                    return true; // Triggers collision response in projectile update
                }
            }
        }
    }
    return originalCheckBuildingCollision(objectBox);
};

// Overriding enemy destruction particles to be spheres, have a higher count, and larger blast range
function createAlienDebris(position, color) {
    const n = Math.floor(Math.random() * 16) + 30; // Increased count to 30-45 (originally 15-25)
    const g = new THREE.SphereGeometry(0.06, 8, 8); // Decreased sphere radius to make them smaller (radius 0.06, originally 0.12)
    const m = new THREE.MeshStandardMaterial({ color: color, emissive: color, emissiveIntensity: 2.5 });
    for (let i = 0; i < n; i++) {
        const d = new THREE.Mesh(g, m); 
        d.position.copy(position);
        const v = new THREE.Vector3(
            (Math.random() - 0.5) * 14, // Slightly faster horizontal speed
            Math.random() * 12 + 4, 
            (Math.random() - 0.5) * 14
        );
        alienDebris.push({ mesh: d, velocity: v, lifetime: 2.5 }); 
        scene.add(d);
    }
}

// Checks collisions between any active player-fired projectiles and the city windows
function checkWindowCollisions() {
    if (currentLevel !== 'city') return;

    // Collate all active projectiles that can break windows
    const projectiles = [...bullets, ...rockets, ...plasmaRings, ...grenades, ...shardProjectiles];

    for (let w = 0; w < cityWindows.length; w++) {
        const child = cityWindows[w];
        if (child.userData.isBroken) continue;

        const windowBox = new THREE.Box3().setFromObject(child);
        windowBox.expandByScalar(0.25); // Expand window collision area slightly to intercept bullet

        for (let i = projectiles.length - 1; i >= 0; i--) {
            const proj = projectiles[i];
            const projBox = new THREE.Box3().setFromObject(proj);

            if (windowBox.intersectsBox(projBox)) {
                breakWindow(child, proj.position.clone());

                // Remove the colliding bullet from the active bullets array so it terminates
                const bulletIdx = bullets.indexOf(proj);
                if (bulletIdx > -1) {
                    scene.remove(proj);
                    bullets.splice(bulletIdx, 1);
                }
                break;
            }
        }
    }
}

// Breaks a targeted city window, modifying its look and generating a glass shatter particle effect
function breakWindow(windowMesh, hitPosition) {
    windowMesh.userData.isBroken = true;

    // Clone material so we only affect this specific window
    windowMesh.material = windowMesh.material.clone();

    // Replace window.jpg with windowbroken.jpg texture when textures are enabled
    if (gameSettings.texturesEnabled && window.cityWindowBrokenTexture) {
        windowMesh.material.map = window.cityWindowBrokenTexture;
        windowMesh.material.color.setHex(0xffffff); // resetting to white for texture map
    } else {
        // If textures are off, set base color to black/very dark gray
        windowMesh.material.map = null;
        windowMesh.material.color.setHex(0x111111);
    }

    // Turn off emissive glow completely by setting emissive to black
    windowMesh.material.emissive.setHex(0x000000);
    windowMesh.material.emissiveIntensity = 0.0;
    windowMesh.material.needsUpdate = true;

    // Play Spatial glass break audio
    playSound('glass_break', hitPosition);

    // Create glass shatter particles flying outwards
    createGlassShards(hitPosition);
}

// Generates sharp conical glass shard meshes with fysiikkakäyttäytyminen
function createGlassShards(position) {
    const count = Math.floor(Math.random() * 16) + 15; // 15 to 30 shards
    const shardGeo = new THREE.ConeGeometry(0.06, 0.18, 3); // sharp shard look
    const shardMat = new THREE.MeshStandardMaterial({
        color: 0xddf0ff,
        transparent: true,
        opacity: 0.85,
        roughness: 0.1,
        metalness: 0.9
    });

    for (let i = 0; i < count; i++) {
        const shard = new THREE.Mesh(shardGeo, shardMat);
        shard.position.copy(position);

        // Explode shards outwards dynamically
        const velocity = new THREE.Vector3(
            (Math.random() - 0.5) * 8,
            Math.random() * 5 + 2,
            (Math.random() - 0.5) * 8
        );

        const spin = new THREE.Vector3(
            Math.random() * 20 - 10,
            Math.random() * 20 - 10,
            Math.random() * 20 - 10
        );

        glassShards.push({
            mesh: shard,
            velocity: velocity,
            spin: spin,
            lifetime: 1.5
        });

        scene.add(shard);
    }
}

// Updates glass shard physics (translation, rotation, gravity) and lifetime removal
function updateGlassShards(delta) {
    for (let i = glassShards.length - 1; i >= 0; i--) {
        const s = glassShards[i];
        s.velocity.y -= GRAVITY * 0.5 * delta; // apply gravity
        s.mesh.position.add(s.velocity.clone().multiplyScalar(delta));
        s.mesh.rotation.x += s.spin.x * delta;
        s.mesh.rotation.y += s.spin.y * delta;
        s.mesh.rotation.z += s.spin.z * delta;
        s.lifetime -= delta;

        if (s.lifetime <= 0) {
            scene.remove(s.mesh);
            if (s.mesh.geometry) s.mesh.geometry.dispose();
            if (s.mesh.material) s.mesh.material.dispose();
            glassShards.splice(i, 1);
        }
    }
}