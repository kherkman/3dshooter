/**
 * player-controls.js
 * Handles player input, controls, camera, and state changes (on_foot, hyperspace, etc.).
 * Manages UI menu toggling logic.
 */

const levelOrder = ['city', 'desert', 'volcanic', 'ice', 'toxic', 'crystal'];

// --- TOUCH CONTROLS STATE ---
const touchState = {
    move: { id: null, startX: 0, startY: 0, currentX: 0, currentY: 0 },
    look: { id: null, startX: 0, startY: 0, lastX: 0, lastY: 0 },
    lastDoubleTap: 0,
};

function setupControls() {
    const mapContainer = document.getElementById('map-container');
    const onMouseMove = (event) => {
        if (isPaused) return;
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        if (controls.isLocked === false) return;
        
        const movementX = event.movementX || 0;
        const movementY = event.movementY || 0;
        
        if (player.state === 'on_foot' || player.state === 'driving_motorcycle') {
            playerObject.rotation.y -= movementX * 0.002;
            camera.rotation.x -= movementY * 0.002;
            camera.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, camera.rotation.x));
        }
    };
    const onMouseWheel = (event) => {
        if (isPaused || !controls.isLocked || player.state !== 'on_foot') return;

        const weapon = GameData.weapons[player.currentWeaponIndex];
        if (weapon.name !== 'Sniper Rifle') return;

        event.preventDefault();

        const zoomProps = weapon.properties.zoom;
        const scrollDirection = event.deltaY > 0 ? 1 : -1; // 1 for scroll down, -1 for scroll up

        // Scroll down -> zoom out (increase FOV), Scroll up -> zoom in (decrease FOV)
        camera.fov += scrollDirection * zoomProps.step;
        camera.fov = Math.max(zoomProps.min, Math.min(zoomProps.max, camera.fov));
        camera.updateProjectionMatrix();
    };
    const onKeyDown = (event) => {
        // MODIFIED: Restart on any key except options/escape when game is over
        if (isGameOver && event.key !== 'Escape' && event.code !== 'KeyO') { 
            event.preventDefault(); 
            restartGame(); 
            return; 
        }

        if (!controls.isLocked && !isGameOver && (event.code === 'Space' || event.key === ' ')) {
            if (!hasInteracted) { 
                if(backgroundMusic) backgroundMusic.play(); 
                hasInteracted = true; 
            }
            document.body.requestPointerLock();
        }
        if (event.code === 'KeyO' || event.key === 'Escape') { toggleOptionsMenu(); return; }
        if (event.code === 'KeyJ') { toggleDebugMenu(); return; }
        if (debugMenu && debugMenu.style.display.includes('flex') && event.code === 'KeyH') {
            // --- DEV CHEAT ---
            player.fuelCells += 2;
            if (!player.hasJetpack) {
                player.hasJetpack = true;
                player.jetpackFuel = player.maxJetpackFuel;
                document.getElementById('jetpack-hud-container').style.display = 'flex';
            }
            if (!player.hasXRayGoggles) {
                player.hasXRayGoggles = true;
            }
            health = 500;
            for(let i = 0; i < GameData.weapons.length; i++) {
                if (!player.unlockedWeapons[i]) {
                    player.unlockedWeapons[i] = true;
                    document.getElementById(`weapon-sprite-${i}`).style.display = 'block';
                }
            }
            player.ammo.shotgun += 50; player.ammo.machinegun += 400; player.ammo.rocket += 20; player.ammo.plasma += 200; player.ammo.grenade += 10; player.ammo.sniper += 20; player.ammo.blackhole += 5;
            console.log("DEBUG: Health, Weapons, Ammo, and Fuel Cells added.");
            updateHUD();
            return;
        }
        if (event.code === 'KeyR') { toggleInventoryMenu(); return; }
        if (isPaused) return;
        if (event.code === 'KeyF') {
            if (player.state === 'driving_motorcycle') exitMotorcycle();
            else if (!fKeyPressed) { keys[event.code] = true; fKeyPressed = true; } 
        } else { 
            keys[event.code] = true; 
        }
        if(player.state === 'on_foot' && (event.code === 'KeyQ' || event.code === 'KeyE')) changeWeapon(event.code === 'KeyE' ? 1 : -1);
        if(event.code === 'Tab') { event.preventDefault(); mapContainer.style.display = 'flex'; }
    };
    const onKeyUp = (event) => {
        keys[event.code] = false;
        if(event.code === 'Tab') mapContainer.style.display = 'none';
        if(event.code === 'KeyF') fKeyPressed = false;
    };
    
    document.addEventListener('pointerlockchange', () => {
        if (document.pointerLockElement === document.body) {
            // Pointer has been successfully LOCKED
            controls.isLocked = true;
            isPaused = false;
            // Hide all menus to ensure a clean game state
            document.getElementById('options-menu').style.display = 'none';
            document.getElementById('inventory-menu').style.display = 'none';
            document.getElementById('blocker').style.display = 'none';
        } else {
            // Pointer has been UNLOCKED
            controls.isLocked = false;
            // If the game isn't over and we are not intentionally pausing for inventory, show the options menu.
            // This handles the user pressing ESC to exit pointer lock.
            // NOTE: isPaused is NOT set to true here, allowing the game to run in the background.
            if (!isGameOver && !inventoryMenu.style.display.includes('flex') && !debugMenu.style.display.includes('flex')) {
                document.getElementById('options-menu').style.display = 'flex';
            }
        }
    });

    const onBlockerInteract = (event) => {
        // If an options button on any overlay was clicked, open options and stop.
        if (event.target.id === 'options-button-intro' || event.target.id === 'options-button-gameover') {
            toggleOptionsMenu(true);
            return;
        }

        if (!hasInteracted) {
            if (backgroundMusic) backgroundMusic.play();
            hasInteracted = true;
            // Attempt to go fullscreen on the first interaction
            document.documentElement.requestFullscreen().catch(err => {
                console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
            });
        }

        if (isGameOver) {
            restartGame();
        } else {
            document.body.requestPointerLock();
        }
    };
    document.getElementById('blocker').addEventListener('click', (e) => onBlockerInteract(e));
    document.getElementById('blocker').addEventListener('touchend', (e) => {
        if (e.target.nodeName === 'BUTTON') return;
        onBlockerInteract(e);
    });

    const closeIntroButton = document.getElementById('close-intro');
    const closeIntroHandler = (e) => {
        e.stopPropagation();
        document.getElementById('blocker').style.display = 'none';
    };
    if (closeIntroButton) {
        closeIntroButton.addEventListener('click', closeIntroHandler);
        closeIntroButton.addEventListener('touchend', closeIntroHandler);
    }

    const closeOptions = () => toggleOptionsMenu(false);
    document.getElementById('close-options').addEventListener('click', closeOptions);
    document.getElementById('close-options').addEventListener('touchend', closeOptions);

    const restartFromOptions = () => { isPaused = false; restartGame(); };
    document.getElementById('restart-button-options').addEventListener('click', restartFromOptions);
    document.getElementById('restart-button-options').addEventListener('touchend', restartFromOptions);

    // Fullscreen button
    document.getElementById('fullscreen-button').addEventListener('click', () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
            });
        } else {
            document.exitFullscreen();
        }
        // Close the menu after toggling to prevent a "frozen" state.
        toggleOptionsMenu(false);
    });
    
    document.addEventListener('fullscreenchange', () => {
        if (typeof onWindowResize === 'function') {
            onWindowResize();
        }
        if (!document.fullscreenElement && !isPaused && !isGameOver) {
            document.body.requestPointerLock();
        }
    });

    const sfxSlider = document.getElementById('sfx-volume'); sfxSlider.value = gameSettings.sfxVolume; sfxSlider.addEventListener('input', (e) => { gameSettings.sfxVolume = parseFloat(e.target.value); });
    const musicSlider = document.getElementById('music-volume'); musicSlider.value = gameSettings.musicVolume; musicSlider.addEventListener('input', (e) => { gameSettings.musicVolume = parseFloat(e.target.value); if(backgroundMusic) backgroundMusic.setVolume(gameSettings.musicVolume); });
    
    const handleInventoryInteraction = (e) => {
        e.preventDefault();
        const itemEl = e.target.closest('.inventory-item');
        if (!itemEl) return;

        const weaponIndex = itemEl.dataset.weaponIndex;
        const itemKey = itemEl.dataset.itemKey;

        if (weaponIndex !== undefined) {
            const index = parseInt(weaponIndex, 10);
            if (player.unlockedWeapons[index]) {
                setActiveWeapon(index);
                toggleInventoryMenu();
            }
        } else if (itemKey) {
            if (itemKey === 'xray_goggles' && player.hasXRayGoggles) {
                player.xrayGogglesActive = !player.xrayGogglesActive;
                toggleXRayEffect(player.xrayGogglesActive);
                updateInventoryMenu();
            }
        }
    };
    inventoryMenu.addEventListener('click', handleInventoryInteraction);
    inventoryMenu.addEventListener('touchend', handleInventoryInteraction);
    document.getElementById('close-inventory').addEventListener('click', toggleInventoryMenu);
    document.getElementById('close-inventory').addEventListener('touchend', toggleInventoryMenu);

    // --- TOUCH CONTROLS SETUP ---
    const onTouchStart = (event) => {
        if (isGameOver || isPaused) return;
        const currentTime = Date.now();
        
        // MODIFIED: Interact is now a two-finger tap anywhere
        if(event.touches.length === 2 && currentTime - touchState.lastDoubleTap > 500) {
            touchState.lastDoubleTap = currentTime;
            // Trigger 'F' key for interaction
            keys['KeyF'] = true; 
            fKeyPressed = true;
            setTimeout(() => { keys['KeyF'] = false; fKeyPressed = false; }, 100);
            return; // Prevent other touch actions from firing
        }

        for (const touch of event.changedTouches) {
            const halfWidth = window.innerWidth / 2;
            const halfHeight = window.innerHeight / 2;
            
            // Lower-left for movement
            if (touch.clientX < halfWidth && touch.clientY > halfHeight && touchState.move.id === null) {
                touchState.move.id = touch.identifier;
                touchState.move.startX = touch.clientX;
                touchState.move.startY = touch.clientY;
                touchState.move.currentX = touch.clientX;
                touchState.move.currentY = touch.clientY;
            } 
            // Lower-right for looking
            else if (touch.clientX >= halfWidth && touch.clientY > halfHeight && touchState.look.id === null) {
                touchState.look.id = touch.identifier;
                touchState.look.startX = touch.clientX;
                touchState.look.startY = touch.clientY;
                touchState.look.lastX = touch.clientX;
                touchState.look.lastY = touch.clientY;
            } 
        }
    };

    const onTouchMove = (event) => {
        if (isGameOver || isPaused) return;
        event.preventDefault(); // Prevent screen scrolling
        for (const touch of event.changedTouches) {
            if (touch.identifier === touchState.move.id) {
                touchState.move.currentX = touch.clientX;
                touchState.move.currentY = touch.clientY;
                const dx = touchState.move.currentX - touchState.move.startX;
                const dy = touchState.move.currentY - touchState.move.startY;
                const deadZone = 20;

                keys['KeyW'] = dy < -deadZone;
                keys['KeyS'] = dy > deadZone;
                keys['KeyA'] = dx < -deadZone;
                keys['KeyD'] = dx > deadZone;
            } else if (touch.identifier === touchState.look.id) {
                const movementX = touch.clientX - touchState.look.lastX;
                const movementY = touch.clientY - touchState.look.lastY;
                touchState.look.lastX = touch.clientX;
                touchState.look.lastY = touch.clientY;

                if (player.state === 'on_foot' || player.state === 'driving_motorcycle') {
                    playerObject.rotation.y -= movementX * 0.002;
                    camera.rotation.x -= movementY * 0.002;
                    camera.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, camera.rotation.x));
                }
            }
        }
    };
    
    const onTouchEnd = (event) => {
        for (const touch of event.changedTouches) {
            if (touch.identifier === touchState.move.id) {
                touchState.move.id = null;
                keys['KeyW'] = false; keys['KeyS'] = false; keys['KeyA'] = false; keys['KeyD'] = false;
            } else if (touch.identifier === touchState.look.id) {
                touchState.look.id = null;
            }
        }
    };

    document.addEventListener('touchstart', onTouchStart, { passive: false });
    document.addEventListener('touchmove', onTouchMove, { passive: false });
    document.addEventListener('touchend', onTouchEnd, { passive: false });
    document.addEventListener('touchcancel', onTouchEnd, { passive: false });

    // --- MOUSE/KEYBOARD LISTENERS (Continued) ---
    controls = { isLocked: false }; document.addEventListener('mousemove', onMouseMove, false); document.addEventListener('keydown', onKeyDown); document.addEventListener('keyup', onKeyUp); document.addEventListener('wheel', onMouseWheel, { passive: false }); document.addEventListener('mousedown', () => { if(controls.isLocked) mouse.isDown = true; }); document.addEventListener('mouseup', () => mouse.isDown = false); document.addEventListener('click', () => { if (controls.isLocked && !isGameOver && !isPaused && player.state === 'on_foot' && !['Machine Gun', 'Plasma Gun'].includes(GameData.weapons[player.currentWeaponIndex].name) && !player.carriedObject) shoot(); });
    
    // --- HUD & TOUCH CONTROLS MENU BUTTONS ---
    
    // MODIFIED: Inventory HUD button listener
    const inventoryButton = document.getElementById('inventory-button-hud');
    inventoryButton.addEventListener('click', toggleInventoryMenu);
    inventoryButton.addEventListener('touchstart', (e) => { e.preventDefault(); toggleInventoryMenu(); });

    // MODIFIED: Jump HUD button listeners
    const jumpButton = document.getElementById('jump-button-hud');
    jumpButton.addEventListener('touchstart', (e) => { e.preventDefault(); keys['Space'] = true; });
    jumpButton.addEventListener('touchend', (e) => { e.preventDefault(); keys['Space'] = false; });
    
    // MODIFIED: Shoot HUD button listeners
    const shootButton = document.getElementById('shoot-button-hud');
    shootButton.addEventListener('touchstart', (e) => { e.preventDefault(); mouse.isDown = true; });
    shootButton.addEventListener('touchend', (e) => { e.preventDefault(); mouse.isDown = false; });

    const showTouchControls = () => { document.getElementById('touch-controls-menu').style.display = 'flex'; };
    document.getElementById('show-touch-controls-intro').addEventListener('click', showTouchControls);
    document.getElementById('show-touch-controls-intro').addEventListener('touchend', showTouchControls);
    document.getElementById('show-touch-controls-options').addEventListener('click', showTouchControls);
    document.getElementById('show-touch-controls-options').addEventListener('touchend', showTouchControls);

    const closeTouchControls = () => { document.getElementById('touch-controls-menu').style.display = 'none'; };
    document.getElementById('close-touch-controls').addEventListener('click', closeTouchControls);
    document.getElementById('close-touch-controls').addEventListener('touchend', closeTouchControls);
}

