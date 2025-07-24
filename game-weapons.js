GameData.weapons = [
    {
        name: 'Pistol',
        description: 'Standard issue sidearm. Reliable but weak.',
        levels: ['city', 'desert', 'volcanic', 'ice', 'toxic', 'crystal'],
        properties: { fireRate: 2, ammoType: 'pistol', sound: 'gun_pistol' },
        model: (isViewModel = true) => {
            const group = new THREE.Group(); const darkMetal = new THREE.MeshStandardMaterial({ color: 0x4a4a4a, roughness: 0.3, metalness: 0.9 }); const gripMat = new THREE.MeshStandardMaterial({ color: 0x633a21, roughness: 0.7 }); const grip = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.35, 0.2), gripMat); grip.position.set(0, -0.15, 0.05); grip.rotation.x = -0.2; group.add(grip); const frame = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.18, 0.3), darkMetal); frame.position.set(0, 0.08, 0); group.add(frame); const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.4, 16), darkMetal); barrel.rotation.x = Math.PI / 2; barrel.position.set(0, 0.15, -0.35); group.add(barrel); const cylinder = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.25, 6), darkMetal); cylinder.rotation.x = Math.PI/2; cylinder.position.set(0, 0.03, 0); group.add(cylinder); const hammer = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.08, 0.05), darkMetal); hammer.position.set(0, 0.18, 0.15); group.add(hammer); group.userData.cylinder = cylinder; group.userData.hammer = hammer; if(isViewModel) { group.rotation.y = 0; } return group;
        },
        fireAnimation: (gun) => {
            gun.userData.cylinder.rotation.z += Math.PI / 3;
            gun.userData.hammer.position.z -= 0.05;
            setTimeout(() => { gun.userData.hammer.position.z += 0.05; }, 50);
            gun.position.z += 0.15;
        }
    },
    {
        name: 'Shotgun',
        description: 'Devastating at close range. Fires a spread of pellets.',
        levels: ['city', 'desert', 'volcanic', 'ice', 'toxic', 'crystal'],
        properties: { fireRate: 1.5, ammoType: 'shotgun', pellets: 8, spread: 0.08, sound: 'gun_shotgun' },
        model: (isViewModel = true) => {
            const group = new THREE.Group(); const wood = new THREE.MeshStandardMaterial({ color: 0x804b28, roughness: 0.7 }); const metal = new THREE.MeshStandardMaterial({ color: 0x3d3d3d, roughness: 0.4, metalness: 1.0 }); const stock = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.2, 0.6), wood); stock.position.set(0, -0.05, 0.6); group.add(stock); const receiver = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.7, 24), metal); receiver.rotation.x = Math.PI / 2; receiver.position.set(0, 0, 0.1); group.add(receiver); const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.2, 16), metal); barrel.rotation.x = Math.PI / 2; barrel.position.set(0, 0.08, -0.85); group.add(barrel); const pump = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.5, 16), wood); pump.rotation.x = Math.PI / 2; pump.position.set(0, -0.05, -0.6); group.add(pump); if(isViewModel) { group.rotation.y = 0; } return group;
        },
        fireAnimation: (gun) => { gun.position.z += 0.4; }
    },
    {
        name: 'Machine Gun',
        description: 'High fire rate, but chews through ammo quickly.',
        levels: ['city', 'desert', 'volcanic', 'ice', 'toxic', 'crystal'],
        properties: { fireRate: 10, ammoType: 'machinegun', spread: 0.05, sound: 'gun_machinegun' },
        model: (isViewModel = true) => {
            const group = new THREE.Group(); const metal = new THREE.MeshStandardMaterial({ color: 0x445544, roughness: 0.6, metalness: 0.8 }); const body = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.25, 0.9), metal); group.add(body); const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.0, 12), metal); barrel.rotation.x = Math.PI/2; barrel.position.set(0, 0, -0.95); group.add(barrel); const magazine = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.4, 0.15), metal); magazine.position.set(0, -0.3, -0.1); group.add(magazine); const handle = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.2, 0.5), metal); handle.position.set(0, 0.22, -0.1); group.add(handle); if(isViewModel) { group.rotation.y = 0; } return group;
        },
        fireAnimation: (gun) => { gun.position.z += 0.15; }
    },
    {
        name: 'Rocket Launcher',
        description: 'Fires explosive rockets with a large blast radius.',
        levels: ['city', 'desert', 'volcanic', 'ice', 'toxic', 'crystal'],
        properties: { fireRate: 0.8, ammoType: 'rocket', projectileSpeed: 60, splashRadius: 8, sound: 'gun_rocket' },
        model: (isViewModel = true) => {
            const group = new THREE.Group(); const greenMetal = new THREE.MeshStandardMaterial({ color: 0x3d553d, roughness: 0.6, metalness: 0.8 }); const darkMetal = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.5, metalness: 0.9 }); const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 1.8, 24), greenMetal); tube.rotation.x = Math.PI / 2; tube.position.z = -0.9; group.add(tube); const grip = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.3, 0.15), darkMetal); grip.position.set(0, -0.2, -0.5); group.add(grip); const scope = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.15, 0.3), darkMetal); scope.position.set(-0.2, 0.1, -0.7); group.add(scope); if(isViewModel) { group.rotation.y = Math.PI; } return group;
        },
        fireAnimation: (gun) => { gun.position.z += 0.6; }
    },
    {
        name: 'Plasma Gun',
        description: 'Shoots fast-moving, homing plasma rings.',
        levels: ['city', 'desert', 'volcanic', 'ice', 'toxic', 'crystal'],
        properties: { fireRate: 15, ammoType: 'plasma', projectileSpeed: 80, sound: 'gun_plasma' },
        model: (isViewModel = true) => {
            const group = new THREE.Group(); const bodyMat = new THREE.MeshStandardMaterial({ color: 0x2a2a3a, roughness: 0.4, metalness: 0.9 }); const plasmaMat = new THREE.MeshStandardMaterial({ color: 0xff00ff, emissive: 0xff00ff, emissiveIntensity: 2.5 }); const casingMat = new THREE.MeshStandardMaterial({ color: 0x3a3a4a, roughness: 0.5, metalness: 0.8 }); const mainBody = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.25, 0.8), bodyMat); mainBody.position.z = 0.2; group.add(mainBody); const stock = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.22, 0.6), bodyMat); stock.position.set(0, -0.05, 0.8); group.add(stock); const grip = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.4, 0.18), casingMat); grip.position.set(0, -0.2, 0.3); grip.rotation.x = -0.2; group.add(grip); const barrelCasing = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 1.2, 16), casingMat); barrelCasing.rotation.x = Math.PI / 2; barrelCasing.position.z = -0.8; group.add(barrelCasing); const muzzle = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.15, 16), bodyMat); muzzle.rotation.x = Math.PI / 2; muzzle.position.z = -1.45; group.add(muzzle); for (let i = 0; i < 4; i++) { const coil = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.02, 8, 24), plasmaMat); coil.rotation.x = Math.PI / 2; coil.position.z = -0.4 - i * 0.25; group.add(coil); } if(isViewModel) { group.rotation.y = 0; } return group;
        },
        fireAnimation: (gun) => { gun.position.z += 0.15; }
    },
    {
        name: 'Grenade Launcher',
        description: 'Lob explosive grenades that split into smaller clusters.',
        levels: ['city', 'desert', 'volcanic', 'ice', 'toxic', 'crystal'],
        properties: { fireRate: 1, ammoType: 'grenade', projectileSpeed: 30, projectileLift: 15, clusterCount: 8, clusterSpeed: 25, splashRadius: 6, clusterSplashRadius: 3.5, sound: 'gun_grenade' },
        model: (isViewModel = true) => {
            const group = new THREE.Group(); const darkMetal = new THREE.MeshStandardMaterial({ color: 0x333, roughness: 0.5, metalness: 1 }); const orangePlastic = new THREE.MeshStandardMaterial({ color: 0xde651e, roughness: 0.6 }); const body = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 0.6), darkMetal); group.add(body); const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.8, 16), darkMetal); barrel.rotation.x = Math.PI / 2; barrel.position.z = -0.7; group.add(barrel); const stock = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.15, 0.4), orangePlastic); stock.position.set(0, -0.05, 0.5); group.add(stock); const grip = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.3, 0.15), orangePlastic); grip.position.set(0, -0.15, 0.1); group.add(grip); if (isViewModel) { group.rotation.y = 0; } return group;
        },
        fireAnimation: (gun) => { gun.position.z += 0.15; }
    },
    {
        name: 'Battle Axe',
        description: 'A brutal melee weapon. Can chop through alien vegetation.',
        levels: ['city', 'desert', 'volcanic', 'ice', 'toxic', 'crystal'],
        properties: { fireRate: 1.2, ammoType: 'axe', range: 3.5, sound: 'gun_axe' },
        model: (isViewModel = true) => {
            const group = new THREE.Group();
            const handleMat = new THREE.MeshStandardMaterial({ color: 0x5a3b2a, roughness: 0.8 });
            const bladeMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 1.0, roughness: 0.3 });
            const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 1.8), handleMat);
            group.add(handle);
            const bladeShape = new THREE.Shape();
            bladeShape.moveTo(0, 0); bladeShape.lineTo(0.5, 0.1); bladeShape.quadraticCurveTo(0.7, 0.5, 0.5, 0.9); bladeShape.lineTo(0, 0.8); bladeShape.quadraticCurveTo(0.1, 0.5, 0, 0);
            const extrudeSettings = { depth: 0.08, bevelEnabled: false };
            const bladeGeo = new THREE.ExtrudeGeometry(bladeShape, extrudeSettings);
            const blade = new THREE.Mesh(bladeGeo, bladeMat);
            blade.position.set(-0.02, 0.5, -0.04);
            blade.rotation.y = Math.PI / 2 + Math.PI;
            group.add(blade);
            
            const hitPoint = new THREE.Object3D();
            hitPoint.position.set(0.3, 1.3, -0.04);
            group.add(hitPoint);
            group.userData.hitPoint = hitPoint;

            group.userData.animation = { state: 'idle', progress: 0, hasHit: false };

            if(isViewModel) {
                const idlePos = new THREE.Vector3(0.3, -0.6, -0.6); 
                const idleRot = new THREE.Euler(0, Math.PI + 0.5, 0.2);
                group.position.copy(idlePos);
                group.rotation.copy(idleRot);
            }
            return group;
        },
        fireAnimation: (gun) => {
            if (gun.userData.animation.state === 'idle') {
                gun.userData.animation.state = 'winding_down';
                gun.userData.animation.progress = 0;
                gun.userData.animation.hasHit = false;
            }
        },
        updateAnimation: (gun, delta, playerObject, aliens, vegetation) => {
            const anim = gun.userData.animation;
            const idlePos = new THREE.Vector3(0.3, -0.6, -0.6);
            const idleRot = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.PI + 0.5, 0.2));
            const windDownPos = new THREE.Vector3(0.4, -0.9, -1.1);
            const windDownRot = new THREE.Quaternion().setFromEuler(new THREE.Euler(1.2, Math.PI + 0.2, -0.3));
            const windDownDuration = 0.25;
            const swingUpPos = new THREE.Vector3(0.1, 0.1, -0.3);
            const swingUpRot = new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.8, Math.PI + 0.9, 0.6));
            const swingUpDuration = 0.12;
            switch(anim.state) {
                case 'winding_down': {
                    anim.progress += delta;
                    const alpha = Math.min(anim.progress / windDownDuration, 1.0);
                    gun.position.lerpVectors(idlePos, windDownPos, alpha);
                    gun.quaternion.slerpQuaternions(idleRot, windDownRot, alpha);
                    if (alpha >= 1.0) {
                        anim.state = 'swinging_up';
                        anim.progress = 0;
                    }
                    break;
                }
                case 'swinging_up': {
                    anim.progress += delta;
                    const alpha = Math.min(anim.progress / swingUpDuration, 1.0);
                    gun.position.lerpVectors(windDownPos, swingUpPos, alpha);
                    gun.quaternion.slerpQuaternions(windDownRot, swingUpRot, alpha);
                    if (!anim.hasHit && alpha > 0.2 && alpha < 0.9) {
                        const weaponHitPoint = new THREE.Vector3();
                        gun.userData.hitPoint.getWorldPosition(weaponHitPoint);
                        let hitSomething = false;
                        if (vegetation) {
                            for (let j = vegetation.length - 1; j >= 0; j--) {
                                const v = vegetation[j];
                                if (v.position.distanceTo(weaponHitPoint) < 2.0) {
                                    scene.remove(v);
                                    vegetation.splice(j, 1);
                                    hitSomething = true;
                                    break;
                                }
                            }
                        }
                        for (let j = aliens.length - 1; j >= 0; j--) {
                            const a = aliens[j];
                            if (a.position.distanceTo(weaponHitPoint) < 1.8) {
                                const enemyData = GameData.enemies[a.userData.type];
                                createAlienDebris(a.position, 0xff0000);
                                scene.remove(a);
                                aliens.splice(j, 1);
                                score += enemyData.properties.score || 10;
                                spawnAliens(1);
                                hitSomething = true;
                                break; 
                            }
                        }
                        if (hitSomething) anim.hasHit = true;
                    }
                    if (alpha >= 1.0) {
                        anim.state = 'idle';
                        anim.progress = 0;
                    }
                    break;
                }
                case 'idle': {
                    gun.position.lerp(idlePos, 12 * delta);
                    gun.quaternion.slerp(idleRot, 12 * delta);
                    break;
                }
            }
        }
    },
    {
        name: 'Sniper Rifle',
        description: 'Long-range precision rifle with adjustable zoom.',
        levels: ['city', 'desert', 'ice'],
        properties: { 
            fireRate: 0.8, 
            ammoType: 'sniper', 
            sound: 'gun_sniper',
            zoom: { min: 15, max: 60, default: 75, step: 5 }
        },
        model: (isViewModel = true) => {
            const group = new THREE.Group();
            const bodyMat = new THREE.MeshStandardMaterial({ color: 0x22252a, roughness: 0.4, metalness: 0.9 });
            const scopeMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.3, metalness: 1.0 });

            const stock = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.2, 0.8), bodyMat);
            stock.position.set(0, -0.05, 0.7);
            group.add(stock);
            
            const body = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.18, 1.2), bodyMat);
            group.add(body);
            
            const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.5, 12), bodyMat);
            barrel.rotation.x = Math.PI / 2;
            barrel.position.set(0, 0, -1.35);
            group.add(barrel);
            
            const scope = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.6, 16), scopeMat);
            scope.rotation.x = Math.PI/2;
            scope.position.set(0, 0.18, -0.3);
            group.add(scope);

            const magazine = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.3, 0.2), bodyMat);
            magazine.position.set(0, -0.15, 0);
            group.add(magazine);

            if(isViewModel) { group.rotation.y = 0; }
            return group;
        },
        fireAnimation: (gun) => { gun.position.z += 0.3; gun.rotation.x -= 0.05; setTimeout(() => { gun.rotation.x += 0.05; }, 100); }
    },
    {
        name: 'Black Hole Gun',
        description: 'Fires a miniature singularity that traps and destroys nearby enemies.',
        levels: ['crystal'],
        properties: { 
            fireRate: 0.2, 
            ammoType: 'blackhole', 
            projectileSpeed: 20, 
            life: 8, // seconds the black hole is active
            suckRadius: 25,
            sound: 'gun_blackhole' 
        },
        model: (isViewModel = true) => {
            const group = new THREE.Group();
            const bodyMat = new THREE.MeshStandardMaterial({color: 0x1a1a2a, metalness: 1.0, roughness: 0.2});
            const energyMat = new THREE.MeshStandardMaterial({color: 0x9900ff, emissive: 0x9900ff, emissiveIntensity: 2.0});

            const body = new THREE.Mesh(new THREE.SphereGeometry(0.4, 16, 8), bodyMat);
            body.scale.z = 2.0;
            group.add(body);

            const core = new THREE.Mesh(new THREE.IcosahedronGeometry(0.2, 1), energyMat);
            group.add(core);

            for (let i = 0; i < 3; i++) {
                const ring = new THREE.Mesh(new THREE.TorusGeometry(0.8, 0.05, 8, 32), bodyMat);
                ring.rotation.x = Math.PI / 2;
                ring.position.z = (i - 1) * 0.4;
                group.add(ring);
            }
            group.userData.core = core;

            if(isViewModel) { group.rotation.y = 0; }
            return group;
        },
        fireAnimation: (gun) => {
             gun.position.z += 0.2;
             gun.userData.core.scale.setScalar(1.5);
             setTimeout(() => { gun.userData.core.scale.setScalar(1.0); }, 100);
        }
    }
];

