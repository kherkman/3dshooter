/**
 * ui-and-hud.js
 * Manages all user interface elements: HUD, inventory menu, map, and the debug console.
 */

let pickupNotificationTimeout = null;

function setupHUD() {
    GameData.items.health.hudIcon(document.getElementById('health-icon').getContext('2d'));
    GameData.items.jetpack.hudIcon(document.getElementById('jetpack-icon').getContext('2d'));
    GameData.items.fuel_cell.hudIcon(document.getElementById('fuel-cell-icon').getContext('2d'));
    GameData.items.xray_goggles.hudIcon(document.getElementById('goggles-icon').getContext('2d'));
    generateWeaponSprites();
    // --- MODIFICATION: Draw the level progression on the intro screen ---
    drawLevelProgression('level-progression-intro');
    // --- END MODIFICATION ---
}

function showPickupNotification(itemName) {
    const notificationElement = document.getElementById('item-pickup-notification');
    if (!notificationElement) return;

    if (pickupNotificationTimeout) {
        clearTimeout(pickupNotificationTimeout);
    }

    notificationElement.textContent = `Collected: ${itemName}`;
    notificationElement.style.opacity = 1;

    pickupNotificationTimeout = setTimeout(() => {
        notificationElement.style.opacity = 0;
    }, 2500);
}


function generateWeaponSprites() {
    const weaponDisplayContainer = document.getElementById('weapon-display-container');
    weaponDisplayContainer.innerHTML = '';
    const spriteScene = new THREE.Scene();
    spriteScene.background = new THREE.Color(0xd3d3d3); 
    const spriteCam = new THREE.PerspectiveCamera(50, 2, 0.1, 100);
    spriteCam.position.set(0.5, 0.2, 2.5);
    const light1 = new THREE.DirectionalLight(0xffffff, 1.0);
    light1.position.set(1, 1, 1);
    const light2 = new THREE.AmbientLight(0xffffff, 0.5);
    spriteScene.add(light1, light2);
    const tempRenderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    tempRenderer.setSize(240, 120); 
    GameData.weapons.forEach((weapon, index) => {
        const model = weapon.model(false);
        model.position.set(0,0,0);
        model.rotation.set(0.1, 0.2 + Math.PI / 2, 0); 
        spriteScene.add(model);
        tempRenderer.render(spriteScene, spriteCam);
        const img = new Image();
        img.src = tempRenderer.domElement.toDataURL();
        img.id = `weapon-sprite-${index}`;
        img.className = 'weapon-hud-sprite';
        weaponDisplayContainer.appendChild(img);
        spriteScene.remove(model);
    });
    tempRenderer.dispose();
}

function updateHUD() {
    const exitVehicleButton = document.getElementById('exit-vehicle-button');
    if (exitVehicleButton) {
        exitVehicleButton.style.display = player.state === 'driving_motorcycle' ? 'block' : 'none';
    }

    if(player.state !== 'on_foot' && player.state !== 'driving_motorcycle') return;
    document.getElementById('health').textContent = Math.max(0, Math.round(health));
    document.getElementById('fuel-cells').textContent = player.fuelCells;
    
    const ammoElement = document.getElementById('ammo');
    const crosshairElement = document.getElementById('crosshair');
    const gogglesContainer = document.getElementById('goggles-hud-container');
    const gogglesBar = document.getElementById('goggles-bar');
    const allWeaponSprites = document.querySelectorAll('.weapon-hud-sprite');

    if (player.carriedObject) {
        ammoElement.textContent = `CARRYING`;
        document.getElementById('weapon-display-container').style.opacity = 0.3;
        crosshairElement.className = 'crosshair';
        crosshairElement.innerHTML = '';
        allWeaponSprites.forEach(sprite => {
            sprite.style.display = 'none';
            sprite.classList.remove('weapon-active');
        });
    } else {
        const w = GameData.weapons[player.currentWeaponIndex];
        const a = player.ammo[w.properties.ammoType];
        ammoElement.innerHTML = Number.isFinite(a) ? a : '&infin;';
        document.getElementById('weapon-display-container').style.opacity = 1.0;

        if (w.name === 'Sniper Rifle') {
            crosshairElement.className = 'crosshair sniper-scope-alt';
            crosshairElement.innerHTML = '';
        } else {
            crosshairElement.className = 'crosshair';
            crosshairElement.innerHTML = '';
        }
        
        allWeaponSprites.forEach((sprite, index) => {
            const isCurrentWeapon = index === player.currentWeaponIndex;
            sprite.style.display = isCurrentWeapon ? 'block' : 'none';
            if (isCurrentWeapon) {
                sprite.classList.add('weapon-active');
            } else {
                sprite.classList.remove('weapon-active');
            }
        });
    }

    if (player.hasJetpack) {
        document.getElementById('jetpack-bar').style.width = `${(player.jetpackFuel / player.maxJetpackFuel) * 100}%`;
    }

    if (player.hasXRayGoggles) {
        gogglesContainer.style.display = 'flex';
        gogglesContainer.classList.toggle('goggles-active', player.xrayGogglesActive);
        gogglesContainer.classList.toggle('goggles-cooldown', player.gogglesCooldown > 0);
        if (player.gogglesCooldown > 0) {
            gogglesBar.style.width = `${(player.gogglesCooldown / 30) * 100}%`;
            gogglesBar.style.backgroundColor = '#ff4444';
        } else {
            gogglesBar.style.width = `${(player.gogglesBattery / player.maxGogglesBattery) * 100}%`;
            gogglesBar.style.backgroundColor = '#00ff00';
        }
    } else {
        gogglesContainer.style.display = 'none';
    }
}