function toggleOptionsMenu(forceOpen = null) {
    const optionsMenu = document.getElementById('options-menu');
    const isCurrentlyOpen = optionsMenu.style.display.includes('flex');
    const shouldBeOpen = forceOpen !== null ? forceOpen : !isCurrentlyOpen;

    if (shouldBeOpen) {
        document.exitPointerLock();
        optionsMenu.style.display = 'flex';
    } else {
        optionsMenu.style.display = 'none';
        if (!inventoryMenu.style.display.includes('flex') && !debugMenu.style.display.includes('flex') && !isGameOver) {
            document.body.requestPointerLock();
        }
    }
}

function toggleInventoryMenu() {
    const isOpening = inventoryMenu.style.display !== 'flex';
    if (isOpening) {
        updateInventoryMenu();
        isPaused = true; // Inventory explicitly pauses the game
        inventoryMenu.style.display = 'flex';
        document.exitPointerLock();
    } else {
        inventoryMenu.style.display = 'none';
        isPaused = false; // Unpause when closing
        if (!isGameOver && !document.getElementById('options-menu').style.display.includes('flex')) {
            document.body.requestPointerLock();
        }
    }
}

function setActiveWeapon(index) {
    if (player.currentWeaponIndex === index || player.carriedObject) return;
    
    // Reset FOV if switching AWAY from sniper rifle
    const oldWeaponData = GameData.weapons[player.currentWeaponIndex];
    if (oldWeaponData && oldWeaponData.name === 'Sniper Rifle') {
        camera.fov = oldWeaponData.properties.zoom.default;
        camera.updateProjectionMatrix();
    }

    document.getElementById(`weapon-sprite-${player.currentWeaponIndex}`).classList.remove('weapon-active');
    gunModels[player.currentWeaponIndex].visible = false;
    player.currentWeaponIndex = index;
    document.getElementById(`weapon-sprite-${index}`).classList.add('weapon-active');
    gunModels[index].visible = true;
}

