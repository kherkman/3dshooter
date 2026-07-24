/**
 * game-logic.js
 * Contains core game simulation logic for non-player, non-enemy game objects.
 * This includes spawning collectibles, vehicles, destructible car logic, and managing general game effects.
 */

/**
 * Checks if a given Box3 intersects with any world colliders,
 * handling Box3 colliders, Mesh colliders, destructible props, and cars.
 * @param {THREE.Box3} objectBox The bounding box of the object to check.
 * @param {boolean} isProjectile Whether the collision check originates from a projectile.
 * @returns {boolean} True if there is a collision, false otherwise.
 */
function checkBuildingCollision(objectBox, isProjectile = true) {
    for (let i = buildingColliders.length - 1; i >= 0; i--) {
        const collider = buildingColliders[i];
        let isHit = false;

        if (collider.isMesh && collider.userData && collider.userData.colliderType === 'mesh') {
            const meshColliderBox = new THREE.Box3().setFromObject(collider);
            isHit = meshColliderBox.intersectsBox(objectBox);
        } else if (collider.isBox3) {
            isHit = collider.intersectsBox(objectBox);
        }

        if (isHit) {
            if (isProjectile && collider.userData) {
                if (collider.userData.isDestructible) {
                    destroyProp(collider);
                } else if (collider.userData.isCar && collider.userData.carGroup) {
                    const hitPos = new THREE.Vector3();
                    objectBox.getCenter(hitPos);
                    damageCarPart(collider.userData.carGroup, hitPos);
                }
            }
            return true;
        }
    }
    return false;
}

/**
 * Damages a specific part of a car based on projectile hit coordinates and triggers an explosion sound.
 * @param {THREE.Group} carGroup The car group.
 * @param {THREE.Vector3} hitPos World coordinates of the impact.
 */
function damageCarPart(carGroup, hitPos) {
    if (!carGroup || !carGroup.userData || !carGroup.userData.carState) return;
    const data = carGroup.userData;
    const state = data.carState;

    const localPos = carGroup.worldToLocal(hitPos.clone());

    let part = 'front';
    if (localPos.z > 0.4) {
        part = 'front';
    } else if (localPos.z < -0.5) {
        part = 'rear';
    } else {
        if (localPos.x < 0) {
            part = 'doorLeft';
        } else {
            part = 'doorRight';
        }
    }

    if (part === 'front' && !state.frontDestroyed) {
        state.frontDestroyed = true;
        if (data.frontClean) data.frontClean.visible = false;
        if (data.frontDamaged) data.frontDamaged.visible = true;
        if (typeof createGlassShards === 'function') createGlassShards(hitPos, 25);
        if (typeof playSound === 'function') playSound('explosion', hitPos);
    } else if (part === 'doorLeft' && !state.doorLeftDestroyed) {
        state.doorLeftDestroyed = true;
        if (data.doorLClean) data.doorLClean.visible = false;
        if (data.doorLDamaged) data.doorLDamaged.visible = true;
        if (typeof createGlassShards === 'function') createGlassShards(hitPos, 15);
        if (typeof playSound === 'function') playSound('explosion', hitPos);
    } else if (part === 'doorRight' && !state.doorRightDestroyed) {
        state.doorRightDestroyed = true;
        if (data.doorRClean) data.doorRClean.visible = false;
        if (data.doorRDamaged) data.doorRDamaged.visible = true;
        if (typeof createGlassShards === 'function') createGlassShards(hitPos, 15);
        if (typeof playSound === 'function') playSound('explosion', hitPos);
    } else if (part === 'rear' && !state.rearDestroyed) {
        state.rearDestroyed = true;
        if (data.rearClean) data.rearClean.visible = false;
        if (data.rearDamaged) data.rearDamaged.visible = true;
        if (typeof createGlassShards === 'function') createGlassShards(hitPos, 20);
        if (typeof playSound === 'function') playSound('explosion', hitPos);
    } else {
        if (typeof createHitScatter === 'function') createHitScatter(hitPos, 0x888888);
    }
}

/**
 * Destroys a destructible prop (Trash can or Street light),
 * triggers a shard debris effect and explosion sound, and drops contained items.
 * @param {THREE.Box3} collider The collider of the destructible prop.
 */