function updateAttackIndicator() {
    const indicatorContainer = document.getElementById('attack-indicator-container');
    const horizontalArrow = document.getElementById('attack-indicator-horizontal');
    const verticalArrow = document.getElementById('attack-indicator-vertical');

    if (!lastAttackerPosition || !indicatorContainer || !horizontalArrow || !verticalArrow) return;

    // Convert attacker world position to player's local space
    const localAttackerPos = playerObject.worldToLocal(lastAttackerPosition.clone());

    // --- Horizontal Angle (Yaw) ---
    // Calculate angle on the XZ plane relative to player's forward (-Z)
    const horizontalAngle = Math.atan2(localAttackerPos.x, -localAttackerPos.z);
    horizontalArrow.style.transform = `translate(-50%, -100%) rotate(${horizontalAngle}rad)`;

    // --- Vertical Angle (Pitch) ---
    const verticalThreshold = 1.5; // Attacker must be this much higher/lower to show arrow
    if (localAttackerPos.y > verticalThreshold) {
        verticalArrow.style.display = 'block';
        verticalArrow.classList.add('up');
    } else if (localAttackerPos.y < -verticalThreshold) {
        verticalArrow.style.display = 'block';
        verticalArrow.classList.remove('up');
    } else {
        verticalArrow.style.display = 'none';
    }

    // Show the indicator
    indicatorContainer.style.opacity = 1;

    // Clear any existing timeout
    if (attackIndicatorTimeout) clearTimeout(attackIndicatorTimeout);

    // Set a new timeout to hide the indicator
    attackIndicatorTimeout = setTimeout(() => {
        indicatorContainer.style.opacity = 0;
    }, 2000);

    // Reset the attacker position so this only runs once per hit
    lastAttackerPosition = null;
}

function updateCompass() {
    const compassContainer = document.getElementById('compass-container');
    const compassArrow = document.getElementById('compass-arrow');
    const compassDistance = document.getElementById('compass-distance');

    if (!compassContainer || !compassArrow || !compassDistance) return;

    // Hide if no spacecraft exists in the scene
    if (!spacecraft || !spacecraft.parent) {
        compassContainer.style.display = 'none';
        return;
    }

    compassContainer.style.display = 'flex';

    // --- Calculate Angle ---
    const playerForward = new THREE.Vector3();
    camera.getWorldDirection(playerForward);
    playerForward.y = 0; // Project onto horizontal plane
    playerForward.normalize();

    const dirToSpacecraft = spacecraft.position.clone().sub(playerObject.position);
    dirToSpacecraft.y = 0; // Project onto horizontal plane
    dirToSpacecraft.normalize();

    // Get the world angle of each vector
    const playerAngle = Math.atan2(playerForward.x, playerForward.z);
    const spacecraftAngle = Math.atan2(dirToSpacecraft.x, dirToSpacecraft.z);

    // The rotation is the difference between the angles
    const rotationAngle = spacecraftAngle - playerAngle;
    compassArrow.style.transform = `rotate(${rotationAngle}rad)`;

    // --- Calculate Distance ---
    const distance = playerObject.position.distanceTo(spacecraft.position);
    compassDistance.textContent = `${Math.round(distance)}m`;
}