function changeWeapon(direction) {
    if (player.state !== 'on_foot' || player.carriedObject) return;
    let newIndex = player.currentWeaponIndex;
    let attempts = 0;
    do {
        newIndex = (newIndex + direction + GameData.weapons.length) % GameData.weapons.length;
        attempts++;
    } while (!player.unlockedWeapons[newIndex] && attempts < GameData.weapons.length);
    
    if (player.unlockedWeapons[newIndex]) {
        setActiveWeapon(newIndex);
    }
}

function updatePlayer(delta) {
    const isMovingByTouch = touchState.move.id !== null;
    // MODIFIED: Removed isPaused check, as player input is now gated by pointer lock state (!controls.isLocked)
    if (player.state !== 'on_foot' || isGameOver || (!controls.isLocked && !isMovingByTouch)) {
        player.velocity.x *= GameWorld.player.damping;
        player.velocity.z *= GameWorld.player.damping;
        return;
    }

    if (player.weaponCooldown > 0) player.weaponCooldown -= delta;
    player.velocity.x *= GameWorld.player.damping;
    player.velocity.z *= GameWorld.player.damping;
    player.velocity.y -= GRAVITY * delta;

    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(playerObject.quaternion);
    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(playerObject.quaternion);
    const moveVector = new THREE.Vector3();
    if (keys['KeyW']) moveVector.add(forward);
    if (keys['KeyS']) moveVector.sub(forward);
    if (keys['KeyA']) moveVector.sub(right);
    if (keys['KeyD']) moveVector.add(right);

    if (moveVector.lengthSq() > 0) {
        moveVector.normalize().multiplyScalar(GameWorld.player.speed * delta);
        player.velocity.add(moveVector);
    }
     if (keys['Space']) {
        if (player.canJump) {
            player.velocity.y = GameWorld.player.jumpHeight;
            player.canJump = false;
        } else if (player.hasJetpack && player.jetpackFuel > 0) {
            player.velocity.y = Math.min(player.velocity.y + GRAVITY * delta * 1.5, 10.0);
            player.jetpackFuel = Math.max(0, player.jetpackFuel - 30 * delta);
        }
    }
    if (player.hasJetpack && player.canJump) player.jetpackFuel = Math.min(player.maxJetpackFuel, player.jetpackFuel + 15 * delta);

    const deltaPos = player.velocity.clone().multiplyScalar(delta);
    const playerBox = new THREE.Box3();
    const playerHeight = GameWorld.player.height;
    const playerSize = new THREE.Vector3(0.6, playerHeight, 0.6);

    // --- X-AXIS COLLISION ---
    playerBox.setFromCenterAndSize(playerObject.position.clone().add(new THREE.Vector3(deltaPos.x, playerHeight/2, 0)), playerSize);
    for (const c of buildingColliders) {
        if(c.userData && c.userData.colliderType === 'mesh') continue; // Skip meshes for simple horizontal check
        if(playerBox.intersectsBox(c)) {
            deltaPos.x = (deltaPos.x > 0 ? c.min.x - playerBox.max.x : c.max.x - playerBox.min.x) - 0.001 * Math.sign(deltaPos.x);
            player.velocity.x = 0; break;
        }
    }
    playerObject.position.x += deltaPos.x;
    
    // --- Z-AXIS COLLISION ---
    playerBox.setFromCenterAndSize(playerObject.position.clone().add(new THREE.Vector3(0, playerHeight/2, deltaPos.z)), playerSize);
    for (const c of buildingColliders) {
         if(c.userData && c.userData.colliderType === 'mesh') continue; // Skip meshes for simple horizontal check
         if(playerBox.intersectsBox(c)) {
            deltaPos.z = (deltaPos.z > 0 ? c.min.z - playerBox.max.z : c.max.z - playerBox.min.z) - 0.001 * Math.sign(deltaPos.z);
            player.velocity.z = 0; break;
        }
    }
    playerObject.position.z += deltaPos.z;
    
    // --- UNIFIED Y-AXIS (VERTICAL) COLLISION ---
    player.canJump = false;
    let highestGroundY = -Infinity;

    // First, find the highest possible ground level beneath the player
    for (const c of buildingColliders) {
        if (c.userData && c.userData.colliderType === 'mesh') {
            const raycaster = new THREE.Raycaster(
                playerObject.position.clone().add(new THREE.Vector3(0, 0.1, 0)), 
                new THREE.Vector3(0, -1, 0)
            );
            const intersections = raycaster.intersectObject(c, true);
            if (intersections.length > 0) {
                highestGroundY = Math.max(highestGroundY, intersections[0].point.y);
            }
        } else {
            const isHorizontallyInside = playerObject.position.x > c.min.x && playerObject.position.x < c.max.x && playerObject.position.z > c.min.z && playerObject.position.z < c.max.z;
            const isAbove = playerObject.position.y >= c.max.y - 0.1;
            if (isHorizontallyInside && isAbove) {
                highestGroundY = Math.max(highestGroundY, c.max.y);
            }
        }
    }
    
    // Ground plane is the ultimate floor
    highestGroundY = Math.max(0, highestGroundY);

    // Now, apply collision based on the highest ground found
    const playerFeetY = playerObject.position.y - playerHeight / 2;
    if (playerFeetY + deltaPos.y < highestGroundY) {
        player.velocity.y = 0;
        // The FIX: Set the player's center to be half their height ABOVE the ground
        playerObject.position.y = highestGroundY + playerHeight / 2;
        player.canJump = true;
    } else {
        playerObject.position.y += deltaPos.y;
    }

    // Vertical collision for hitting ceilings (bonking head)
    playerBox.setFromCenterAndSize(playerObject.position.clone().add(new THREE.Vector3(0, playerHeight/2, 0)), playerSize);
    for (const c of buildingColliders) {
        if (!(c.userData && c.userData.colliderType === 'mesh') && playerBox.intersectsBox(c)) {
            if (player.velocity.y > 0 && playerBox.max.y > c.min.y) {
                 playerObject.position.y -= (playerBox.max.y - c.min.y);
                 player.velocity.y = 0;
                 break;
            }
        }
    }

    for (const alien of aliens) {
        if (playerObject.position.distanceTo(alien.position) < 1.5) { 
            if(alien.userData.type === 'worm_swarm') health -= 5 * delta;
            else health -= 0.25; 
        }
    }
    
    // Reset safety flags each frame
    player.isSafeInBunker = false;
    player.isSafeInShelter = false;

    for (const veg of vegetation) {
        const dist = playerObject.position.distanceTo(veg.position);
        if (veg.userData.isPoison && dist < 1.5) {
            health -= 15 * delta;
        }
        if (veg.userData.isShelter && dist < 1.0) { 
            player.isSafeInShelter = true;
        }
    }
    
    for (const bunker of bunkers) {
        const safeZone = new THREE.Box3().setFromObject(bunker);
        if (safeZone.containsPoint(playerObject.position)) {
            player.isSafeInBunker = true;
            break;
        }
    }
    
    if(player.carriedObject) {
        const holdPos = camera.getWorldPosition(new THREE.Vector3()).add(camera.getWorldDirection(new THREE.Vector3()).multiplyScalar(2));
        player.carriedObject.position.lerp(holdPos, 20 * delta);
    }
}