function destroyProp(collider) {
    if (!collider || (collider.userData && collider.userData.isDestroyed)) return;
    collider.userData.isDestroyed = true;

    const propMesh = collider.userData.mesh;
    const pos = new THREE.Vector3();
    
    if (propMesh) {
        propMesh.getWorldPosition(pos);
        scene.remove(propMesh);
    } else {
        collider.getCenter(pos);
    }

    // Sirpale-efektit
    const isTrash = collider.userData.propType === 'trash_can';
    const color = isTrash ? 0x1e6b27 : 0xffea88;

    if (typeof createGlassShards === 'function') {
        createGlassShards(pos);
    }
    if (typeof createHitScatter === 'function') {
        createHitScatter(pos, color);
    }
    if (typeof playSound === 'function') {
        playSound('explosion', pos);
    }

    // Esinedropit roska-astiasta
    if (collider.userData.containsItem) {
        const itemKey = collider.userData.containsItem;
        const itemData = GameData.items[itemKey];
        if (itemData) {
            const dropGroup = itemData.model();
            dropGroup.position.copy(pos);
            dropGroup.position.y = Math.max(0.5, pos.y);
            dropGroup.userData.key = itemKey;

            if (itemKey === 'fuel_cell') {
                dropGroup.userData.type = 'fuel_cell';
                collectibles.fuelCells.push(dropGroup);
            } else if (itemKey === 'health') {
                dropGroup.userData.type = 'health';
                collectibles.health.push(dropGroup);
            } else if (itemKey.startsWith('ammo_')) {
                dropGroup.userData.type = 'ammo';
                dropGroup.userData.ammoType = itemData.properties.ammoType;
                dropGroup.userData.amount = itemData.properties.amount;
                collectibles.ammo.push(dropGroup);
            }
            scene.add(dropGroup);
        }
    }

    // Poistetaan törmäyslaatikko
    const index = buildingColliders.indexOf(collider);
    if (index > -1) {
        buildingColliders.splice(index, 1);
    }
}

function spawnSafe(object, yPos = 0.5) {
    let isSafe = false, tries = 0;
    const spawnRange = GameWorld.levels[currentLevel].spawnRange;
    do {
        object.position.set((Math.random() - 0.5) * spawnRange, yPos, (Math.random() - 0.5) * spawnRange);
        const objectBox = new THREE.Box3().setFromObject(object);
        const collision = checkBuildingCollision(objectBox, false);
        if (!collision) isSafe = true;
        tries++;
    } while (!isSafe && tries < 50);
    return isSafe;
}

function spawnInitialCollectibles() {
    GameData.weapons.forEach((weapon, index) => {
        if (index === 0) return;
        if (weapon.levels.includes(currentLevel)) {
            const pickup = weapon.model(false);
            pickup.scale.set(0.5, 0.5, 0.5);
            pickup.userData.type = 'weapon';
            pickup.userData.weaponIndex = index;
            if (spawnSafe(pickup, 0.5)) {
                collectibles.weaponPickups.push(pickup);
                scene.add(pickup);
            }
        }
    });

    for (const itemKey in GameData.items) {
        const itemData = GameData.items[itemKey];
        if (itemData.levels.includes(currentLevel)) {
            for (let i = 0; i < itemData.spawnFrequency; i++) {
                spawnItem(itemKey);
            }
        }
    }
}