function updateInventoryMenu() {
    const weaponsList = document.getElementById('inventory-weapons-list');
    const itemsList = document.getElementById('inventory-items-list');
    const invMapCanvas = document.getElementById('inventory-map-canvas');
    const invMapCtx = invMapCanvas.getContext('2d');
    weaponsList.innerHTML = '';
    itemsList.innerHTML = '';

    GameData.weapons.forEach((w, i) => {
        if (player.unlockedWeapons[i]) {
            const ammo = player.ammo[w.properties.ammoType];
            const ammoText = Number.isFinite(ammo) ? `${ammo} rounds` : 'Infinite';
            const originalSprite = document.getElementById(`weapon-sprite-${i}`);
            weaponsList.innerHTML += `<div class="inventory-item ${i === player.currentWeaponIndex ? 'item-active' : ''}" data-weapon-index="${i}">
                <img src="${originalSprite ? originalSprite.src : ''}">
                <div class="inventory-item-info">
                    <p class="item-name">${w.name}</p>
                    <p class="item-detail">${ammoText}</p>
                </div>
            </div>`;
        }
    });
    if (player.hasJetpack) {
        itemsList.innerHTML += `<div class="inventory-item">
            <img src="${document.getElementById('jetpack-icon').toDataURL()}" style="width: 60px; height: 60px; object-fit: contain;">
            <div class="inventory-item-info"><p class="item-name">Jetpack</p><p class="item-detail">Fuel: ${Math.round(player.jetpackFuel)}%</p></div>
        </div>`;
    }
    if (player.fuelCells > 0) {
         itemsList.innerHTML += `<div class="inventory-item">
            <img src="${document.getElementById('fuel-cell-icon').toDataURL()}">
            <div class="inventory-item-info"><p class="item-name">Fuel Cells</p><p class="item-detail">Collected: ${player.fuelCells}</p></div>
        </div>`;
    }
    if (player.hasXRayGoggles) {
        let detailText = '';
        if (player.gogglesCooldown > 0) {
            detailText = `Cooldown: ${player.gogglesCooldown.toFixed(1)}s`;
        } else {
            const batteryPercent = Math.round((player.gogglesBattery / player.maxGogglesBattery) * 100);
            detailText = `Battery: ${batteryPercent}% - Status: ${player.xrayGogglesActive ? 'ON' : 'OFF'}`;
        }
        itemsList.innerHTML += `<div class="inventory-item ${player.xrayGogglesActive ? 'item-active' : ''}" data-item-key="xray_goggles">
            <img src="${document.getElementById('goggles-icon').toDataURL()}">
            <div class="inventory-item-info">
                <p class="item-name">X-Ray Goggles</p>
                <p class="item-detail">${detailText}</p>
            </div>
        </div>`;
    }
    if (player.carriedObject) {
         itemsList.innerHTML += `<div class="inventory-item item-active">
            <img src="">
            <div class="inventory-item-info"><p class="item-name">Carrying: ${player.carriedObject.userData.name || 'Object'}</p></div>
        </div>`;
    }
    invMapCtx.drawImage(mapBackgroundCanvas, 0, 0, invMapCanvas.width, invMapCanvas.height);
    updateMap(invMapCtx, invMapCanvas.width, invMapCanvas.height);
    // --- MODIFICATION: Draw the level progression in the inventory ---
    drawLevelProgression('level-progression-inventory');
    // --- END MODIFICATION ---
}