function updatePlayerVehicle(delta) {
    if (!motorcycle) return;
    const bikeData = motorcycle.userData;
    const bikeProps = GameData.vehicles.motorcycle.properties;
    
    bikeData.velocity.multiplyScalar(bikeProps.damping);
    
    const bikeForward = new THREE.Vector3(0, 0, 1).applyQuaternion(motorcycle.quaternion);
    
    if(keys['KeyW']) bikeData.velocity.add(bikeForward.clone().multiplyScalar(bikeProps.speed * delta));
    if(keys['KeyS']) bikeData.velocity.sub(bikeForward.clone().multiplyScalar(bikeProps.speed * 0.5 * delta));
    
    const playerForward = new THREE.Vector3(0, 0, -1).applyQuaternion(playerObject.quaternion);
    const angle = bikeForward.angleTo(playerForward);

    if (angle > 0.1) {
        const cross = new THREE.Vector3().crossVectors(bikeForward, playerForward);
        const turnDirection = cross.y > 0 ? 1 : -1;
        motorcycle.rotation.y += bikeProps.turnSpeed * turnDirection * delta;
    }

    if (keys['Space'] && bikeData.onGround) {
        bikeData.verticalVelocity = bikeProps.jumpForce;
    }

    const deltaPos = bikeData.velocity.clone().multiplyScalar(delta);
    const bikeBox = new THREE.Box3().setFromObject(motorcycle);
    for (const c of buildingColliders) {
        if (bikeBox.intersectsBox(c)) {
            bikeData.velocity.negate().multiplyScalar(0.5);
            break;
        }
    }
    motorcycle.position.add(deltaPos);

    bikeData.verticalVelocity -= GRAVITY * delta;
    motorcycle.position.y += bikeData.verticalVelocity * delta;

    bikeData.onGround = false;
    const groundBox = new THREE.Box3().setFromObject(motorcycle);
    groundBox.min.y -= 0.5;
    
    let highestGroundY = -Infinity;
    for (const c of buildingColliders) {
        if(groundBox.intersectsBox(c)) {
            if (c.max.y > highestGroundY) {
                highestGroundY = c.max.y;
            }
        }
    }
    if (motorcycle.position.y < bikeProps.hoverHeight) {
        highestGroundY = Math.max(highestGroundY, bikeProps.hoverHeight);
    }
    
    if (motorcycle.position.y < highestGroundY) {
        motorcycle.position.y = highestGroundY;
        bikeData.verticalVelocity = 0;
        bikeData.onGround = true;
    }
    
    const driverPos = motorcycle.position.clone().add(new THREE.Vector3(0, GameWorld.player.height - 0.5, 0));
    playerObject.position.copy(driverPos);
}

