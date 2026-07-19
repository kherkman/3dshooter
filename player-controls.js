/**
 * player-controls.js
 * Handles player input, controls, camera, and state changes (on_foot, hyperspace, etc.).
 * Manages UI menu toggling logic.
 */

// --- TOUCH & GAMEPAD CONTROLS STATE ---
const touchState = {}; // Keyed by touch identifier
let gamepad = null;
let hasRequestedDeviceOrientationPermission = false; // Global variable for device motion permission

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
            // Block Pointer Lock request on spacebar if the intro is currently active
            if (typeof isIntroActive !== 'undefined' && isIntroActive) {
                return;
            }
            if (!hasInteracted) { 
                if(backgroundMusic) backgroundMusic.play(); 
                hasInteracted = true; 
            }
            document.body.requestPointerLock();
        }
        if (event.code === 'KeyO' || event.key === 'Escape') { toggleOptionsMenu(); return; }
        if (event.code === 'KeyJ') { toggleDebugMenu(); return; }
        if (debugMenu && debugMenu.style && debugMenu.style.display.includes('flex') && event.code === 'KeyH') {
            player.fuelCells += 2;
            if (!player.hasJetpack) {
                player.hasJetpack = true;
                player.jetpackFuel = player.maxJetpackFuel;
                const jetpackContainer = document.getElementById('jetpack-hud-container');
                if (jetpackContainer) jetpackContainer.style.display = 'flex';
            }
            if (!player.hasXRayGoggles) {
                player.hasXRayGoggles = true;
            }
            health = 500;
            for(let i = 0; i < GameData.weapons.length; i++) {
                if (!player.unlockedWeapons[i]) {
                    player.unlockedWeapons[i] = true;
                    const weaponSprite = document.getElementById(`weapon-sprite-${i}`);
                    if (weaponSprite) weaponSprite.style.display = 'block';
                }
            }
            player.ammo.shotgun += 50; player.ammo.machinegun += 400; player.ammo.rocket += 20; player.ammo.plasma += 200; player.ammo.grenade += 10; player.ammo.sniper += 20; player.ammo.blackhole += 5;
            console.log("DEBUG: Health, Weapons, Ammo, and Fuel Cells added.");
            updateHUD();
            return;
        }
        if (event.code === 'KeyR') { toggleInventoryMenu(); return; }
        if (isPaused) return;
        
        if (event.code === 'KeyB' && !keys['KeyB']) { // only on first press
            keys['KeyB'] = true; 
            if (player.state === 'on_foot' && !['Machine Gun', 'Plasma Gun'].includes(GameData.weapons[player.currentWeaponIndex].name) && !player.carriedObject) {
                shoot();
            }
        }

        if (event.code === 'KeyF') {
            if (player.state === 'driving_motorcycle') exitMotorcycle();
            else if (!fKeyPressed) { keys[event.code] = true; fKeyPressed = true; } 
        } else { 
            keys[event.code] = true; 
        }
        if(player.state === 'on_foot' && (event.code === 'KeyQ' || event.code === 'KeyE')) changeWeapon(event.code === 'KeyE' ? 1 : -1);
        if(event.code === 'Tab') { 
            event.preventDefault(); 
            if (mapContainer) mapContainer.style.display = 'flex'; 
        }
    };
    const onKeyUp = (event) => {
        keys[event.code] = false;
        if(event.code === 'Tab') {
            if (mapContainer) mapContainer.style.display = 'none';
        }
        if(event.code === 'KeyF') fKeyPressed = false;
        if(event.code === 'KeyB') keys['KeyB'] = false;
    };
    
    document.addEventListener('pointerlockchange', () => {
        if (document.pointerLockElement === document.body) {
            controls.isLocked = true;
            if (typeof isIntroActive !== 'undefined' && isIntroActive) {
                isPaused = true;
            } else {
                isPaused = false;
            }
            
            const optionsMenu = document.getElementById('options-menu');
            const inventoryMenuEl = document.getElementById('inventory-menu');
            const blocker = document.getElementById('blocker');
            
            if (optionsMenu) optionsMenu.style.display = 'none';
            if (inventoryMenuEl) inventoryMenuEl.style.display = 'none';
            if (blocker && (!isIntroActive)) blocker.style.display = 'none';
        } else {
            controls.isLocked = false;
            
            const hasOpenInventory = inventoryMenu && inventoryMenu.style && inventoryMenu.style.display.includes('flex');
            const hasOpenDebug = debugMenu && debugMenu.style && debugMenu.style.display.includes('flex');
            
            if (!isGameOver && !hasOpenInventory && !hasOpenDebug) {
                const optionsMenu = document.getElementById('options-menu');
                if (optionsMenu) optionsMenu.style.display = 'flex';
                isPaused = true; // Pause game when Pointer Lock is lost (e.g. Esc is pressed)
            }
        }
    });

    const onBlockerInteract = (event) => {
        if (event.target.id === 'options-button-intro' || event.target.id === 'options-button-gameover') {
            toggleOptionsMenu(true);
            return;
        }
        if (event.target.id === 'show-touch-controls-intro') {
            const touchMenu = document.getElementById('touch-controls-menu');
            if (touchMenu) touchMenu.style.display = 'flex';
            return;
        }

        if (!hasInteracted) {
            hasInteracted = true;
            document.documentElement.requestFullscreen().catch(err => {
                console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
            });

            // Request device orientation/motion permission (iOS 13+)
            if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function' && !hasRequestedDeviceOrientationPermission) {
                DeviceOrientationEvent.requestPermission()
                    .then(permissionState => {
                        if (permissionState === 'granted') {
                            console.log('Device motion/orientation permission granted.');
                        } else {
                            console.warn('Device motion/orientation permission denied.');
                        }
                        hasRequestedDeviceOrientationPermission = true;
                    })
                    .catch(console.error);
            }
        }

        if (isGameOver) {
            restartGame();
        } else {
            if (typeof isIntroActive !== 'undefined' && isIntroActive) {
                return; // Let main.js stepped reveal logic handle it instead
            }
            document.body.requestPointerLock();
            // Start the actual level music when the blocker is dismissed
            switchMusicToLevel(currentLevel);
        }
    };
    
    const blockerEl = document.getElementById('blocker');
    if (blockerEl) {
        blockerEl.addEventListener('click', (e) => onBlockerInteract(e));
        blockerEl.addEventListener('touchend', (e) => {
            // Allow touch events on buttons within the blocker overlay to be processed
            onBlockerInteract(e);
        });
    }

    const closeIntroButton = document.getElementById('close-intro');
    const closeIntroHandler = (e) => {
        e.stopPropagation();
        const blocker = document.getElementById('blocker');
        if (blocker) blocker.style.display = 'none';
        isIntroActive = false;
        isPaused = false;
        document.body.requestPointerLock();
        switchMusicToLevel(currentLevel);
    };
    if (closeIntroButton) {
        closeIntroButton.addEventListener('click', closeIntroHandler);
        closeIntroButton.addEventListener('touchend', closeIntroHandler);
    }

    const closeOptions = () => toggleOptionsMenu(false);
    const closeOptionsBtn = document.getElementById('close-options');
    if (closeOptionsBtn) {
        closeOptionsBtn.addEventListener('click', closeOptions);
        closeOptionsBtn.addEventListener('touchend', closeOptions);
    }

    const restartFromOptions = () => { isPaused = false; restartGame(); };
    const restartBtnOptions = document.getElementById('restart-button-options');
    if (restartBtnOptions) {
        restartBtnOptions.addEventListener('click', restartFromOptions);
        restartBtnOptions.addEventListener('touchend', restartFromOptions);
    }

    const fullscreenBtn = document.getElementById('fullscreen-button');
    if (fullscreenBtn) {
        fullscreenBtn.addEventListener('click', () => {
            if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen().catch(err => {
                    console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
                });
            } else {
                document.exitFullscreen();
            }
            toggleOptionsMenu(false);
        });
        fullscreenBtn.addEventListener('touchend', (e) => {
            e.preventDefault(); 
            if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen().catch(err => {
                    console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
                });
            } else {
                document.exitFullscreen();
            }
            toggleOptionsMenu(false);
        });
    }
    
    document.addEventListener('fullscreenchange', () => {
        if (typeof onWindowResize === 'function') {
            onWindowResize();
        }
        const optionsMenu = document.getElementById('options-menu');
        const hasOpenOptions = optionsMenu && optionsMenu.style.display.includes('flex');
        if (!document.fullscreenElement && !isPaused && !isGameOver && !hasOpenOptions && (!isIntroActive)) {
            document.body.requestPointerLock();
        }
    });

    const sfxSlider = document.getElementById('sfx-volume'); 
    if (sfxSlider) {
        sfxSlider.value = gameSettings.sfxVolume; 
        sfxSlider.addEventListener('input', (e) => { gameSettings.sfxVolume = parseFloat(e.target.value); });
    }
    const musicSlider = document.getElementById('music-volume'); 
    if (musicSlider) {
        musicSlider.value = gameSettings.musicVolume; 
        musicSlider.addEventListener('input', (e) => { gameSettings.musicVolume = parseFloat(e.target.value); if(backgroundMusic) backgroundMusic.setVolume(gameSettings.musicVolume); });
    }
    
    const sbsSeparationSlider = document.getElementById('sbs-separation');
    if (sbsSeparationSlider) {
        sbsSeparationSlider.value = gameSettings.sbsEyeSep;
        sbsSeparationSlider.addEventListener('input', (e) => {
            gameSettings.sbsEyeSep = parseFloat(e.target.value);
        });
    }

    const sbs3dButton = document.getElementById('sbs-3d-button');
    if (sbs3dButton) {
        sbs3dButton.addEventListener('click', () => {
            gameSettings.sbs3dEnabled = !gameSettings.sbs3dEnabled;
            sbs3dButton.textContent = `Side-by-Side 3D: ${gameSettings.sbs3dEnabled ? 'ON' : 'OFF'}`;
            onWindowResize(); 
        });
        sbs3dButton.addEventListener('touchend', (e) => {
            e.preventDefault();
            gameSettings.sbs3dEnabled = !gameSettings.sbs3dEnabled;
            sbs3dButton.textContent = `Side-by-Side 3D: ${gameSettings.sbs3dEnabled ? 'ON' : 'OFF'}`;
            onWindowResize(); 
        });
    }
    
    const retroEffectButton = document.getElementById('retro-effect-button');
    if (retroEffectButton) {
        retroEffectButton.addEventListener('click', () => {
            gameSettings.retroEffectEnabled = !gameSettings.retroEffectEnabled;
            retroEffectButton.textContent = `Retro Effect: ${gameSettings.retroEffectEnabled ? 'ON' : 'OFF'}`;
            const retroOverlay = document.getElementById('retro-overlay');
            if (retroOverlay) retroOverlay.classList.toggle('active', gameSettings.retroEffectEnabled);
        });
        retroEffectButton.addEventListener('touchend', (e) => {
            e.preventDefault();
            gameSettings.retroEffectEnabled = !gameSettings.retroEffectEnabled;
            retroEffectButton.textContent = `Retro Effect: ${gameSettings.retroEffectEnabled ? 'ON' : 'OFF'}`;
            const retroOverlay = document.getElementById('retro-overlay');
            if (retroOverlay) retroOverlay.classList.toggle('active', gameSettings.retroEffectEnabled);
        });
    }

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
    if (inventoryMenu) {
        inventoryMenu.addEventListener('click', handleInventoryInteraction);
        inventoryMenu.addEventListener('touchend', handleInventoryInteraction);
    }
    const closeInventoryBtn = document.getElementById('close-inventory');
    if (closeInventoryBtn) {
        closeInventoryBtn.addEventListener('click', toggleInventoryMenu);
        closeInventoryBtn.addEventListener('touchend', toggleInventoryMenu);
    }

    // Link the "Options" button inside the Inventory Window to toggle menu views
    const optionsBtnInv = document.getElementById('options-button-inventory');
    if (optionsBtnInv) {
        const openOptionsFromInv = (e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleInventoryMenu(); // Close inventory view
            toggleOptionsMenu(true); // Bring up options view
        };
        optionsBtnInv.addEventListener('click', openOptionsFromInv);
        optionsBtnInv.addEventListener('touchend', openOptionsFromInv);
    }

    const onTouchStart = (event) => {
        if (isGameOver || isPaused || !gameSettings.touchControlsEnabled) return;
        event.preventDefault();

        const doomHud = document.getElementById('doom-hud');
        const hudHeight = doomHud ? doomHud.clientHeight : 120;

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
                    // This area simulates a 'b' key press for shooting
                    if (!keys['KeyB']) {
                        keys['KeyB'] = true;
                        if (player.state === 'on_foot' && !['Machine Gun', 'Plasma Gun'].includes(GameData.weapons[player.currentWeaponIndex].name) && !player.carriedObject) {
                           shoot();
                        }
                    }
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

            state.currentX = touch.clientX;
            state.currentY = touch.clientY;
            
            // Touch-and-drag look is always active in touch mode
            if (state.zone === 'look') { 
                const dx = state.currentX - state.startX;
                const dy = state.currentY - state.startY;
                const deadZone = 20;

                keys['ArrowLeft'] = dx < -deadZone;
                keys['ArrowRight'] = dx > deadZone;
                keys['ArrowUp'] = dy < -deadZone;
                keys['ArrowDown'] = dy > deadZone;
            }
        }
    };
    
    const onTouchEnd = (event) => {
        if (!gameSettings.touchControlsEnabled) return;

        for (const touch of event.changedTouches) {
            const state = touchState[touch.identifier];
            if (!state) continue;
            
            if (state.zone === 'look') {
                keys['ArrowUp'] = false; keys['ArrowDown'] = false; keys['ArrowLeft'] = false; keys['ArrowRight'] = false;
            } else if (state.zone === 'action') {
                keys['Space'] = false;
                keys['KeyB'] = false;
            }
            
            delete touchState[touch.identifier];
        }
    };

    if (isTouchDevice) {
        document.addEventListener('touchstart', onTouchStart, { passive: false });
        document.addEventListener('touchmove', onTouchMove, { passive: false });
        document.addEventListener('touchend', onTouchEnd, { passive: false });
        document.addEventListener('touchcancel', onTouchEnd, { passive: false });

        // Add device motion listener
        window.addEventListener('devicemotion', onDeviceMotion, false);
    }

    controls = { isLocked: false }; 
    document.addEventListener('mousemove', onMouseMove, false); 
    document.addEventListener('keydown', onKeyDown); 
    document.addEventListener('keyup', onKeyUp); 
    document.addEventListener('wheel', onMouseWheel, { passive: false }); 
    document.addEventListener('mousedown', () => { if(controls.isLocked) mouse.isDown = true; }); 
    document.addEventListener('mouseup', () => mouse.isDown = false); 
    document.addEventListener('click', () => { if (controls.isLocked && !isGameOver && !isPaused && player.state === 'on_foot' && !['Machine Gun', 'Plasma Gun'].includes(GameData.weapons[player.currentWeaponIndex].name) && !player.carriedObject) shoot(); });
    
    const inventoryButton = document.getElementById('inventory-button-hud');
    if (inventoryButton) {
        inventoryButton.addEventListener('click', toggleInventoryMenu);
        inventoryButton.addEventListener('touchstart', (e) => { e.preventDefault(); toggleInventoryMenu(); });
    }

    const gogglesButton = document.getElementById('goggles-hud-container');
    if (gogglesButton) {
        gogglesButton.addEventListener('touchstart', (e) => {
            e.preventDefault();
            toggleGoggles();
            updateHUD();
        });
    }

    const weaponPrevButton = document.getElementById('weapon-prev-hud');
    if (weaponPrevButton) {
        weaponPrevButton.addEventListener('touchstart', (e) => { e.preventDefault(); changeWeapon(-1); });
    }
    const weaponNextButton = document.getElementById('weapon-next-hud');
    if (weaponNextButton) {
        weaponNextButton.addEventListener('touchstart', (e) => { e.preventDefault(); changeWeapon(1); });
    }

    const weaponDisplay = document.getElementById('weapon-display-container');
    if (weaponDisplay) {
        const handleWeaponPress = (e) => {
            if (e.target.classList.contains('hud-button')) return;
            e.preventDefault();
            if (e.type.includes('mouse')) {
                mouse.isDown = true;
            } else if (e.type.includes('touch')) {
                if (!keys['KeyB']) {
                    keys['KeyB'] = true;
                    if (player.state === 'on_foot' && !['Machine Gun', 'Plasma Gun'].includes(GameData.weapons[player.currentWeaponIndex].name) && !player.carriedObject) {
                        shoot();
                    }
                }
            }
        };
        const handleWeaponRelease = (e) => {
            if (e.target.classList.contains('hud-button')) return;
            e.preventDefault();
            if (e.type.includes('mouse')) {
                mouse.isDown = false;
            } else if (e.type.includes('touch')) {
                keys['KeyB'] = false;
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
    }

    const interactionPromptElement = document.getElementById('interaction-prompt');
    if (interactionPromptElement) {
        const handleInteractionPromptTouch = (e) => {
            e.preventDefault();
            keys['KeyF'] = true;
            fKeyPressed = true;
            setTimeout(() => { keys['KeyF'] = false; fKeyPressed = false; }, 100);
        };
        interactionPromptElement.addEventListener('touchstart', handleInteractionPromptTouch);
    }

    const showTouchControls = () => { 
        const touchMenu = document.getElementById('touch-controls-menu');
        if (touchMenu) touchMenu.style.display = 'flex'; 
    };
    
    const showTouchControlsIntro = document.getElementById('show-touch-controls-intro');
    if (showTouchControlsIntro) {
        showTouchControlsIntro.addEventListener('click', showTouchControls);
        showTouchControlsIntro.addEventListener('touchend', showTouchControls);
    }
    const showTouchControlsOptions = document.getElementById('show-touch-controls-options');
    if (showTouchControlsOptions) {
        showTouchControlsOptions.addEventListener('click', showTouchControls);
        showTouchControlsOptions.addEventListener('touchend', showTouchControls);
    }

    const closeTouchControls = () => { 
        const touchMenu = document.getElementById('touch-controls-menu');
        if (touchMenu) touchMenu.style.display = 'none'; 
    };
    const closeTouchControlsBtn = document.getElementById('close-touch-controls');
    if (closeTouchControlsBtn) {
        closeTouchControlsBtn.addEventListener('click', closeTouchControls);
        closeTouchControlsBtn.addEventListener('touchend', closeTouchControls);
    }
    
    const toggleTouchButton = document.getElementById('toggle-touch-button');
    if (toggleTouchButton) {
        toggleTouchButton.addEventListener('click', toggleTouchControlsEnabled);
        toggleTouchButton.addEventListener('touchend', (e) => { e.preventDefault(); toggleTouchControlsEnabled(); });
    }

    // Toggle button for Device Motion (Gyro) Look
    const toggleTouchLookButton = document.getElementById('toggle-touch-look-button');
    if (toggleTouchLookButton) {
        if (typeof gameSettings.gyroLookEnabled === 'undefined') {
            gameSettings.gyroLookEnabled = false; 
        }
        toggleTouchLookButton.addEventListener('click', toggleTouchLookEnabled);
        toggleTouchLookButton.addEventListener('touchend', (e) => { e.preventDefault(); toggleTouchLookEnabled(); });
        toggleTouchLookButton.textContent = `Motion Look: ${gameSettings.gyroLookEnabled ? 'ON' : 'OFF'}`;
    }
    
    const exitVehicleButton = document.getElementById('exit-vehicle-button');
    if (exitVehicleButton) {
        exitVehicleButton.addEventListener('click', exitMotorcycle);
        exitVehicleButton.addEventListener('touchstart', (e) => {
            e.preventDefault();
            exitMotorcycle();
        });
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

// Device motion handling adapted for horizontal/vertical landscape coordinates
function onDeviceMotion(event) {
    // Only apply if gyroLookEnabled is true and game is active
    if (!gameSettings.gyroLookEnabled || isGameOver || isPaused || !controls.isLocked || !event.rotationRate) return;

    const rotationRate = event.rotationRate;
    const sens = 0.005; // Sensitivity scale factor
    const deadZone = 0.1; // Filter out minor natural device tremors

    // Swapped Axes for Landscape Orientation:
    // rotationRate.beta (rotation around physical X-axis, now pointing vertically) = Yaw (left/right)
    // rotationRate.gamma (rotation around physical Y-axis, now pointing horizontally) = Pitch (up/down)
    const yawRate = rotationRate.beta;
    const pitchRate = rotationRate.gamma;

    if (Math.abs(yawRate) > deadZone) {
        playerObject.rotation.y += yawRate * sens;
    }

    if (Math.abs(pitchRate) > deadZone) {
        camera.rotation.x += pitchRate * sens;
        camera.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, camera.rotation.x));
    }
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

function toggleTouchLookEnabled() {
    gameSettings.gyroLookEnabled = !gameSettings.gyroLookEnabled;
    const button = document.getElementById('toggle-touch-look-button');
    if (button) {
        button.textContent = `Motion Look: ${gameSettings.gyroLookEnabled ? 'ON' : 'OFF'}`;
    }
    console.log(`Gyro motion look set to: ${gameSettings.gyroLookEnabled}`);
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
    const isCurrentlyOpen = optionsMenu && optionsMenu.style.display.includes('flex');
    const shouldBeOpen = forceOpen !== null ? forceOpen : !isCurrentlyOpen;

    if (shouldBeOpen) {
        document.exitPointerLock();
        if (optionsMenu) optionsMenu.style.display = 'flex';
        isPaused = true;
    } else {
        if (optionsMenu) optionsMenu.style.display = 'none';
        
        const hasOpenInventory = inventoryMenu && inventoryMenu.style && inventoryMenu.style.display.includes('flex');
        const hasOpenDebug = debugMenu && debugMenu.style && debugMenu.style.display.includes('flex');
        
        if (!hasOpenInventory && !hasOpenDebug && !isGameOver) {
            if (typeof isIntroActive !== 'undefined' && isIntroActive) {
                isPaused = true;
            } else {
                document.body.requestPointerLock();
                isPaused = false;
            }
        }
    }
}

function toggleInventoryMenu() {
    const isOpening = inventoryMenu && inventoryMenu.style && inventoryMenu.style.display !== 'flex';
    if (isOpening) {
        updateInventoryMenu();
        isPaused = true;
        if (inventoryMenu) inventoryMenu.style.display = 'flex';
        document.exitPointerLock();
    } else {
        if (inventoryMenu) inventoryMenu.style.display = 'none';
        isPaused = false;
        
        const hasOpenOptions = document.getElementById('options-menu') && document.getElementById('options-menu').style.display.includes('flex');
        
        if (!isGameOver && !hasOpenOptions) {
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
    
    if (gunModels[player.currentWeaponIndex]) gunModels[player.currentWeaponIndex].visible = false;
    player.currentWeaponIndex = index;
    
    const newSprite = document.getElementById(`weapon-sprite-${index}`);
    if (newSprite) {
        newSprite.classList.add('weapon-active');
        newSprite.style.display = 'block';
    }
    
    if (gunModels[index]) gunModels[index].visible = true;
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
    const isMovingByTouch = Object.values(touchState).some(s => s.zone === 'move');
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

    // --- Touchscreen movement with dynamic speed ---
    for (const id in touchState) {
        const state = touchState[id];
        if (state.zone === 'move') {
            const dx = state.currentX - state.startX;
            const dy = state.currentY - state.startY;
            const moveMagnitude = Math.sqrt(dx*dx + dy*dy);
            const maxMoveDist = 80;

            if (moveMagnitude > 10) {
                const moveDir = new THREE.Vector2(dx, dy).normalize();
                const speedFactor = Math.min(moveMagnitude / maxMoveDist, 1.0);
                
                const forwardComponent = forward.clone().multiplyScalar(-moveDir.y * speedFactor);
                const rightComponent = right.clone().multiplyScalar(moveDir.x * speedFactor);
                
                moveVector.add(forwardComponent).add(rightComponent);
            }
        }
    }

    const lookSpeed = 1.5; // Radians per second
    // Keyboard arrow keys for looking around are only active if touchLookEnabled is true (i.e. device motion is OFF)
    if (gameSettings.touchLookEnabled) {
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
    }


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

    const lookSpeed = 1.5; // Radians per second
    if (keys['ArrowLeft']) motorcycle.rotation.y += lookSpeed * delta;
    if (keys['ArrowRight']) motorcycle.rotation.y -= lookSpeed * delta;
    if (keys['ArrowUp']) {
        camera.rotation.x += lookSpeed * delta;
        camera.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, camera.rotation.x));
    }
    if (keys['ArrowDown']) {
        camera.rotation.x -= lookSpeed * delta;
        camera.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, camera.rotation.x));
    }

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
    
    // Lock driver position to vehicle
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
    
    if (gunModels[player.currentWeaponIndex]) gunModels[player.currentWeaponIndex].visible = true;
}