// --- MODIFICATION: New function to draw the level progression ---
function drawLevelProgression(canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    const levelColors = {
        city: '#000000',
        desert: '#F5DEB3',
        volcanic: '#8B0000',
        ice: '#FFFFFF',
        toxic: '#008000',
        crystal: '#800080'
    };

    const levelCount = GameWorld.levelOrder.length;
    const circleRadius = 12;
    const padding = 20;
    const totalWidth = width - (padding * 2);
    const spacing = totalWidth / (levelCount - 1);
    const yPos = height / 2;

    // Draw connecting lines
    ctx.strokeStyle = '#ffaa00';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(padding, yPos);
    ctx.lineTo(width - padding, yPos);
    ctx.stroke();

    // Draw circles and highlight current level
    GameWorld.levelOrder.forEach((levelKey, index) => {
        const xPos = padding + index * spacing;

        // Draw the main circle
        ctx.beginPath();
        ctx.arc(xPos, yPos, circleRadius, 0, Math.PI * 2);
        ctx.fillStyle = levelColors[levelKey] || '#cccccc';
        ctx.fill();

        // Draw a border on all circles
        ctx.strokeStyle = '#ffaa00';
        ctx.lineWidth = 2;
        ctx.stroke();

        // If it's the current level, draw a white highlight border
        if (levelKey === currentLevel) {
            ctx.beginPath();
            ctx.arc(xPos, yPos, circleRadius + 3, 0, Math.PI * 2);
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 3;
            ctx.stroke();
        }
    });
}
// --- END MODIFICATION ---

function createMapBackground() {
    mapBackgroundCanvas = document.createElement('canvas');
    mapBackgroundCanvas.width = mapCanvas.width;
    mapBackgroundCanvas.height = mapCanvas.height;
    const bgCtx = mapBackgroundCanvas.getContext('2d');
    const mapInfo = GameWorld.levels[currentLevel].map;
    bgCtx.fillStyle = mapInfo.bgColor;
    bgCtx.fillRect(0, 0, mapCanvas.width, mapCanvas.height);
    bgCtx.fillStyle = mapInfo.buildingColor;
    buildingColliders.forEach(c => {
        const mapWidth = (c.max.x - c.min.x) * (mapCanvas.width / mapInfo.size);
        const mapHeight = (c.max.z - c.min.z) * (mapCanvas.height / mapInfo.size);
        const mapX = (c.min.x + mapInfo.size / 2) * (mapCanvas.width / mapInfo.size);
        const mapY = (c.min.z + mapInfo.size / 2) * (mapCanvas.height / mapInfo.size);
        bgCtx.fillRect(mapX, mapY, mapWidth, mapHeight);
    });
}

function updateMap(ctx = mapCtx, width = mapCanvas.width, height = mapCanvas.height) {
    const mapInfo = GameWorld.levels[currentLevel].map;
    const mapSize = mapInfo.size;
    if(ctx === mapCtx) ctx.drawImage(mapBackgroundCanvas, 0, 0); 
    const worldToMap = (pos) => ({
        x: (pos.x + mapSize / 2) / mapSize * width,
        y: (pos.z + mapSize / 2) / mapSize * height
    });
    
    let playerMapPos = worldToMap(playerObject.position);
    if(player.state === 'driving_motorcycle' && motorcycle) {
        playerMapPos = worldToMap(motorcycle.position);
    }

    ctx.fillStyle = '#00ffff';
    ctx.fillRect(playerMapPos.x - 3, playerMapPos.y - 3, 6, 6);
    aliens.forEach(alien => {
        const alienMapPos = worldToMap(alien.position);
        let color = '#ff0000';
        if (alien.userData.type === 'flyer' || alien.userData.type === 'stingray') color = '#cc00ff';
        if (alien.userData.type === 'cyborg') color = '#dd0000';
        if (alien.userData.type === 'brain_boss') color = '#ff69b4';
        ctx.fillStyle = color;
        ctx.fillRect(alienMapPos.x - 2, alienMapPos.y - 2, 4, 4);
    });
}

// --- DEBUG MENU LOGIC ---
function toggleDebugMenu() {
    if (!debugMenu) debugMenu = document.getElementById('debug-menu');
    const isOpening = debugMenu.style.display !== 'flex';
    if (isOpening) {
        if (!isDebugMenuInitialized) { initDebugMenu(); }
        isPaused = true;
        debugMenu.style.display = 'flex';
        document.exitPointerLock();
        if (!previewRenderer) {
            requestAnimationFrame(setupPreviewRendererAndStart);
        } else {
            updatePreview();
        }
        updateDebugScrollThumb();
    } else {
        isPaused = false;
        debugMenu.style.display = 'none';
        if (!isGameOver && !document.getElementById('options-menu').style.display.includes('flex')) {
            document.body.requestPointerLock();
        }
        if (previewAnimationId) {
            cancelAnimationFrame(previewAnimationId);
            previewAnimationId = null;
        }
    }
}