function shoot() {
    if (player.weaponCooldown > 0) return;
    
    const w = GameData.weapons[player.currentWeaponIndex];
    if (player.ammo[w.properties.ammoType] <= 0) return;
    
    player.weaponCooldown = 1 / w.properties.fireRate;
    if(w.properties.ammoType !== 'axe') player.ammo[w.properties.ammoType]--;
    playSound(w.properties.sound);

    const gun = gunModels[player.currentWeaponIndex];
    if (w.fireAnimation) w.fireAnimation(gun);
    if (w.name === 'Machine Gun' || w.name === 'Plasma Gun') ejectCasing();

    const pS = new THREE.Vector3(); camera.getWorldPosition(pS);
    const d = new THREE.Vector3(); camera.getWorldDirection(d);

    if (w.name === 'Rocket Launcher') {
        const rocket = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.6, 12), new THREE.MeshStandardMaterial({color: 0xffcc00, emissive: 0xffaa00, emissiveIntensity: 2}));
        rocket.position.copy(pS).add(d.clone().multiplyScalar(1.5));
        rocket.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d);
        rocket.userData.velocity = d.multiplyScalar(w.properties.projectileSpeed);
        rocket.userData.life = 5;
        rockets.push(rocket); scene.add(rocket);
        return;
    }
    if (w.name === 'Plasma Gun') {
        const ringGeo = new THREE.TorusGeometry(0.6, 0.1, 8, 32); const ringMat = new THREE.MeshStandardMaterial({color: 0xff00ff, emissive: 0xff00ff, emissiveIntensity: 3});
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.position.copy(pS).add(d.clone().multiplyScalar(1.5));
        ring.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d);
        ring.userData.velocity = d.multiplyScalar(w.properties.projectileSpeed);
        ring.userData.spin = new THREE.Vector3(Math.random()-0.5, Math.random()-0.5, Math.random()-0.5).normalize().multiplyScalar(20);
        ring.userData.life = 4;
        plasmaRings.push(ring); scene.add(ring);
        return;
    }
    if (w.name === 'Grenade Launcher') {
        const grenadeGeo = new THREE.SphereGeometry(0.2, 12, 8); const grenadeMat = new THREE.MeshStandardMaterial({color: 0xde651e, roughness: 0.4});
        const grenade = new THREE.Mesh(grenadeGeo, grenadeMat);
        grenade.position.copy(pS).add(d.clone().multiplyScalar(1.5));
        grenade.userData.velocity = d.multiplyScalar(w.properties.projectileSpeed).add(new THREE.Vector3(0, w.properties.projectileLift, 0));
        grenade.userData.spin = new THREE.Vector3(Math.random()-0.5, Math.random()-0.5, Math.random()-0.5).multiplyScalar(10);
        grenades.push(grenade); scene.add(grenade);
        return;
    }
    if (w.name === 'Black Hole Gun') {
        const bhMat = new THREE.MeshBasicMaterial({color: 0x000000});
        const bh = new THREE.Mesh(new THREE.SphereGeometry(0.3, 16, 12), bhMat);
        bh.position.copy(pS).add(d.clone().multiplyScalar(2.0));
        bh.userData.velocity = d.multiplyScalar(w.properties.projectileSpeed);
        bh.userData.life = w.properties.life;
        bh.userData.state = 'projectile'; // states: 'projectile', 'active'
        blackHoles.push(bh); scene.add(bh);
        return;
    }
    if (w.name === 'Battle Axe') {
        return;
    }

    const pellets = w.properties.pellets || 1;
    for (let i = 0; i < pellets; i++) {
        const bullet = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 8), new THREE.MeshBasicMaterial({ color: 0xffff00, emissive: 0xffff00, emissiveIntensity: 5 }));
        const shotDirection = d.clone();
        const spread = w.properties.spread || 0;
        shotDirection.x += (Math.random() - 0.5) * spread; shotDirection.y += (Math.random() - 0.5) * spread; shotDirection.z += (Math.random() - 0.5) * spread;
        bullet.position.copy(pS);
        bullet.userData.velocity = shotDirection.multiplyScalar(w.name === 'Sniper Rifle' ? 400 : 100);
        bullets.push(bullet);
        scene.add(bullet);
    }
}

