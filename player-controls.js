/**
 * player-controls.js
 * Handles player input, controls, camera, and state changes (on_foot, hyperspace, etc.).
 * Manages UI menu toggling logic.
 */

const levelOrder = ['city', 'desert', 'volcanic', 'ice', 'toxic', 'crystal'];

// --- TOUCH & GAMEPAD CONTROLS STATE ---
const touchState = {}; // Keyed by touch identifier
let gamepad = null;

function setupControls() {
    const mapContainer = document.getElementById('map-container');
    const onMouseMove = (event) => {
        if (isPaused) return;
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        if (controls.isLocked === false) return;
        
        const movementX = event.movementX || 0;
        const movementY = event.movementY || 0;
        
        if (player.state === 'on_foot') {
            playerObject.rotation.y -= movementX * 0.002;
            camera.rotation.x -= movementY * 0.002;
            camera.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, camera.rotation.x));
        } else if (player.state === 'driving_motorcycle' && motorcycle) {
            motorcycle.rotation.y -= movementX * 0.002; // Steer the bike directly
            camera.rotation.x -= movementY * 0.002; // Allow looking up/down
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

        camera.fov += scrollDirection * zoomProps.step;
        camera.fov = Math.max(zoomProps.min, Math.min(zoomProps.max, camera.fov));
        camera.updateProjectionMatrix();
    };
    const onKeyDown = (event) => {
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
            controls.isLocked = true;
            isPaused = false;
            document.getElementById('options-menu').style.display = 'none';
            document.getElementById('inventory-menu').style.display = 'none';
            document.getElementById('blocker').style.display = 'none';
        } else {
            controls.isLocked = false;
            if (!isGameOver && !inventoryMenu.style.display.includes('flex') && !debugMenu.style.display.includes('flex')) {
                document.getElementById('options-menu').style.display = 'flex';
            }
        }
    });

    const onBlockerInteract = (event) => {
        if (event.target.id === 'options-button-intro' || event.target.id === 'options-button-gameover') {
            toggleOptionsMenu(true);
            return;
        }

        if (!hasInteracted) {
            if (backgroundMusic) backgroundMusic.play();
            hasInteracted = true;
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

    document.getElementById('fullscreen-button').addEventListener('click', () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
            });
        } else {
            document.exitFullscreen();
        }
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
    
    const sbs3dButton = document.getElementById('sbs-3d-button');
    sbs3dButton.addEventListener('click', () => {
        gameSettings.sbs3dEnabled = !gameSettings.sbs3dEnabled;
        sbs3dButton.textContent = `Side-by-Side 3D: ${gameSettings.sbs3dEnabled ? 'ON' : 'OFF'}`;
        onWindowResize(); 
    });
    
    const retroEffectButton = document.getElementById('retro-effect-button');
    retroEffectButton.addEventListener('click', () => {
        gameSettings.retroEffectEnabled = !gameSettings.retroEffectEnabled;
        retroEffectButton.textContent = `Retro Effect: ${gameSettings.retroEffectEnabled ? 'ON' : 'OFF'}`;
        document.getElementById('retro-overlay').classList.toggle('active', gameSettings.retroEffectEnabled);
    });

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
            if (itemKey === 'xray_goggles') {
                toggleGoggles();
                updateInventoryMenu();
            }
        }
    };
    inventoryMenu.addEventListener('click', handleInventoryInteraction);
    inventoryMenu.addEventListener('touchend', handleInventoryInteraction);
    document.getElementById('close-inventory').addEventListener('click', toggleInventoryMenu);
    document.getElementById('close-inventory').addEventListener('touchend', toggleInventoryMenu);

    const onTouchStart = (event) => {
        if (isGameOver || isPaused || !gameSettings.touchControlsEnabled) return;
        event.preventDefault();

        const hudHeight = document.getElementById('doom-hud').clientHeight;

        for (const touch of event.changedTouches) {
            if (touch.clientY > window.innerHeight - hudHeight) continue;
            
            const touchX = touch.clientX;
            const touchY = touch.clientY;
            const screenWidth = window.innerWidth;
            const zoneLeft = screenWidth * 0.3;
            const zoneRight = screenWidth * 0.7;

            let zone = '';
            if (touchX < zoneLeft) {
                zone = 'move';
            } else if (touchX > zoneRight) {
                zone = 'look';
            } else {
                zone = 'action';
            }
            
            touchState[touch.identifier] = {
                zone: zone,
                startX: touchX,
                startY: touchY,
                currentX: touchX,
                currentY: touchY,
            };
            
            if (zone === 'action') {
                const actionAreaHeight = window.innerHeight - hudHeight;
                if (touchY < actionAreaHeight / 2) {
                    keys['Space'] = true;
                } 
                else {
                    mouse.isDown = true;
                }
            }
        }
    };

    const onTouchMove = (event) => {
        if (isGameOver || isPaused || !gameSettings.touchControlsEnabled) return;
        event.preventDefault(); 
        
        for (const touch of event.changedTouches) {
            const state = touchState[touch.identifier];
            if (!state) continue;

            if (state.zone === 'move') {
                state.currentX = touch.clientX;
                state.currentY = touch.clientY;
                const dx = state.currentX - state.startX;
                const dy = state.currentY - state.startY;
                const deadZone = 20;

                keys['KeyW'] = dy < -deadZone;
                keys['KeyS'] = dy > deadZone;
                keys['KeyA'] = dx < -deadZone;
                keys['KeyD'] = dx > deadZone;
            } else if (state.zone === 'look') {
                state.currentX = touch.clientX;
                state.currentY = touch.clientY;
                const dx = state.currentX - state.startX;
                const dy = state.currentY - state.startY;
                const deadZone = 20;

                keys['ArrowUp'] = dy < -deadZone;
                keys['ArrowDown'] = dy > deadZone;
                keys['ArrowLeft'] = dx < -deadZone;
                keys['ArrowRight'] = dx > deadZone;
            }
        }
    };
    
    const onTouchEnd = (event) => {
        if (!gameSettings.touchControlsEnabled) return;

        for (const touch of event.changedTouches) {
            const state = touchState[touch.identifier];
            if (!state) continue;

            if (state.zone === 'move') {
                keys['KeyW'] = false; keys['KeyS'] = false; keys['KeyA'] = false; keys['KeyD'] = false;
            } else if (state.zone === 'look') {
                keys['ArrowUp'] = false; keys['ArrowDown'] = false; keys['ArrowLeft'] = false; keys['ArrowRight'] = false;
            } else if (state.zone === 'action') {
                keys['Space'] = false;
                mouse.isDown = false;
            }
            
            delete touchState[touch.identifier];
        }
    };

    if (isTouchDevice) {
        document.addEventListener('touchstart', onTouchStart, { passive: false });
        document.addEventListener('touchmove', onTouchMove, { passive: false });
        document.addEventListener('touchend', onTouchEnd, { passive: false });
        document.addEventListener('touchcancel', onTouchEnd, { passive: false });
    }

    controls = { isLocked: false }; document.addEventListener('mousemove', onMouseMove, false); document.addEventListener('keydown', onKeyDown); document.addEventListener('keyup', onKeyUp); document.addEventListener('wheel', onMouseWheel, { passive: false }); document.addEventListener('mousedown', () => { if(controls.isLocked) mouse.isDown = true; }); document.addEventListener('mouseup', () => mouse.isDown = false); document.addEventListener('click', () => { if (controls.isLocked && !isGameOver && !isPaused && player.state === 'on_foot' && !['Machine Gun', 'Plasma Gun'].includes(GameData.weapons[player.currentWeaponIndex].name) && !player.carriedObject) shoot(); });
    
    const inventoryButton = document.getElementById('inventory-button-hud');
    inventoryButton.addEventListener('click', toggleInventoryMenu);
    inventoryButton.addEventListener('touchstart', (e) => { e.preventDefault(); toggleInventoryMenu(); });

    const gogglesButton = document.getElementById('goggles-hud-container');
    gogglesButton.addEventListener('touchstart', (e) => {
        e.preventDefault();
        toggleGoggles();
        updateHUD();
    });

    const weaponPrevButton = document.getElementById('weapon-prev-hud');
    weaponPrevButton.addEventListener('touchstart', (e) => { e.preventDefault(); changeWeapon(-1); });
    const weaponNextButton = document.getElementById('weapon-next-hud');
    weaponNextButton.addEventListener('touchstart', (e) => { e.preventDefault(); changeWeapon(1); });

    const weaponDisplay = document.getElementById('weapon-display-container');
    const handleWeaponPress = (e) => {
        if (e.target.classList.contains('hud-button')) return;
        e.preventDefault();
        mouse.isDown = true;
    };
    const handleWeaponRelease = (e) => {
        if (e.target.classList.contains('hud-button')) return;
        e.preventDefault();
        mouse.isDown = false;
        const isTouchEvent = e.type.includes('touch');
        if (isTouchEvent && controls.isLocked && !isGameOver && !isPaused && player.state === 'on_foot' && !['Machine Gun', 'Plasma Gun'].includes(GameData.weapons[player.currentWeaponIndex].name) && !player.carriedObject) {
            shoot();
        }
    };
    weaponDisplay.addEventListener('mousedown', handleWeaponPress);
    weaponDisplay.addEventListener('touchstart', handleWeaponPress);
    weaponDisplay.addEventListener('mouseup', handleWeaponRelease);
    weaponDisplay.addEventListener('touchend', handleWeaponRelease);
    weaponDisplay.addEventListener('mouseleave', handleWeaponRelease);
    weaponDisplay.addEventListener('touchcancel', handleWeaponRelease);
    weaponDisplay.addEventListener('click', (e) => {
        e.stopPropagation();
    });

    const interactionPromptElement = document.getElementById('interaction-prompt');
    const handleInteractionPromptTouch = (e) => {
        e.preventDefault();
        keys['KeyF'] = true;
        fKeyPressed = true;
        setTimeout(() => { keys['KeyF'] = false; fKeyPressed = false; }, 100);
    };
    interactionPromptElement.addEventListener('touchstart', handleInteractionPromptTouch);

    const showTouchControls = () => { document.getElementById('touch-controls-menu').style.display = 'flex'; };
    document.getElementById('show-touch-controls-intro').addEventListener('click', showTouchControls);
    document.getElementById('show-touch-controls-intro').addEventListener('touchend', showTouchControls);
    document.getElementById('show-touch-controls-options').addEventListener('click', showTouchControls);
    document.getElementById('show-touch-controls-options').addEventListener('touchend', showTouchControls);

    const closeTouchControls = () => { document.getElementById('touch-controls-menu').style.display = 'none'; };
    document.getElementById('close-touch-controls').addEventListener('click', closeTouchControls);
    document.getElementById('close-touch-controls').addEventListener('touchend', closeTouchControls);
    
    const toggleTouchButton = document.getElementById('toggle-touch-button');
    if (toggleTouchButton) {
        toggleTouchButton.addEventListener('click', toggleTouchControlsEnabled);
    }
    
    window.addEventListener('gamepadconnected', (event) => {
        console.log('Gamepad connected:', event.gamepad.id);
        gamepad = event.gamepad;
    });

    window.addEventListener('gamepaddisconnected', () => {
        console.log('Gamepad disconnected.');
        gamepad = null;
    });
}