function initDebugMenu() {
    previewScene = new THREE.Scene();
    previewScene.background = new THREE.Color(0x3a2d24);
    previewClock = new THREE.Clock();
    const pLight1 = new THREE.DirectionalLight(0xffffff, 1.2); pLight1.position.set(2, 3, 4);
    const pLight2 = new THREE.AmbientLight(0xffffff, 0.8);
    previewScene.add(pLight1, pLight2);

    const levelList = document.getElementById('level-list');
    const weaponList = document.getElementById('weapon-list');
    const itemList = document.getElementById('item-list');
    const entityList = document.getElementById('entity-list');
    
    weaponList.innerHTML = ''; itemList.innerHTML = ''; entityList.innerHTML = ''; levelList.innerHTML = '';

    Object.keys(GameWorld.levels).forEach(levelKey => {
        const level = GameWorld.levels[levelKey];
        const btn = document.createElement('button');
        btn.className = 'debug-list-button';
        btn.textContent = level.name + ' Level';
        btn.onclick = () => { toggleDebugMenu(); loadLevel(levelKey); };
        levelList.appendChild(btn);
    });

    GameData.weapons.forEach((weapon, index) => {
        const container = document.createElement('div');
        container.className = 'weapon-list-item';
        const originalSprite = document.getElementById(`weapon-sprite-${index}`);
        if(originalSprite) {
            const img = new Image();
            img.src = originalSprite.src;
            container.appendChild(img);
        }
        const name = document.createElement('p');
        name.textContent = weapon.name;
        container.appendChild(name);
        container.onclick = () => showInPreview('weapon', index);
        weaponList.appendChild(container);
    });
    
    Object.entries(GameData.items).forEach(([key, item]) => {
        if (item.name.toLowerCase().includes('ammo')) return; 
        const btn = document.createElement('button');
        btn.className = 'debug-list-button';
        btn.textContent = item.name;
        btn.onclick = () => showInPreview('item', key);
        itemList.appendChild(btn);
    });

    Object.entries(GameData.enemies).forEach(([key, entity]) => {
        const btn = document.createElement('button');
        btn.className = 'debug-list-button';
        btn.textContent = entity.name;
        btn.onclick = () => showInPreview('entity', key);
        entityList.appendChild(btn);
    });

    Object.entries(GameData.vehicles).forEach(([key, vehicle]) => {
        const btn = document.createElement('button');
        btn.className = 'debug-list-button';
        btn.textContent = vehicle.name;
        btn.onclick = () => showInPreview('vehicle', key);
        entityList.appendChild(btn);
    });

    ['Spacecraft'].forEach(name => {
        const btn = document.createElement('button');
        btn.className = 'debug-list-button';
        btn.textContent = name;
        btn.onclick = () => showInPreview('entity', 'spacecraft');
        entityList.appendChild(btn);
    });

    document.getElementById('preview-zoom-slider').addEventListener('input', (e) => { if (previewCamera) previewCamera.position.z = 6.5 - parseFloat(e.target.value); });
    document.getElementById('preview-pan-slider').addEventListener('input', (e) => { if (previewCamera) previewCamera.position.y = parseFloat(e.target.value); });
    document.getElementById('close-debug').addEventListener('click', toggleDebugMenu);
    
    setupDebugScrollbar();
    isDebugMenuInitialized = true;
}