function ejectCasing() {
    const casingMaterial = new THREE.MeshStandardMaterial({color: 0xddaa00, metalness: 1.0, roughness: 0.4});
    const casingGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.1, 8);
    const casing = new THREE.Mesh(casingGeo, casingMaterial);
    const forward = new THREE.Vector3(0,0,-1).applyQuaternion(camera.quaternion);
    const up = new THREE.Vector3(0,1,0).applyQuaternion(camera.quaternion);
    const right = new THREE.Vector3(1,0,0).applyQuaternion(camera.quaternion);
    casing.position.copy(playerObject.position).add(up.multiplyScalar(GameWorld.player.height-0.2)).add(right.multiplyScalar(0.7));
    const ejectVel = right.clone().multiplyScalar(3 + Math.random()).add(up.clone().multiplyScalar(2 + Math.random())).add(forward.clone().multiplyScalar(Math.random() * -1));
    casing.userData.velocity = ejectVel; casing.userData.life = 2.0;
    casing.userData.spin = new THREE.Vector3(Math.random()*20-10, Math.random()*20-10, Math.random()*20-10);
    shellCasings.push(casing); scene.add(casing);
}

function explodeGrenade(position) {
    const wProps = GameData.weapons[5].properties;
    createExplosion(position, wProps.splashRadius);
    for (let i = 0; i < wProps.clusterCount; i++) {
        const clusterGeo = new THREE.SphereGeometry(0.15, 8, 6); const clusterMat = new THREE.MeshBasicMaterial({ color: 0xff4500, emissive: 0xff4500, emissiveIntensity: 4 });
        const c = new THREE.Mesh(clusterGeo, clusterMat);
        c.position.copy(position);
        c.userData.velocity = new THREE.Vector3(Math.random()-0.5, Math.random()-0.5, Math.random()-0.5).normalize().multiplyScalar(wProps.clusterSpeed);
        c.userData.life = 1.0;
        clusters.push(c); scene.add(c);
    }
}