function throwCarriedObject() {
    if (!player.carriedObject) return;

    const d = new THREE.Vector3();
    camera.getWorldDirection(d);
    
    player.carriedObject.userData.velocity = d.multiplyScalar(40);
    player.carriedObject.userData.isProjectile = true;
    scene.add(player.carriedObject);
    
    if (player.carriedObject.userData.type === 'glowing_orb') {
        collectibles.glowingOrbs.push(player.carriedObject);
    }
    
    player.carriedObject = null;
    player.weaponCooldown = 0.5;
    
    gunModels[player.currentWeaponIndex].visible = true;
}


function updateInteractions() {
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    if ((!controls.isLocked && !isTouchDevice) || player.state !== 'on_foot') {
        interactionPromptElement.style.display = 'none';
        return;
    }

    if (player.carriedObject) {
        interactionPromptElement.style.display = 'block';
        interactionPromptElement.textContent = `[F] to Throw ${player.carriedObject.userData.name || 'Object'}`;
        if (keys['KeyF']) {
            throwCarriedObject();
            keys['KeyF'] = false; // Consume the keypress
        }
        return;
    }

    let closestInteractable = null;
    let minDistance = Infinity;
    interactables.forEach(inter => {
        if (!inter.mesh.parent) return;
        const dist = playerObject.position.distanceTo(inter.mesh.position);
        if (dist < inter.radius && dist < minDistance) {
            minDistance = dist;
            closestInteractable = inter;
        }
    });
    if (closestInteractable) {
        const promptText = closestInteractable.getPrompt();
        interactionPromptElement.style.display = 'block';
        interactionPromptElement.textContent = promptText.startsWith("The spacecraft") ? promptText : `[F] ${promptText}`;
        if (keys['KeyF']) {
            closestInteractable.onInteract();
            keys['KeyF'] = false;
        }
    } else {
        interactionPromptElement.style.display = 'none';
    }
}