function spawnItem(itemKey) {
    const itemData = GameData.items[itemKey];
    if (!itemData) return;

    // --- SPECIAL SPAWN LOGIC for Volcanic Fuel Cells ---
    if (itemKey === 'fuel_cell' && currentLevel === 'volcanic' && levelObjects.pyramidTopPosition) {
        const group = itemData.model();
        const spawnData = GameData.items.fuel_cell;
        const numToSpawn = spawnData.spawnFrequency || 1;
        const angle = (collectibles.fuelCells.length / numToSpawn) * Math.PI * 2;
        const radius = 2.0;

        group.position.copy(levelObjects.pyramidTopPosition).add(new THREE.Vector3(
            Math.cos(angle) * radius,
            0.5,
            Math.sin(angle) * radius
        ));

        group.userData.key = itemKey;
        group.userData.type = 'fuel_cell';
        group.userData.fixedPosition = true;
        collectibles.fuelCells.push(group);
        scene.add(group);
        return;
    }
    
    // --- SPECIAL SPAWN LOGIC for Crystal Maze Fuel Cell ---
    if (itemKey === 'fuel_cell' && currentLevel === 'crystal' && levelObjects.mazeCenter && collectibles.fuelCells.length === 0) {
        const group = itemData.model();
        group.position.copy(levelObjects.mazeCenter);
        group.position.y = 0.8;
        group.userData.key = itemKey;
        group.userData.type = 'fuel_cell';
        collectibles.fuelCells.push(group);
        scene.add(group);
        return;
    }

    // --- SPECIAL SPAWN LOGIC for Ice Castle Fuel Cell ---
    if (itemKey === 'fuel_cell' && currentLevel === 'ice' && levelObjects.castleTowerTopPosition && collectibles.fuelCells.length === 0) {
        const group = itemData.model();
        group.position.copy(levelObjects.castleTowerTopPosition);
        group.userData.key = itemKey;
        group.userData.type = 'fuel_cell';
        group.userData.fixedPosition = true;
        collectibles.fuelCells.push(group);
        scene.add(group);
        return;
    }

    const group = itemData.model();
    const spawnY = itemKey === 'jetpack' || itemKey === 'xray_goggles' ? 1 : (itemKey === 'fuel_cell' || itemKey === 'glowing_orb' ? 0.8 : 0.5);
    
    if (spawnSafe(group, spawnY)) {
        group.userData.key = itemKey;
        if (itemKey === 'jetpack') {
            if (collectibles.jetpack && collectibles.jetpack.parent) return;
            group.userData.type = 'jetpack';
            collectibles.jetpack = group;
        } else if (itemKey === 'xray_goggles') {
            if (collectibles.xrayGoggles && collectibles.xrayGoggles.parent) return;
            group.userData.type = 'xray_goggles';
            collectibles.xrayGoggles = group;
        } else if (itemKey.startsWith('ammo_')) {
            group.userData.type = 'ammo';
            group.userData.ammoType = itemData.properties.ammoType;
            group.userData.amount = itemData.properties.amount;
            collectibles.ammo.push(group);
        } else if (itemKey === 'health') {
            group.userData.type = 'health';
            collectibles.health.push(group);
        } else if (itemKey === 'fuel_cell') {
            group.userData.type = 'fuel_cell';
            collectibles.fuelCells.push(group);
        } else if (itemKey === 'glowing_orb') {
            group.userData.type = 'glowing_orb';
            interactables.push({
                mesh: group,
                radius: 3,
                onInteract: () => pickUpObject(group),
                getPrompt: () => 'Pick up Orb'
            });
            collectibles.glowingOrbs.push(group);
        }
        scene.add(group);
    }
}

function spawnSpacecraft(position, isLanding = false) {
    if (!position) return;
    spacecraft = GameWorld.spacecraft.createModel();

    if (isLanding) {
        spacecraft.visible = false;
        spacecraft.position.copy(playerObject.position);
        spacecraft.userData.targetLandPosition = position.clone();
        scene.add(spacecraft);
    } else {
        spacecraft.position.copy(position);
        spacecraft.rotation.y = -Math.PI / 4;
        spacecraft.castShadow = true;
        spacecraft.userData.colliderBox = new THREE.Box3().setFromObject(spacecraft);
        interactables.push({
            mesh: spacecraft,
            radius: 12,
            onInteract: enterSpacecraft,
            getPrompt: () => (player.fuelCells >= 2 ? 'Launch Spacecraft' : 'The spacecraft needs two fuel cells to run.')
        });
        scene.add(spacecraft);
        buildingColliders.push(spacecraft.userData.colliderBox);
    }
}

function spawnMotorcycle(position) {
    if(!position) return;
    motorcycle = GameData.vehicles.motorcycle.model();
    motorcycle.position.copy(position);
    motorcycle.castShadow = true;
    motorcycle.userData.velocity = new THREE.Vector3();
    motorcycle.userData.rotationVelocity = 0;
    motorcycle.userData.verticalVelocity = 0;
    interactables.push({
        mesh: motorcycle,
        radius: 5,
        onInteract: enterMotorcycle,
        getPrompt: () => 'Drive Hoverbike'
    });
    scene.add(motorcycle);
}

function createHitScatter(position, color = 0x888888) {
    const n = Math.floor(Math.random() * 20) + 25;
    const g = new THREE.SphereGeometry(0.05, 4, 3);
    const m = new THREE.MeshStandardMaterial({ color: color, roughness: 0.8 });
    for (let i = 0; i < n; i++) {
        const s = new THREE.Mesh(g, m);
        s.position.copy(position);
        const v = new THREE.Vector3( (Math.random() - 0.5) * 6, Math.random() * 4 + 2, (Math.random() - 0.5) * 6 );
        hitScatters.push({ mesh: s, velocity: v, lifetime: 0.5 });
        scene.add(s);
    }
}