function updateInteractions() {
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const interactionPromptElement = document.getElementById('interaction-prompt');

    if (!interactionPromptElement) return;

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
    
    const doomHud = document.getElementById('doom-hud');
    const crosshair = document.getElementById('crosshair');
    const prompt = document.getElementById('interaction-prompt');
    
    if (doomHud) doomHud.style.display = 'none';
    if (crosshair) crosshair.style.display = 'none';
    if (prompt) prompt.style.display = 'none';
    
    if (cockpitOverlayElement) cockpitOverlayElement.style.display = 'block';
    if (spacecraft) spacecraft.visible = false;
    
    gunModels.forEach(g => { if (g) g.visible = false; });
    if(player.carriedObject) scene.remove(player.carriedObject);
    player.carriedObject = null;
    if (cockpitJoystick) cockpitJoystick.visible = true;
    if (cockpitHexHUD) cockpitHexHUD.visible = true;
    playerObject.quaternion.copy(spacecraft.quaternion);
    spacecraft.userData.animationProgress = 0;
}

function enterMotorcycle() {
    if (player.state !== 'on_foot' || player.carriedObject) return;
    player.state = 'driving_motorcycle';
    gunModels.forEach(g => { if (g) g.visible = false; });
    const index = interactables.findIndex(i => i.mesh === motorcycle);
    if (index > -1) interactables.splice(index, 1);
    
    // Align player rotation with bike's front
    playerObject.rotation.y = motorcycle.rotation.y + Math.PI;
    camera.rotation.x = 0;
}