function enterSpacecraft() {
    if (player.fuelCells < 2 || player.state !== 'on_foot') return;
    
    player.state = 'entering_spacecraft';
    document.getElementById('doom-hud').style.display = 'none';
    document.getElementById('crosshair').style.display = 'none';
    document.getElementById('interaction-prompt').style.display = 'none';
    cockpitOverlayElement.style.display = 'block';
    spacecraft.visible = false;
    gunModels.forEach(g => g.visible = false);
    if(player.carriedObject) scene.remove(player.carriedObject);
    player.carriedObject = null;
    cockpitJoystick.visible = true;
    cockpitHexHUD.visible = true;
    playerObject.quaternion.copy(spacecraft.quaternion);
    spacecraft.userData.animationProgress = 0;
}

function enterMotorcycle() {
    if (player.state !== 'on_foot' || player.carriedObject) return;
    player.state = 'driving_motorcycle';
    motorcycle.visible = false; 
    gunModels.forEach(g => g.visible = false);
    const index = interactables.findIndex(i => i.mesh === motorcycle);
    if (index > -1) interactables.splice(index, 1);
    
    playerObject.rotation.y = motorcycle.rotation.y + Math.PI;
    camera.rotation.x = 0;
}

function exitMotorcycle() {
    if (player.state !== 'driving_motorcycle') return;
    player.state = 'on_foot';
    motorcycle.visible = true;
    gunModels[player.currentWeaponIndex].visible = true;
    const sideOffset = new THREE.Vector3(1, 0, 0).applyQuaternion(motorcycle.quaternion);
    playerObject.position.copy(motorcycle.position).add(sideOffset.multiplyScalar(3));
    playerObject.position.y = motorcycle.position.y;
    playerObject.rotation.y = motorcycle.rotation.y;
    camera.rotation.x = 0; 

    interactables.push({
        mesh: motorcycle, radius: 5, onInteract: enterMotorcycle,
        getPrompt: () => 'Drive Hoverbike'
    });
}