function setupDebugScrollbar() {
    const content = document.getElementById('debug-content');
    const track = document.getElementById('debug-scrollbar-track');
    const thumb = document.getElementById('debug-scrollbar-thumb');
    let isDragging = false, startY, startScrollTop;
    
    content.addEventListener('scroll', () => { if (!isDragging) updateDebugScrollThumb(); });
    
    thumb.addEventListener('mousedown', (e) => {
        e.stopPropagation(); isDragging = true; startY = e.clientY; startScrollTop = content.scrollTop;
        document.body.style.userSelect = 'none';
    });
    
    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        e.preventDefault();
        const deltaY = e.clientY - startY;
        const scrollableHeight = content.scrollHeight - content.clientHeight;
        const trackHeight = track.clientHeight - thumb.clientHeight;
        if (trackHeight === 0) return;
        const scrollAmount = (deltaY / trackHeight) * scrollableHeight;
        content.scrollTop = startScrollTop + scrollAmount;
    });
    
    document.addEventListener('mouseup', () => {
        isDragging = false;
        document.body.style.userSelect = '';
    });
    
    window.addEventListener('resize', updateDebugScrollThumb);
    updateDebugScrollThumb();
}

function updateDebugScrollThumb() {
    const content = document.getElementById('debug-content');
    const track = document.getElementById('debug-scrollbar-track');
    const thumb = document.getElementById('debug-scrollbar-thumb');
    const scrollableHeight = content.scrollHeight - content.clientHeight;
    if (scrollableHeight <= 0) { track.style.display = 'none'; return; }
    track.style.display = 'block';
    const thumbHeight = Math.max(20, (content.clientHeight / content.scrollHeight) * track.clientHeight);
    thumb.style.height = `${thumbHeight}px`;
    const thumbPosition = (content.scrollTop / scrollableHeight) * (track.clientHeight - thumbHeight);
    thumb.style.top = `${thumbPosition}px`;
}

function setupPreviewRendererAndStart() {
    const canvas = document.getElementById('preview-canvas');
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const zoomSlider = document.getElementById('preview-zoom-slider');
    const panSlider = document.getElementById('preview-pan-slider');
    previewCamera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
    previewCamera.position.set(0, parseFloat(panSlider.value), 6.5 - parseFloat(zoomSlider.value));
    previewRenderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
    previewRenderer.setSize(width, height);

    let isDraggingPreview = false;
    canvas.addEventListener('mousedown', () => { isDraggingPreview = true; });
    canvas.addEventListener('mouseup', () => { isDraggingPreview = false; });
    canvas.addEventListener('mouseleave', () => { isDraggingPreview = false; });
    canvas.addEventListener('mousemove', (event) => {
        if (isDraggingPreview && previewObject && previewAnimationState === null) {
            previewObject.rotation.y += event.movementX * 0.01;
            previewObject.rotation.x += event.movementY * 0.01;
        }
    });

    updatePreview();
}