function updateGamepadControls(delta) {
    if (!gamepad) return;

    const currentGamepad = navigator.getGamepads()[gamepad.index];
    if (!currentGamepad) return;

    const deadzone = 0.2;

    const lookX = currentGamepad.axes[2];
    const lookY = currentGamepad.axes[3];

    if (player.state === 'on_foot') {
        if (Math.abs(lookX) > deadzone) {
            playerObject.rotation.y -= lookX * 0.04;
        }
        if (Math.abs(lookY) > deadzone) {
            camera.rotation.x -= lookY * 0.04;
            camera.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, camera.rotation.x));
        }
    } else if (player.state === 'driving_motorcycle' && motorcycle) {
        if (Math.abs(lookX) > deadzone) {
            motorcycle.rotation.y -= lookX * 0.04;
        }
        if (Math.abs(lookY) > deadzone) {
            camera.rotation.x -= lookY * 0.04;
            camera.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, camera.rotation.x));
        }
    }

    const moveX = currentGamepad.axes[0];
    const moveY = currentGamepad.axes[1];
    keys['KeyA'] = moveX < -deadzone;
    keys['KeyD'] = moveX > deadzone;
    keys['KeyW'] = moveY < -deadzone;
    keys['KeyS'] = moveY > deadzone;

    keys['Space'] = currentGamepad.buttons[0].pressed;

    const weaponData = GameData.weapons[player.currentWeaponIndex];
    if (currentGamepad.buttons[7].pressed) {
        if (['Machine Gun', 'Plasma Gun'].includes(weaponData.name)) {
            mouse.isDown = true;
        } else if (!mouse.isDown) {
            shoot();
        }
        mouse.isDown = true;
    } else {
        mouse.isDown = false;
    }

    if (currentGamepad.buttons[2].pressed && !fKeyPressed) {
        keys['KeyF'] = true;
        fKeyPressed = true;
    } else if (!currentGamepad.buttons[2].pressed) {
        keys['KeyF'] = false;
        fKeyPressed = false;
    }
    
    if (currentGamepad.buttons[4].pressed) changeWeapon(-1);
    if (currentGamepad.buttons[5].pressed) changeWeapon(1);
}