function updateGun(delta) {
    const isGunVisible = !player.carriedObject && player.state === 'on_foot';
    gunModels.forEach(g => g.visible = false);
    
    if (isGunVisible) {
        const gun = gunModels[player.currentWeaponIndex];
        gun.visible = true;
        const weaponData = GameData.weapons[player.currentWeaponIndex];

        if (weaponData.updateAnimation) {
            weaponData.updateAnimation(gun, delta, playerObject, aliens, vegetation);
        } else {
            gun.position.lerp(gunBasePosition, 15 * delta);
        }
    }
}

function updateBullets(delta) {
    for (let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i];
        b.position.add(b.userData.velocity.clone().multiplyScalar(delta));
        let hit = false;
        const bulletBox = new THREE.Box3().setFromObject(b);
        if (checkBuildingCollision(bulletBox)) {
            hit = true; createHitScatter(b.position);
        }
        if (b.position.y <= 0) {
            hit = true; createHitScatter(b.position);
        }
        if (!hit) {
            for (let j = aliens.length - 1; j >= 0; j--) {
                const a = aliens[j];
                const enemyProps = GameData.enemies[a.userData.type].properties;
                const hitRadius = (a.userData.type === 'cyborg' ? 2.0 : (a.userData.type === 'stingray' ? 8.0 : (a.userData.type === 'shard_roller' ? 1.5 : 1.2)));
                if (a.userData.state === 'dying') continue;
                if (b.position.distanceTo(a.position) < hitRadius) {
                    hit = true;
                    a.userData.health--;
                    if (a.userData.health <= 0) {
                        score += enemyProps.score || 10;
                        
                        if (a.userData.type === 'shard_roller') {
                            spawnShardMites(a.position);
                            scene.remove(a);
                            aliens.splice(j, 1);
                        } else {
                            const deathSound = a.userData.type === 'cyborg' ? 'cyborg_death' : 'alien_death';
                            playSound(deathSound);
                            if (a.userData.type === 'cyborg') {
                                a.userData.state = 'dying'; a.userData.animationProgress = 0;
                            } else {
                               let color = 0xff0000;
                               if(a.userData.type === 'tentacle') color = 0x00ff00;
                               if(a.userData.type === 'shard_mite') color = 0xeeccff;
                               createAlienDebris(a.position, color);
                               
                               scene.remove(a);
                               aliens.splice(j, 1);
                               spawnAliens(1);
                            }
                        }
                    // MODIFIED: Added an else-if block to handle non-lethal hits on tentacles.
                    } else if (a.userData.type === 'tentacle') {
                        // Create a green particle spray when a tentacle is hit.
                        createHitScatter(b.position, 0x00ff00);
                    } else if (a.userData.type === 'cyborg') {
                         createHitScatter(b.position);
                    }
                    break;
                }
            }
        }
        if (hit || b.position.length() > 500) {
            scene.remove(b); bullets.splice(i, 1);
        }
    }
}
function updateRockets(delta) { for (let i = rockets.length - 1; i >= 0; i--) { const r = rockets[i]; r.position.add(r.userData.velocity.clone().multiplyScalar(delta)); r.userData.life -= delta; let hit = false; for (let j = aliens.length - 1; j >= 0; j--) { if (r.position.distanceTo(aliens[j].position) < 2.0) { hit = true; break; } } const rocketBox = new THREE.Box3().setFromObject(r); if (!hit && checkBuildingCollision(rocketBox)) { hit = true; } if (r.position.y < 0.2 || r.userData.life <= 0) { hit = true; } if (hit) { createHitScatter(r.position, 0xffff00); createExplosion(r.position, GameData.weapons[3].properties.splashRadius); scene.remove(r); rockets.splice(i, 1); } } }