function exitMotorcycle() {
    if (player.state !== 'driving_motorcycle') return;
    player.state = 'on_foot';
    if (motorcycle) motorcycle.visible = true;
    if (gunModels[player.currentWeaponIndex]) gunModels[player.currentWeaponIndex].visible = true;
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
    if (gunModels[player.currentWeaponIndex]) gunModels[player.currentWeaponIndex].visible = false;
    
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
    if (cockpitJoystick) cockpitJoystick.rotation.x = 0.3 + Math.sin(clock.getElapsedTime() * 2) * 0.05;
    if (spacecraft.position.y > 250) {
        player.state = 'hyperspace';
        hyperspaceData.time = 0;
        if (starfield) starfield.visible = true;
    }
}

function updateHyperspace(delta) {
    hyperspaceData.time += delta;
    const fadeProgress = Math.min(1.0, hyperspaceData.time / hyperspaceData.fadeTime);
    
    const fromColor = new THREE.Color(GameWorld.levels[currentLevel].fogColor || 0x8899aa);
    const blackColor = new THREE.Color(0x000000);
    if (scene.fog) scene.fog.color.lerpColors(fromColor, blackColor, fadeProgress);
    scene.background.lerpColors(fromColor, blackColor, fadeProgress);
    
    if (starfield) {
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
    }
    if (cockpitJoystick) cockpitJoystick.rotation.x = 0.3 + Math.sin(clock.getElapsedTime() * 2) * 0.05;

    if (hyperspaceData.time >= hyperspaceData.duration) {
        if (currentLevel === 'crystal') {
            questComplete();
        } else {
            const currentIndex = GameWorld.levelOrder.indexOf(currentLevel);
            const nextIndex = (currentIndex + 1) % GameWorld.levelOrder.length;
            const nextLevel = GameWorld.levelOrder[nextIndex];
            
            player.state = 'landing_sequence';
            hyperspaceData.time = 0;
            loadLevel(nextLevel, false, true);
        }
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
    if (starfield) starfield.visible = false;

    spacecraft.position.lerp(spacecraft.userData.targetLandPosition, 0.8 * delta);
    playerObject.position.copy(spacecraft.position).add(new THREE.Vector3(0, GameWorld.player.height, 0));
    playerObject.quaternion.copy(spacecraft.quaternion);
    if (cockpitJoystick) cockpitJoystick.rotation.x = 0.3 + Math.sin(clock.getElapsedTime() * 2) * 0.05;

    if (spacecraft.position.distanceTo(spacecraft.userData.targetLandPosition) < 0.2) {
        player.state = 'on_foot';
        
        spacecraft.position.copy(spacecraft.userData.targetLandPosition);
        const exitOffset = new THREE.Vector3(5, -GameWorld.player.height, 0).applyQuaternion(spacecraft.quaternion);
        playerObject.position.copy(spacecraft.position).add(exitOffset);
        playerObject.position.y = GameWorld.player.height / 2;
        
        const doomHud = document.getElementById('doom-hud');
        const crosshair = document.getElementById('crosshair');
        
        if (doomHud) doomHud.style.display = 'grid';
        if (crosshair) crosshair.style.display = 'block';
        if (cockpitOverlayElement) cockpitOverlayElement.style.display = 'none';
        if (cockpitJoystick) cockpitJoystick.visible = false;
        if (cockpitHexHUD) cockpitHexHUD.visible = false;
        if (gunModels[player.currentWeaponIndex]) gunModels[player.currentWeaponIndex].visible = true;

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