function showInPreview(category, key) {
    if (!previewCamera) return;
    if (previewObject) { previewScene.remove(previewObject); previewObject = null; }
    
    const controlsContainer = document.getElementById('preview-controls');
    const descriptionElement = document.getElementById('preview-description');
    controlsContainer.innerHTML = '';
    descriptionElement.textContent = '';
    
    previewAnimationState = null;
    let model;
    let description = '';

    const zoomSlider = document.getElementById('preview-zoom-slider');
    const panSlider = document.getElementById('preview-pan-slider');
    zoomSlider.value = 3;
    panSlider.value = 0.5;
    previewCamera.position.y = parseFloat(panSlider.value);
    previewCamera.position.z = 6.5 - parseFloat(zoomSlider.value);

    switch(category) {
        case 'weapon':
            model = GameData.weapons[key].model(false);
            description = GameData.weapons[key].description;
            if (model) model.position.set(0, -0.2, 0);
            break;
        case 'item':
            model = GameData.items[key].model();
            description = GameData.items[key].description;
            if (model) model.scale.set(1.5, 1.5, 1.5);
            break;
        case 'vehicle':
            model = GameData.vehicles[key].model();
            description = GameData.vehicles[key].description;
            break;
        case 'entity':
            if (key === 'spacecraft') {
                model = GameWorld.spacecraft.createModel();
                description = "Player-controlled ship for interplanetary travel. Requires fuel.";
                model.scale.set(0.2,0.2,0.2); panSlider.value=0.8; zoomSlider.value=4.5;
            } else {
                const enemy = GameData.enemies[key];
                model = enemy.model();
                description = enemy.description;
                model.userData.type = key; // Crucial fix for animations
                
                if (key === 'dome_guardian') {
                    model.scale.set(0.5, 0.5, 0.5);
                    panSlider.value = 1.5;
                    zoomSlider.value = 5;
                } else if (key === 'predator' && model.userData.material) {
                    model.userData.material.opacity = 0.9;
                    const btn = document.createElement('button');
                    btn.textContent = 'Mouth Animate';
                    btn.onclick = () => {
                        previewAnimationState = 'mouth_animate';
                    };
                    controlsContainer.appendChild(btn);
                } else if (key === 'cyborg' && enemy.animations) {
                    model.scale.set(0.8,0.8,0.8); panSlider.value=1.2; model.userData.isPreview = true;
                    Object.keys(enemy.animations).filter(k=>!k.startsWith('_')).forEach(anim => {
                        const btn = document.createElement('button');
                        btn.textContent = anim.charAt(0).toUpperCase() + anim.slice(1);
                        btn.onclick = () => {
                            previewAnimationState = anim;
                            if (model.userData.animationProgress != undefined) model.userData.animationProgress = 0;
                        };
                        controlsContainer.appendChild(btn);
                    });
                } else if(key === 'stingray') {
                    model.scale.set(0.4, 0.4, 0.4);
                } else if(key === 'tentacle') {
                    model.scale.set(0.8, 0.8, 0.8);
                    previewObject = model;
                    model.position.y = -10; 
                    ['Emerge', 'Wave', 'Retract'].forEach(anim => {
                        const btn = document.createElement('button');
                        btn.textContent = anim;
                        btn.onclick = () => { previewAnimationState = anim.toLowerCase(); };
                        controlsContainer.appendChild(btn);
                    });
                }
            }
            previewCamera.position.y = parseFloat(panSlider.value);
            previewCamera.position.z = 6.5 - parseFloat(zoomSlider.value);
            break;
    }
    if(model && key !== 'tentacle') { 
        previewObject = model;
        previewObject.position.set(0, 0, 0);
        previewObject.rotation.set(0, 0, 0);
        previewScene.add(previewObject);
    } else if (model && key === 'tentacle') {
         previewScene.add(previewObject);
    }
    descriptionElement.textContent = description || 'No description available.';
}

function updatePreview() {
    previewAnimationId = requestAnimationFrame(updatePreview);
    if (previewObject) {
        if (previewAnimationState === null) {
            // Rotation is now handled by mouse drag, so we keep it static here.
        } else {
            const delta = previewClock.getDelta();
            const anims = GameData.enemies[previewObject.userData.type]?.animations;

            if (anims) {
                 switch(previewAnimationState) {
                    case 'idle': anims.idle(previewObject, previewClock.getElapsedTime()); break;
                    case 'walk': anims.walk(previewObject, previewClock.getElapsedTime()); break;
                    case 'shoot':
                        previewObject.userData.animationProgress = (previewObject.userData.animationProgress || 0) + delta * 2.0;
                        if(previewObject.userData.animationProgress >= 1) previewObject.userData.animationProgress = 0;
                        anims.shoot(previewObject, previewObject.userData.animationProgress);
                        break;
                    case 'death':
                        previewObject.userData.animationProgress = (previewObject.userData.animationProgress || 0) + delta * 0.7;
                        if(previewObject.userData.animationProgress > 1) previewObject.userData.animationProgress = 1;
                        anims.death(previewObject, previewObject.userData.animationProgress);
                        break;
                    case 'mouth_animate':
                        anims.mouth_animate(previewObject, previewClock.getElapsedTime());
                        break;
                    case 'emerge':
                        previewObject.position.y = THREE.MathUtils.lerp(previewObject.position.y, 0, 0.1);
                        GameData.enemies.tentacle.animations.wave(previewObject, previewClock.getElapsedTime());
                        break;
                    case 'wave':
                        GameData.enemies.tentacle.animations.wave(previewObject, previewClock.getElapsedTime());
                        break;
                    case 'retract':
                        previewObject.position.y = THREE.MathUtils.lerp(previewObject.position.y, -10, 0.1);
                        break;
                }
            }
        }
    }
    if (previewRenderer) {
        previewRenderer.render(previewScene, previewCamera);
    }
}