function pickUpObject(object) {
    if (player.carriedObject || player.state !== 'on_foot') return;
    player.carriedObject = object;
    object.userData.name = GameData.items[object.userData.key].name;
    gunModels[player.currentWeaponIndex].visible = false;
    
    const index = interactables.findIndex(i => i.mesh === object);
    if (index > -1) interactables.splice(index, 1);
    
    const orbIndex = collectibles.glowingOrbs.findIndex(o => o === object);
    if(orbIndex > -1) collectibles.glowingOrbs.splice(orbIndex, 1);
}

function updateCockpitSequence(delta) {
    if (!spacecraft) return;
    const data = spacecraft.userData;
    const animationDuration = 8.0;
    data.animationProgress += delta;
    const progress = Math.min(1.0, data.animationProgress / animationDuration);
    const takeoffSpeed = 50.0 * (progress * progress);
    spacecraft.position.y += takeoffSpeed * delta;
    playerObject.position.copy(spacecraft.position).add(new THREE.Vector3(0, GameWorld.player.height, 0));
    cockpitJoystick.rotation.x = 0.3 + Math.sin(clock.getElapsedTime() * 2) * 0.05;
    if (spacecraft.position.y > 250) {
        player.state = 'hyperspace';
        hyperspaceData.time = 0;
        starfield.visible = true;
    }
}