function createExplosion(position, radius) {
    const explosionGeo = new THREE.SphereGeometry(radius, 32, 24); const explosionMat = new THREE.MeshBasicMaterial({ color: 0xffaa00, transparent: true, opacity: 0.8 });
    const explosion = new THREE.Mesh(explosionGeo, explosionMat); explosion.position.copy(position); scene.add(explosion);

    // Vahingoitetaan vihollisia
    for (let i = aliens.length - 1; i >= 0; i--) {
        const alien = aliens[i];
        if (alien.position.distanceTo(position) < radius) {
            const enemyData = GameData.enemies[alien.userData.type];
            if(enemyData.properties.isBoss) continue; 
            const color = alien.userData.type === 'flyer' ? 0xcc00ff : 0xff0000;
            createAlienDebris(alien.position, color); scene.remove(alien); aliens.splice(i, 1);
            score += enemyData.properties.score || 10;
            spawnAliens(1);
        }
    }

    // Vahingoitetaan autoja lähellä räjähdystä
    if (window.cityCars) {
        window.cityCars.forEach(car => {
            if (car.mesh && car.mesh.position.distanceTo(position) < radius + 2.0) {
                damageCarPart(car.mesh, position);
            }
        });
    }

    // Vahingoitetaan pelaajaa jos räjähdys on liian lähellä
    if (playerObject) {
        const playerPos = playerObject.position.clone().add(new THREE.Vector3(0, GameWorld.player.height / 2, 0));
        const distToPlayer = playerPos.distanceTo(position);
        if (distToPlayer < radius) {
            const maxDamage = 75;
            const splashDamage = Math.round((1 - (distToPlayer / radius)) * maxDamage);
            if (splashDamage > 0) {
                health = Math.max(0, health - splashDamage);
                lastAttackerPosition = position.clone();
                if (typeof playSound === 'function') {
                    playSound('player_damage');
                }
                if (typeof damageFlashElement !== 'undefined' && damageFlashElement) {
                    damageFlashElement.style.opacity = 0.6;
                    setTimeout(() => { damageFlashElement.style.opacity = 0; }, 120);
                }
            }
        }
    }

    let scale = 0.1;
    const animateExplosion = () => {
        scale += 0.05; explosion.scale.set(scale, scale, scale);
        explosionMat.opacity -= 0.04;
        if (explosionMat.opacity > 0) { requestAnimationFrame(animateExplosion); }
        else { scene.remove(explosion); }
    };
    animateExplosion();
}

/**
 * Creates a visual and damaging lightning bolt effect between two points.
 * @param {THREE.Vector3} startPos The starting position of the bolt.
 * @param {THREE.Vector3} endPos The ending position of the bolt.
 * @param {number} damage The amount of damage to inflict if the player is hit.
 */
function createLightningBolt(startPos, endPos, damage) {
    const distance = startPos.distanceTo(endPos);
    const direction = new THREE.Vector3().subVectors(endPos, startPos).normalize();

    const lightningBolt = new THREE.Mesh(
        new THREE.CylinderGeometry(0.2, 0.2, distance, 8),
        new THREE.MeshBasicMaterial({ color: 0xffff88, transparent: true, opacity: 0.9 })
    );

    lightningBolt.position.copy(startPos).lerp(endPos, 0.5);
    lightningBolt.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction);
    scene.add(lightningBolt);

    const pointLight = new THREE.PointLight(0xffff88, 5, 100);
    pointLight.position.copy(endPos);
    scene.add(pointLight);

    const playerHeadPos = playerObject.position.clone().add(new THREE.Vector3(0, GameWorld.player.height / 2, 0));
    if (playerHeadPos.distanceTo(endPos) < 5 && damage > 0) {
        health = Math.max(0, health - damage);
        playSound('player_damage');
        lastAttackerPosition = endPos.clone();
    }

    setTimeout(() => {
        scene.remove(lightningBolt);
        scene.remove(pointLight);
    }, 150);
}