function updatePlasmaRings(delta) {
    for (let i = plasmaRings.length - 1; i >= 0; i--) {
        const ring = plasmaRings[i];
        
        let closestAlien = null;
        let minDistance = Infinity;
        aliens.forEach(alien => {
            const d = ring.position.distanceTo(alien.position);
            if(d < minDistance) {
                minDistance = d;
                closestAlien = alien;
            }
        });

        if (closestAlien && minDistance < 50) {
            const direction = new THREE.Vector3().subVectors(closestAlien.position, ring.position).normalize();
            ring.userData.velocity.lerp(direction.multiplyScalar(GameData.weapons[4].properties.projectileSpeed), 0.03);
        }
        
        ring.position.add(ring.userData.velocity.clone().multiplyScalar(delta));
        ring.rotation.x += ring.userData.spin.x * delta;
        ring.rotation.y += ring.userData.spin.y * delta;
        ring.rotation.z += ring.userData.spin.z * delta;
        ring.userData.life -= delta;
        let hit = false;
        
        const ringBox = new THREE.Box3().setFromObject(ring);
        if (checkBuildingCollision(ringBox)) {
            hit = true; createHitScatter(ring.position);
        }

        if (!hit) {
            for (let j = aliens.length - 1; j >= 0; j--) {
                const a = aliens[j];
                if (ring.position.distanceTo(a.position) < 1.5) {
                    const color = a.userData.type === 'flyer' ? 0xcc00ff : 0xff0000;
                    createAlienDebris(a.position, color);
                    scene.remove(a);
                    aliens.splice(j, 1);
                    score += GameData.enemies[a.userData.type].properties.score || 10;
                    spawnAliens(1);
                    hit = true;
                    break;
                }
            }
        }
        
        if (hit || ring.userData.life <= 0) {
            scene.remove(ring); plasmaRings.splice(i, 1);
        }
    }
}
function updateGrenades(delta) { for (let i = grenades.length - 1; i >= 0; i--) { const g = grenades[i]; g.userData.velocity.y -= GRAVITY * delta; g.position.add(g.userData.velocity.clone().multiplyScalar(delta)); g.rotation.x += g.userData.spin.x * delta; g.rotation.y += g.userData.spin.y * delta; g.rotation.z += g.userData.spin.z * delta; let hit = false; const grenadeBox = new THREE.Box3().setFromObject(g); if (checkBuildingCollision(grenadeBox) || g.position.y <= 0.2) { hit = true; } if (!hit) { for (let j = aliens.length - 1; j >= 0; j--) { if (g.position.distanceTo(aliens[j].position) < 1.5) { hit = true; break; } } } if (hit) { createHitScatter(g.position, 0xffff00); explodeGrenade(g.position); scene.remove(g); grenades.splice(i, 1); } } }
function updateClusters(delta) { for (let i = clusters.length - 1; i >= 0; i--) { const c = clusters[i]; c.position.add(c.userData.velocity.clone().multiplyScalar(delta)); c.userData.life -= delta; let hit = false; const clusterBox = new THREE.Box3().setFromObject(c); if (checkBuildingCollision(clusterBox) || c.position.y <= 0.1) { hit = true; } if (!hit) { for (let j = aliens.length - 1; j >= 0; j--) { if (c.position.distanceTo(aliens[j].position) < 1.0) { hit = true; break; } } } if (hit || c.userData.life <= 0) { createHitScatter(c.position, 0xffff00); createExplosion(c.position, GameData.weapons[5].properties.clusterSplashRadius); scene.remove(c); clusters.splice(i, 1); } } }
function updateShellCasings(delta) { for (let i = shellCasings.length - 1; i >= 0; i--) { const s = shellCasings[i]; s.userData.velocity.y -= GRAVITY * 0.6 * delta; s.position.add(s.userData.velocity.clone().multiplyScalar(delta)); s.rotation.x += s.userData.spin.x * delta; s.rotation.y += s.userData.spin.y * delta; s.rotation.z += s.userData.spin.z * delta; s.userData.life -= delta; if (s.userData.life <= 0) { scene.remove(s); shellCasings.splice(i, 1); } } }
function updateBlackHoles(delta) {
    for (let i = blackHoles.length - 1; i >= 0; i--) {
        const bh = blackHoles[i];
        const wProps = GameData.weapons[8].properties;

        if (bh.userData.state === 'projectile') {
            bh.position.add(bh.userData.velocity.clone().multiplyScalar(delta));
            const bhBox = new THREE.Box3().setFromObject(bh);
            let hit = false;
            if (checkBuildingCollision(bhBox) || bh.position.y <= 0.2) {
                hit = true;
            }
            if (bh.position.length() > 500) {
                hit = true;
            }
            if (hit) {
                bh.userData.state = 'active';
                const eventHorizon = new THREE.Mesh(
                    new THREE.SphereGeometry(2, 32, 24),
                    new THREE.MeshBasicMaterial({color: 0x9900ff, transparent: true, opacity: 0.3, blending: THREE.AdditiveBlending})
                );
                bh.add(eventHorizon);
                playSound('blackhole_open');
            }
        } else if (bh.userData.state === 'active') {
            bh.userData.life -= delta;
            bh.rotation.y += delta * 2.0;

            for(let j = aliens.length - 1; j >= 0; j--) {
                const a = aliens[j];
                const dist = a.position.distanceTo(bh.position);
                if (dist < wProps.suckRadius) {
                    if (dist < 1.5) {
                        createAlienDebris(a.position, 0x9900ff);
                        scene.remove(a);
                        aliens.splice(j, 1);
                        score += GameData.enemies[a.userData.type].properties.score || 10;
                    } else {
                        const pullDirection = new THREE.Vector3().subVectors(bh.position, a.position).normalize();
                        const pullForce = (1 - (dist / wProps.suckRadius)) * 80;
                        a.position.add(pullDirection.multiplyScalar(pullForce * delta));
                    }
                }
            }

            if (bh.userData.life <= 0) {
                scene.remove(bh);
                blackHoles.splice(i, 1);
                playSound('blackhole_close');
            }
        }
    }
}