function updateHyperspace(delta) {
    hyperspaceData.time += delta;
    const fadeProgress = Math.min(1.0, hyperspaceData.time / hyperspaceData.fadeTime);
    
    const fromColor = new THREE.Color(GameWorld.levels[currentLevel].fogColor || 0x8899aa);
    const blackColor = new THREE.Color(0x000000);
    if (scene.fog) scene.fog.color.lerpColors(fromColor, blackColor, fadeProgress);
    scene.background.lerpColors(fromColor, blackColor, fadeProgress);
    
    const positions = starfield.geometry.attributes.position.array;
    for (let i = 0; i < positions.length; i += 3) {
        positions[i + 2] += delta * 400;
        if (positions[i + 2] > camera.near) {
            positions[i] = (Math.random() - 0.5) * 1000;
            positions[i+1] = (Math.random() - 0.5) * 1000;
            positions[i + 2] = -1000;
        }
    }
    starfield.geometry.attributes.position.needsUpdate = true;
    cockpitJoystick.rotation.x = 0.3 + Math.sin(clock.getElapsedTime() * 2) * 0.05;

    if (hyperspaceData.time >= hyperspaceData.duration) {
        const currentIndex = levelOrder.indexOf(currentLevel);
        const nextIndex = (currentIndex + 1) % levelOrder.length;
        const nextLevel = levelOrder[nextIndex];
        
        player.state = 'landing_sequence';
        hyperspaceData.time = 0; // Reset for fade-in
        loadLevel(nextLevel, false, true); // isLanding = true
    }
}

function updateLandingSequence(delta) {
    if (!spacecraft || !spacecraft.userData.targetLandPosition) {
        player.state = 'on_foot';
        return;
    }

    hyperspaceData.time += delta;

    const fadeProgress = Math.min(1.0, hyperspaceData.time / hyperspaceData.fadeTime);
    const toColor = new THREE.Color(GameWorld.levels[currentLevel].fogColor || 0x8899aa);
    const blackColor = new THREE.Color(0x000000);
    if (scene.fog) scene.fog.color.lerpColors(blackColor, toColor, fadeProgress);
    scene.background.lerpColors(blackColor, toColor, fadeProgress);
    starfield.visible = false;

    spacecraft.position.lerp(spacecraft.userData.targetLandPosition, 0.8 * delta);
    playerObject.position.copy(spacecraft.position).add(new THREE.Vector3(0, GameWorld.player.height, 0));
    playerObject.quaternion.copy(spacecraft.quaternion);
    cockpitJoystick.rotation.x = 0.3 + Math.sin(clock.getElapsedTime() * 2) * 0.05;

    if (spacecraft.position.distanceTo(spacecraft.userData.targetLandPosition) < 0.2) {
        player.state = 'on_foot';
        
        spacecraft.position.copy(spacecraft.userData.targetLandPosition);
        const exitOffset = new THREE.Vector3(5, -GameWorld.player.height, 0).applyQuaternion(spacecraft.quaternion);
        playerObject.position.copy(spacecraft.position).add(exitOffset);
        playerObject.position.y = GameWorld.player.height / 2;
        
        document.getElementById('doom-hud').style.display = 'grid';
        document.getElementById('crosshair').style.display = 'block';
        cockpitOverlayElement.style.display = 'none';
        cockpitJoystick.visible = false;
        cockpitHexHUD.visible = false;
        gunModels[player.currentWeaponIndex].visible = true;

        spacecraft.visible = true;
        spacecraft.userData.colliderBox = new THREE.Box3().setFromObject(spacecraft);
        buildingColliders.push(spacecraft.userData.colliderBox);
        interactables.push({
            mesh: spacecraft,
            radius: 12,
            onInteract: enterSpacecraft,
            getPrompt: () => (player.fuelCells >= 2 ? 'Launch Spacecraft' : 'The spacecraft needs two fuel cells to run.')
        });

        document.body.requestPointerLock();
    }
}