function updateCollectibles(delta) {
    let collector = null;
    let collectorRadius = 3.2; // Kasvatettu arvosta 1.5 arvoon 3.2 helpompaa keräämistä varten
    if (player.state === 'on_foot') {
        collector = playerObject;
    } else if (player.state === 'driving_motorcycle') {
        collector = motorcycle;
        collectorRadius = 5.0;
    }

    if (!collector) return;

    // Handle single-instance items like jetpack and goggles
    const singleInstanceItems = [
        { prop: 'jetpack', itemKey: 'jetpack' },
        { prop: 'xrayGoggles', itemKey: 'xray_goggles' }
    ];
    singleInstanceItems.forEach(({ prop, itemKey }) => {
        const itemObject = collectibles[prop];
        if (itemObject && itemObject.parent && collector.position.distanceTo(itemObject.position) < collectorRadius) {
            itemObject.rotation.y += 2 * delta;
            itemObject.position.y = 1 + Math.sin(clock.getElapsedTime() * 2) * 0.2;
            
            if (prop === 'jetpack') {
                player.hasJetpack = true; 
                player.jetpackFuel = player.maxJetpackFuel;
                const jetpackHud = document.getElementById('jetpack-hud-container');
                if (jetpackHud) jetpackHud.style.display = 'flex';
            } else if (prop === 'xrayGoggles') {
                player.hasXRayGoggles = true;
            }

            scene.remove(itemObject);
            showPickupNotification(GameData.items[itemKey].name);
            collectibles[prop] = null;
            setTimeout(() => spawnItem(itemKey), GameData.items[itemKey].respawnTime);
        }
    });

    const itemArrays = [collectibles.health, collectibles.ammo, collectibles.fuelCells, collectibles.glowingOrbs];
    itemArrays.forEach((arr, arrIndex) => {
        for(let i = arr.length - 1; i >= 0; i--) {
            const p = arr[i];
            if (!p.parent) { arr.splice(i,1); continue; }

            if (p.userData.isProjectile) {
                p.position.addScaledVector(p.userData.velocity, delta);
                p.userData.velocity.y -= GRAVITY * delta;
                let projectileHit = false;
                if(p.position.y < 0.2) {
                     projectileHit = true;
                }
                if (projectileHit) { 
                    p.userData.isProjectile = false;
                    if (p.userData.type === 'glowing_orb') {
                        interactables.push({
                            mesh: p,
                            radius: 3,
                            onInteract: () => pickUpObject(p),
                            getPrompt: () => 'Pick up Orb'
                        });
                    }
                }
                continue;
            }

            p.rotation.y += 1 * delta;
            if ((p.userData.type === 'fuel_cell' || p.userData.type === 'glowing_orb') && !p.userData.fixedPosition) {
                 p.position.y = 0.8 + Math.sin(clock.getElapsedTime() * 3) * 0.2;
            }
            if(collector.position.distanceTo(p.position) < collectorRadius) {
                let collected = false;
                switch(p.userData.type) {
                    case 'health':
                        if (health < 500) { health = Math.min(500, health + GameData.items.health.properties.amount); collected = true; }
                        break;
                    case 'ammo':
                        player.ammo[p.userData.ammoType] += p.userData.amount; collected = true;
                        break;
                    case 'fuel_cell':
                         player.fuelCells++; collected = true;
                         break;
                }
                if (collected) {
                    const itemData = GameData.items[p.userData.key];
                    scene.remove(p); 
                    showPickupNotification(itemData.name);
                    arr.splice(i, 1);
                    if (itemData.respawnTime) {
                        setTimeout(() => spawnItem(p.userData.key), itemData.respawnTime);
                    }
                }
            }
        }
    });

    for(let i = collectibles.weaponPickups.length - 1; i >= 0; i--) {
        const p = collectibles.weaponPickups[i];
        p.rotation.y += 1.5 * delta;
        if(collector.position.distanceTo(p.position) < collectorRadius) {
            const wIdx = p.userData.weaponIndex;
            const wData = GameData.weapons[wIdx];
            if (!player.unlockedWeapons[wIdx]) {
                player.unlockedWeapons[wIdx] = true;
                const weaponSprite = document.getElementById(`weapon-sprite-${wIdx}`);
                if (weaponSprite) weaponSprite.style.display = 'block';
            }
            if(wData.properties.ammoType !== 'axe' && wData.properties.ammoType !== 'pistol') {
                 player.ammo[wData.properties.ammoType] += player.ammo[wData.properties.ammoType] > 0 ? 5 : 10;
            }
            scene.remove(p); 
            collectibles.weaponPickups.splice(i, 1);
            showPickupNotification(wData.name);
            if (player.state === 'on_foot') setActiveWeapon(wIdx);
        }
    }
}

function updateHitScatters(delta) {
    for (let i = hitScatters.length - 1; i >= 0; i--) {
        const s = hitScatters[i];
        s.velocity.y -= GRAVITY * 0.8 * delta;
        s.mesh.position.addScaledVector(s.velocity, delta);
        s.lifetime -= delta;
        if (s.lifetime <= 0) {
            scene.remove(s.mesh);
            hitScatters.splice(i, 1);
        }
    }
}