function toggleTouchControlsEnabled() {
    gameSettings.touchControlsEnabled = !gameSettings.touchControlsEnabled;
    const button = document.getElementById('toggle-touch-button');
    if (button) {
        button.textContent = `Touch Controls: ${gameSettings.touchControlsEnabled ? 'ON' : 'OFF'}`;
    }
    console.log(`Touch controls set to: ${gameSettings.touchControlsEnabled}`);
}

function toggleGoggles() {
    if (!player.hasXRayGoggles) return;

    if (player.xrayGogglesActive) {
        player.xrayGogglesActive = false;
    } else {
        if (player.gogglesCooldown <= 0) {
            player.xrayGogglesActive = true;
        }
    }
    toggleXRayEffect(player.xrayGogglesActive);
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
        isPaused = true;
        inventoryMenu.style.display = 'flex';
        document.exitPointerLock();
    } else {
        inventoryMenu.style.display = 'none';
        isPaused = false;
        if (!isGameOver && !document.getElementById('options-menu').style.display.includes('flex')) {
            document.body.requestPointerLock();
        }
    }
}

function setActiveWeapon(index) {
    if (player.currentWeaponIndex === index || player.carriedObject) return;
    
    const oldWeaponData = GameData.weapons[player.currentWeaponIndex];
    if (oldWeaponData && oldWeaponData.name === 'Sniper Rifle') {
        camera.fov = oldWeaponData.properties.zoom.default;
        camera.updateProjectionMatrix();
    }

    const oldSprite = document.getElementById(`weapon-sprite-${player.currentWeaponIndex}`);
    if (oldSprite) {
        oldSprite.classList.remove('weapon-active');
        oldSprite.style.display = 'none';
    }
    
    gunModels[player.currentWeaponIndex].visible = false;
    player.currentWeaponIndex = index;
    
    const newSprite = document.getElementById(`weapon-sprite-${index}`);
    if (newSprite) {
        newSprite.classList.add('weapon-active');
        newSprite.style.display = 'block';
    }
    
    gunModels[index].visible = true;
    updateHUD();
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
    const isMovingByTouch = Object.keys(touchState).length > 0;
    if (player.state !== 'on_foot' || isGameOver || (!controls.isLocked && !isMovingByTouch && !gamepad)) {
        player.velocity.x *= GameWorld.player.damping;
        player.velocity.z *= GameWorld.player.damping;
        return;
    }

    if (player.weaponCooldown > 0) player.weaponCooldown -= delta;
    player.velocity.x *= GameWorld.player.damping;
    player.velocity.z *= GameWorld.player.damping;
    player.velocity.y -= GRAVITY * delta;

    if (player.hasXRayGoggles) {
        if (player.gogglesCooldown > 0) {
            player.gogglesCooldown -= delta;
            if (player.gogglesCooldown <= 0) {
                player.gogglesCooldown = 0;
                player.gogglesBattery = player.maxGogglesBattery;
            }
        }
        if (player.xrayGogglesActive) {
            player.gogglesBattery -= delta;
            if (player.gogglesBattery <= 0) {
                player.gogglesBattery = 0;
                player.xrayGogglesActive = false;
                toggleXRayEffect(false);
                player.gogglesCooldown = 30; 
            }
        }
    }


    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(playerObject.quaternion);
    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(playerObject.quaternion);
    const moveVector = new THREE.Vector3();
    if (keys['KeyW']) moveVector.add(forward);
    if (keys['KeyS']) moveVector.sub(forward);
    if (keys['KeyA']) moveVector.sub(right);
    if (keys['KeyD']) moveVector.add(right);

    // --- MODIFICATION: Added arrow key camera controls ---
    const lookSpeed = 1.5; // Radians per second
    if (keys['ArrowLeft']) playerObject.rotation.y += lookSpeed * delta;
    if (keys['ArrowRight']) playerObject.rotation.y -= lookSpeed * delta;
    if (keys['ArrowUp']) {
        camera.rotation.x += lookSpeed * delta;
        camera.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, camera.rotation.x));
    }
    if (keys['ArrowDown']) {
        camera.rotation.x -= lookSpeed * delta;
        camera.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, camera.rotation.x));
    }
    // --- END MODIFICATION ---

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

    playerBox.setFromCenterAndSize(playerObject.position.clone().add(new THREE.Vector3(deltaPos.x, playerHeight/2, 0)), playerSize);
    for (const c of buildingColliders) {
        if(c.userData && c.userData.colliderType === 'mesh') continue;
        if(playerBox.intersectsBox(c)) {
            deltaPos.x = (deltaPos.x > 0 ? c.min.x - playerBox.max.x : c.max.x - playerBox.min.x) - 0.001 * Math.sign(deltaPos.x);
            player.velocity.x = 0; break;
        }
    }
    playerObject.position.x += deltaPos.x;
    
    playerBox.setFromCenterAndSize(playerObject.position.clone().add(new THREE.Vector3(0, playerHeight/2, deltaPos.z)), playerSize);
    for (const c of buildingColliders) {
         if(c.userData && c.userData.colliderType === 'mesh') continue;
         if(playerBox.intersectsBox(c)) {
            deltaPos.z = (deltaPos.z > 0 ? c.min.z - playerBox.max.z : c.max.z - playerBox.min.z) - 0.001 * Math.sign(deltaPos.z);
            player.velocity.z = 0; break;
        }
    }
    playerObject.position.z += deltaPos.z;
    
    player.canJump = false;
    let highestGroundY = -Infinity;

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
    
    highestGroundY = Math.max(0, highestGroundY);

    const playerFeetY = playerObject.position.y - playerHeight / 2;
    if (playerFeetY + deltaPos.y < highestGroundY) {
        player.velocity.y = 0;
        playerObject.position.y = highestGroundY + playerHeight / 2;
        player.canJump = true;
    } else {
        playerObject.position.y += deltaPos.y;
    }

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
            lastAttackerPosition = alien.position.clone();
        }
    }
    
    player.isSafeInBunker = false;
    player.isSafeInShelter = false;

    for (const veg of vegetation) {
        const dist = playerObject.position.distanceTo(veg.position);
        if (veg.userData.isPoison && dist < 1.5) {
            health -= 15 * delta;
            lastAttackerPosition = veg.position.clone();
        }
        if (veg.userData.isShelter) {
            const isTree = veg.userData.isTree || (veg.children[0]?.geometry instanceof THREE.CylinderGeometry && veg.children[0].geometry.parameters.height > 20);
            const shelterRadius = isTree ? 3.0 : 1.0;
            if (dist < shelterRadius) {
                player.isSafeInShelter = true;
            }
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

    // Movement is based on W/S keys
    bikeData.velocity.multiplyScalar(bikeProps.damping);
    
    const bikeForward = new THREE.Vector3(0, 0, 1).applyQuaternion(motorcycle.quaternion);
    
    if(keys['KeyW']) bikeData.velocity.add(bikeForward.clone().multiplyScalar(bikeProps.speed * delta));
    if(keys['KeyS']) bikeData.velocity.sub(bikeForward.clone().multiplyScalar(bikeProps.speed * 0.5 * delta));
    
    if (keys['Space'] && bikeData.onGround) {
        bikeData.verticalVelocity = bikeProps.jumpForce;
    }

    // Physics
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
    
    // Lock the player to the bike's position and rotation, maintaining the forward-facing offset
    const driverPos = motorcycle.position.clone().add(new THREE.Vector3(0, GameWorld.player.height - 0.5, 0));
    playerObject.position.copy(driverPos);
    playerObject.quaternion.setFromEuler(new THREE.Euler(0, motorcycle.rotation.y + Math.PI, 0));
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
    const interactionPromptElement = document.getElementById('interaction-prompt');

    if ((!controls.isLocked && !isTouchDevice && !gamepad) || player.state !== 'on_foot') {
        interactionPromptElement.style.display = 'none';
        return;
    }

    if (player.carriedObject) {
        interactionPromptElement.style.display = 'block';
        const prompt = isTouchDevice 
            ? `Throw ${player.carriedObject.userData.name || 'Object'}`
            : `[F] to Throw ${player.carriedObject.userData.name || 'Object'}`;
        interactionPromptElement.textContent = prompt;
        if (keys['KeyF']) {
            throwCarriedObject();
            keys['KeyF'] = false;
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
        let promptText = closestInteractable.getPrompt();
        if (!isTouchDevice) {
            if (!promptText.startsWith("The spacecraft")) {
                promptText = `[F] ${promptText}`;
            }
        }
        interactionPromptElement.style.display = 'block';
        interactionPromptElement.textContent = promptText;
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
    gunModels.forEach(g => g.visible = false);
    const index = interactables.findIndex(i => i.mesh === motorcycle);
    if (index > -1) interactables.splice(index, 1);
    
    // Align player rotation with bike's front
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
        hyperspaceData.time = 0;
        loadLevel(nextLevel, false, true);
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
