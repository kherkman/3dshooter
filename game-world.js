const GameWorld = {

    levelOrder: ['city', 'desert', 'volcanic', 'ice', 'toxic', 'crystal'],

    player: {
        height: 1.8,
        speed: 80.0,
        jumpHeight: 8.0,
        damping: 0.9,
        initialState: {
            state: 'on_foot',
            hasJetpack: false,
            jetpackFuel: 0,
            maxJetpackFuel: 100,
            unlockedWeapons: [true, false, false, false, false, false, false, false, false],
            currentWeaponIndex: 0,
            weaponCooldown: 0,
            ammo: { pistol: Infinity, shotgun: 0, machinegun: 0, rocket: 0, plasma: 0, grenade: 0, axe: Infinity, sniper: 0, blackhole: 0 },
            fuelCells: 0,
            carriedObject: null, 
            isSafeInBunker: false,
            isSafeInShelter: false,
            hasXRayGoggles: false,
            xrayGogglesActive: false,
            gogglesBattery: 20,
            maxGogglesBattery: 20,
            gogglesCooldown: 0,
        }
    },
    
    levels: {
        city: {
            name: 'City',
            musicFile: 'music_city.mp3',
            spawnRange: 190,
            initialAlienCount: 15,
            fogColor: 0x8899aa,
            create: (scene, buildingColliders) => {
                const mistColor = GameWorld.levels.city.fogColor;
                scene.background = new THREE.Color(mistColor);
                scene.fog = new THREE.Fog(mistColor, 0, 70);
                const hemisphereLight = new THREE.HemisphereLight(0xffdcb1, 0x444455, 1.2); scene.add(hemisphereLight);
                const directionalLight = new THREE.DirectionalLight(0xffa500, 0.7); directionalLight.position.set(50, 50, 25); directionalLight.castShadow = true; directionalLight.shadow.mapSize.width = 2048; directionalLight.shadow.mapSize.height = 2048; directionalLight.shadow.camera.left = -100; directionalLight.shadow.camera.right = 100; directionalLight.shadow.camera.top = 100; directionalLight.shadow.camera.bottom = -100; scene.add(directionalLight);
                
                // City Ground using cityfloor.jpg when textures are enabled
                const groundMat = new THREE.MeshStandardMaterial({ 
                    color: (gameSettings.texturesEnabled && window.cityFloorTexture) ? 0xffffff : 0x4a4a4a, 
                    map: (gameSettings.texturesEnabled && window.cityFloorTexture) ? window.cityFloorTexture : null,
                    roughness: 0.9 
                });
                const ground = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), groundMat); ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
                
                const padHeight = 0.2;
                const landingPadGeo = new THREE.CylinderGeometry(15, 15, padHeight, 32);
                const landingPadMat = new THREE.MeshStandardMaterial({color: 0x222228, metalness: 0.5, roughness: 0.8});
                const landingPad = new THREE.Mesh(landingPadGeo, landingPadMat);
                landingPad.position.set(50, padHeight / 2, 50);
                landingPad.receiveShadow = true;
                scene.add(landingPad);
                
                const rampStepCount = 10; const rampLength = 15; const rampWidth = 8; const stepHeight = padHeight / rampStepCount; const stepLength = rampLength / rampStepCount; const rampMat = new THREE.MeshStandardMaterial({color: 0x333338, metalness: 0.5, roughness: 0.8}); const rampEndZ = 50 + 15;
                for (let i = 0; i < rampStepCount; i++) {
                    const stepGeo = new THREE.BoxGeometry(rampWidth, stepHeight, stepLength + 0.01);
                    const step = new THREE.Mesh(stepGeo, rampMat);
                    step.position.set(50, (i * stepHeight) + (stepHeight / 2), rampEndZ + (rampLength / 2) - (i * stepLength) - (stepLength / 2));
                    step.receiveShadow = true; scene.add(step);
                }
                
                // City Windows and Buildings using wall.jpg and window.jpg when textures are enabled
                const bG = new THREE.BoxGeometry(1, 1, 1); const wG = new THREE.BoxGeometry(0.8, 1.6, 0.1); 
                const wM = new THREE.MeshStandardMaterial({ 
                    color: (gameSettings.texturesEnabled && window.cityWindowTexture) ? 0xffffff : 0xffaa00,
                    map: (gameSettings.texturesEnabled && window.cityWindowTexture) ? window.cityWindowTexture : null,
                    emissive: 0xffaa00, 
                    emissiveIntensity: gameSettings.texturesEnabled ? 0.3 : 1.5 
                }); 
                const sR = 15.0; 
                const wallCandidates = [];
                const propPlacementCandidates = [];

                for (let i = 0; i < 200; i++) { 
                    const p = new THREE.Vector2((Math.random() - 0.5) * 190, (Math.random() - 0.5) * 190); 
                    if (p.distanceTo(new THREE.Vector2(0,10)) < sR || p.distanceTo(new THREE.Vector2(50,50)) < 30) continue; 
                    const w = Math.random() * 8 + 6; 
                    const d = Math.random() * 8 + 6; 
                    const h = Math.random() * 40 + 15; 
                    let c = new THREE.Color(); 
                    if (Math.random() > 0.4) { 
                        const b = Math.random() * 0.2 + 0.2; 
                        c.setRGB(b, b * 0.7, b * 0.5); 
                    } else { 
                        const g = Math.random() * 0.3 + 0.2; 
                        c.setRGB(g, g, g); 
                    } 
                    const bM = new THREE.MeshStandardMaterial({ 
                        color: (gameSettings.texturesEnabled && window.cityWallTexture) ? 0xffffff : c, 
                        map: (gameSettings.texturesEnabled && window.cityWallTexture) ? window.cityWallTexture : null,
                        roughness: 0.9, 
                        metalness: 0.2 
                    }); 
                    const b = new THREE.Mesh(bG, bM); b.scale.set(w, h, d); b.position.set(p.x, h / 2, p.y); b.castShadow = true; b.receiveShadow = true; scene.add(b); buildingColliders.push(new THREE.Box3().setFromObject(b)); 
                    
                    const groundY = 2.2;
                    const offset = 0.03; 
                    wallCandidates.push(
                        { pos: new THREE.Vector3(p.x, groundY, p.y + d / 2 + offset), rotY: 0 },
                        { pos: new THREE.Vector3(p.x, groundY, p.y - d / 2 - offset), rotY: Math.PI },
                        { pos: new THREE.Vector3(p.x + w / 2 + offset, groundY, p.y), rotY: Math.PI / 2 },
                        { pos: new THREE.Vector3(p.x - w / 2 - offset, groundY, p.y), rotY: -Math.PI / 2 }
                    );

                    const propOffset = 1.4;
                    propPlacementCandidates.push(
                        { pos: new THREE.Vector3(p.x + (Math.random() - 0.5) * (w - 1.5), 0, p.y + d / 2 + propOffset), rotY: 0 },
                        { pos: new THREE.Vector3(p.x + (Math.random() - 0.5) * (w - 1.5), 0, p.y - d / 2 - propOffset), rotY: Math.PI },
                        { pos: new THREE.Vector3(p.x + w / 2 + propOffset, 0, p.y + (Math.random() - 0.5) * (d - 1.5)), rotY: Math.PI / 2 },
                        { pos: new THREE.Vector3(p.x - w / 2 - propOffset, 0, p.y + (Math.random() - 0.5) * (d - 1.5)), rotY: -Math.PI / 2 }
                    );

                    const wS = 2.0; 
                    for (let y = wS * 2; y < h - wS; y += wS * 1.5) { 
                        for (let x = -w / 2 + wS; x < w / 2 - wS; x += wS) { 
                            if (Math.random() > 0.3) { 
                                const win = new THREE.Mesh(wG, wM); win.position.set(p.x + x, y, p.y + d / 2 + 0.01); scene.add(win); 
                            } 
                            if (Math.random() > 0.3) { 
                                const win = new THREE.Mesh(wG, wM); win.position.set(p.x + x, y, p.y - d / 2 - 0.01); scene.add(win); 
                            } 
                        } 
                        for (let z = -d / 2 + wS; z < d / 2 - wS; z += wS) { 
                            if (Math.random() > 0.3) { 
                                const win = new THREE.Mesh(wG, wM); win.rotation.y = Math.PI / 2; win.position.set(p.x + w / 2 + 0.01, y, p.y + z); scene.add(win); 
                            } 
                            if (Math.random() > 0.3) { 
                                const win = new THREE.Mesh(wG, wM); win.rotation.y = Math.PI / 2; win.position.set(p.x - w / 2 - 0.01, y, p.y + z); scene.add(win); 
                            } 
                        } 
                    } 
                }

                // GRAFFITIT SEINIIN
                if (wallCandidates.length >= 2) {
                    const textureLoader = new THREE.TextureLoader();
                    const attackTex = textureLoader.load('graffiti-attack.png');
                    const robotTex = textureLoader.load('graffiti-robot.png');

                    const createGraffitiMat = (tex) => new THREE.MeshStandardMaterial({
                        map: tex,
                        transparent: true,
                        depthWrite: false,
                        polygonOffset: true,
                        polygonOffsetFactor: -1,
                        roughness: 0.9
                    });

                    const attackMat = createGraffitiMat(attackTex);
                    const robotMat = createGraffitiMat(robotTex);
                    const graffitiGeo = new THREE.PlaneGeometry(4.5, 3.2);

                    const idx1 = Math.floor(Math.random() * wallCandidates.length);
                    let idx2 = Math.floor(Math.random() * wallCandidates.length);
                    while (idx2 === idx1) {
                        idx2 = Math.floor(Math.random() * wallCandidates.length);
                    }

                    const wall1 = wallCandidates[idx1];
                    const graffiti1 = new THREE.Mesh(graffitiGeo, attackMat);
                    graffiti1.position.copy(wall1.pos);
                    graffiti1.rotation.y = wall1.rotY;
                    scene.add(graffiti1);

                    const wall2 = wallCandidates[idx2];
                    const graffiti2 = new THREE.Mesh(graffitiGeo, robotMat);
                    graffiti2.position.copy(wall2.pos);
                    graffiti2.rotation.y = wall2.rotY;
                    scene.add(graffiti2);
                }

                // ROSKA-ASTIAT JA KATUVALOT
                if (propPlacementCandidates.length > 0) {
                    for (let i = propPlacementCandidates.length - 1; i > 0; i--) {
                        const j = Math.floor(Math.random() * (i + 1));
                        [propPlacementCandidates[i], propPlacementCandidates[j]] = [propPlacementCandidates[j], propPlacementCandidates[i]];
                    }

                    const numTrashCans = Math.min(25, Math.floor(propPlacementCandidates.length / 2));
                    const numStreetLights = Math.min(25, Math.floor(propPlacementCandidates.length / 2));

                    const guaranteedFuelCellIndex = Math.floor(Math.random() * numTrashCans);

                    for (let i = 0; i < numTrashCans; i++) {
                        const candidate = propPlacementCandidates[i];
                        const trashGroup = GameWorld.props.createTrashCanMesh();
                        trashGroup.position.copy(candidate.pos);
                        trashGroup.rotation.y = candidate.rotY;
                        scene.add(trashGroup);

                        let dropItem = null;
                        if (i === guaranteedFuelCellIndex) {
                            dropItem = 'fuel_cell';
                        } else if (Math.random() < 0.25) {
                            dropItem = Math.random() < 0.5 ? 'health' : 'ammo_shotgun';
                        }

                        const box = new THREE.Box3().setFromObject(trashGroup);
                        box.userData = {
                            isDestructible: true,
                            propType: 'trash_can',
                            mesh: trashGroup,
                            containsItem: dropItem
                        };
                        buildingColliders.push(box);
                    }

                    for (let i = numTrashCans; i < numTrashCans + numStreetLights; i++) {
                        const candidate = propPlacementCandidates[i];
                        const lightGroup = GameWorld.props.createStreetLightMesh();
                        lightGroup.position.copy(candidate.pos);
                        lightGroup.rotation.y = candidate.rotY;
                        scene.add(lightGroup);

                        const poleRadius = 0.3;
                        const poleHeight = 4.8;
                        const box = new THREE.Box3().setFromCenterAndSize(
                            candidate.pos.clone().add(new THREE.Vector3(0, poleHeight / 2, 0)),
                            new THREE.Vector3(poleRadius * 2, poleHeight, poleRadius * 2)
                        );

                        box.userData = {
                            isDestructible: true,
                            propType: 'street_light',
                            mesh: lightGroup
                        };
                        buildingColliders.push(box);
                    }
                }

                // --- AUTON SPAWNAUS KADUILLE (2X SUUREMMAT AUTOT) ---
                const carColors = [0xf5f5f5, 0xcc1111, 0xeebb00, 0x1155cc, 0x888888, 0x222222];
                const carCount = 7;
                let carsSpawned = 0;
                let carTries = 0;

                while (carsSpawned < carCount && carTries < 300) {
                    carTries++;
                    const colorHex = carColors[Math.floor(Math.random() * carColors.length)];
                    const carMesh = GameWorld.props.createCarMesh(colorHex);

                    const spawnX = (Math.random() - 0.5) * 160;
                    const spawnZ = (Math.random() - 0.5) * 160;
                    const rotY = Math.random() < 0.5 ? 0 : Math.PI / 2;

                    const distToPlayer = new THREE.Vector2(spawnX, spawnZ).distanceTo(new THREE.Vector2(0, 10));
                    const distToPad = new THREE.Vector2(spawnX, spawnZ).distanceTo(new THREE.Vector2(50, 50));

                    if (distToPlayer < 20 || distToPad < 35) continue;

                    carMesh.position.set(spawnX, 0, spawnZ);
                    carMesh.rotation.y = rotY;
                    carMesh.updateMatrixWorld(true);

                    const carBox = new THREE.Box3().setFromObject(carMesh);
                    carBox.expandByScalar(0.5);

                    let intersects = false;
                    for (let c of buildingColliders) {
                        const existingBox = c.isMesh ? new THREE.Box3().setFromObject(c) : c;
                        if (existingBox.intersectsBox(carBox)) {
                            intersects = true;
                            break;
                        }
                    }

                    if (!intersects) {
                        scene.add(carMesh);

                        const finalBox = new THREE.Box3().setFromObject(carMesh);
                        finalBox.userData = {
                            isCar: true,
                            carGroup: carMesh,
                            carState: carMesh.userData.carState
                        };
                        buildingColliders.push(finalBox);

                        if (window.cityCars) {
                            window.cityCars.push({
                                mesh: carMesh,
                                state: carMesh.userData.carState,
                                userData: carMesh.userData,
                                colliderBox: finalBox
                            });
                        }

                        carsSpawned++;
                    }
                }

                return { ground, hemisphereLight, directionalLight, landingPadPosition: landingPad.position.clone().add(new THREE.Vector3(0, 1.0, 0)) };
            },
            map: { size: 200, bgColor: '#2a1d14', buildingColor: '#5a483c' }
        },
        desert: {
            name: 'Desert',
            musicFile: 'music_desert.mp3',
            spawnRange: 380,
            initialAlienCount: 20,
            fogColor: 0xd2b48c,
            create: (scene, buildingColliders) => {
                const desertColor = GameWorld.levels.desert.fogColor;
                scene.background = new THREE.Color(desertColor);
                scene.fog = new THREE.Fog(desertColor, 0, 100);
                const hemisphereLight = new THREE.HemisphereLight(0xffffbb, 0x080820, 1.5); scene.add(hemisphereLight);
                const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0); directionalLight.position.set(-100, 100, 50); directionalLight.castShadow = true; directionalLight.shadow.mapSize.width = 2048; directionalLight.shadow.mapSize.height = 2048; directionalLight.shadow.camera.left = -150; directionalLight.shadow.camera.right = 150; directionalLight.shadow.camera.top = 150; directionalLight.shadow.camera.bottom = -150; scene.add(directionalLight);
                
                const groundMat = new THREE.MeshStandardMaterial({ 
                    color: (gameSettings.texturesEnabled && window.desertFloorTexture) ? 0xffffff : 0xc2b280, 
                    map: (gameSettings.texturesEnabled && window.desertFloorTexture) ? window.desertFloorTexture : null,
                    roughness: 1.0 
                });
                const ground = new THREE.Mesh( new THREE.PlaneGeometry(400, 400), groundMat ); ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
                
                const rockGeo = new THREE.DodecahedronGeometry(1); 
                const rockMat = new THREE.MeshStandardMaterial({ 
                    color: (gameSettings.texturesEnabled && window.desertRockTexture) ? 0xffffff : 0x888888, 
                    map: (gameSettings.texturesEnabled && window.desertRockTexture) ? window.desertRockTexture : null,
                    roughness: 1.0, 
                    flatShading: true 
                });
                for(let i = 0; i < 60; i++) {
                    const rock = new THREE.Mesh(rockGeo, rockMat);
                    rock.scale.set( Math.random() * 5 + 2, Math.random() * 8 + 3, Math.random() * 5 + 2 );
                    rock.position.set( (Math.random() - 0.5) * 380, (rock.scale.y / 2) - Math.random() * 3, (Math.random() - 0.5) * 380 );
                    rock.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
                    rock.castShadow = true; rock.receiveShadow = true; scene.add(rock);
                    buildingColliders.push(new THREE.Box3().setFromObject(rock));
                }
                return { ground, hemisphereLight, directionalLight, landingPadPosition: null, motorcyclePosition: new THREE.Vector3(10, 0.5, 10) };
            },
            map: { size: 400, bgColor: '#8B7355', buildingColor: '#695C4B' }
        },
        volcanic: {
            name: 'Volcanic',
            musicFile: 'music_volcanic.mp3',
            spawnRange: 380,
            initialAlienCount: 25,
            fogColor: 0x221105,
            create: (scene, buildingColliders) => {
                scene.background = new THREE.Color(GameWorld.levels.volcanic.fogColor);
                scene.fog = new THREE.Fog(GameWorld.levels.volcanic.fogColor, 0, 80);
                const hemisphereLight = new THREE.HemisphereLight(0xff8844, 0x111111, 1.8); scene.add(hemisphereLight);
                const directionalLight = new THREE.DirectionalLight(0xff4500, 0.8); directionalLight.position.set(80, 60, 70); directionalLight.castShadow = true; directionalLight.shadow.mapSize.width = 2048; directionalLight.shadow.mapSize.height = 2048; directionalLight.shadow.camera.left = -150; directionalLight.shadow.camera.right = 150; directionalLight.shadow.camera.top = 150; directionalLight.shadow.camera.bottom = -150; scene.add(directionalLight);
                
                const groundMat = new THREE.MeshStandardMaterial({ 
                    color: (gameSettings.texturesEnabled && window.volcanicFloorTexture) ? 0xffffff : 0x1a1a1a, 
                    map: (gameSettings.texturesEnabled && window.volcanicFloorTexture) ? window.volcanicFloorTexture : null,
                    roughness: 0.7 
                });
                const ground = new THREE.Mesh( new THREE.PlaneGeometry(400, 400), groundMat ); ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
                
                const rockGeo = new THREE.IcosahedronGeometry(1, 0); 
                const rockMat = new THREE.MeshStandardMaterial({ 
                    color: (gameSettings.texturesEnabled && window.volcanicRockTexture) ? 0xffffff : 0x111111, 
                    map: (gameSettings.texturesEnabled && window.volcanicRockTexture) ? window.volcanicRockTexture : null,
                    roughness: 0.9, 
                    flatShading: true 
                });
                for(let i = 0; i < 70; i++) {
                    const rock = new THREE.Mesh(rockGeo, rockMat);
                    rock.scale.set( Math.random() * 8 + 4, Math.random() * 10 + 4, Math.random() * 8 + 4 );
                    rock.position.set( (Math.random() - 0.5) * 380, (rock.scale.y / 2) - Math.random() * 2, (Math.random() - 0.5) * 380 );
                    rock.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
                    rock.castShadow = true; rock.receiveShadow = true; scene.add(rock);
                    buildingColliders.push(new THREE.Box3().setFromObject(rock));
                }

                const pyramidHeight = 60;
                const pyramidBaseSize = 80;
                const pyramidMat = new THREE.MeshStandardMaterial({ 
                    color: (gameSettings.texturesEnabled && window.pyramidTexture) ? 0xffffff : 0x181818, 
                    map: (gameSettings.texturesEnabled && window.pyramidTexture) ? window.pyramidTexture : null,
                    roughness: 0.8 
                });
                const pyramidGeo = new THREE.ConeGeometry(pyramidBaseSize / 2, pyramidHeight, 4);
                const pyramid = new THREE.Mesh(pyramidGeo, pyramidMat);
                pyramid.position.y = pyramidHeight / 2;
                pyramid.castShadow = true;
                pyramid.receiveShadow = true;
                scene.add(pyramid);
                
                pyramid.userData.colliderType = 'mesh';
                buildingColliders.push(pyramid);

                const topPlatformGeo = new THREE.BoxGeometry(10, 1, 10);
                const topPlatform = new THREE.Mesh(topPlatformGeo, pyramidMat);
                topPlatform.position.set(0, pyramidHeight, 0);
                topPlatform.castShadow = true;
                topPlatform.receiveShadow = true;
                scene.add(topPlatform);
                buildingColliders.push(new THREE.Box3().setFromObject(topPlatform));
                
                const obbyMat = new THREE.MeshStandardMaterial({ color: 0x332211, roughness: 0.9 });
                const numSteps = 100;
                const totalRotations = 5;
                const stepSize = 4;
                const stepThickness = 0.5;
                const obbyHeight = pyramidHeight - 3; 

                for (let i = 0; i < numSteps; i++) {
                    const progress = i / (numSteps - 1); 
                    const y = progress * obbyHeight + 2.0; 
                    
                    const radiusAtY = (1 - (y / pyramidHeight)) * (pyramidBaseSize / 2);
                    const angle = progress * totalRotations * Math.PI * 2;
                    
                    const x = Math.cos(angle) * (radiusAtY + stepSize * 0.7);
                    const z = Math.sin(angle) * (radiusAtY + stepSize * 0.7);
                    
                    const stepGeo = new THREE.BoxGeometry(stepSize, stepThickness, stepSize);
                    const step = new THREE.Mesh(stepGeo, obbyMat);
                    step.position.set(x, y, z);
                    step.rotation.y = angle;
                    step.castShadow = true;
                    step.receiveShadow = true;
                    scene.add(step);
                    buildingColliders.push(new THREE.Box3().setFromObject(step));
                }

                const wallMat = new THREE.MeshStandardMaterial({color:0x111111, roughness:0.9});
                const wallHeight = 80; const mapSize = 400; const wallThickness = 20;
                const walls = [ new THREE.Mesh(new THREE.BoxGeometry(mapSize + wallThickness, wallHeight, wallThickness), wallMat), new THREE.Mesh(new THREE.BoxGeometry(mapSize + wallThickness, wallHeight, wallThickness), wallMat), new THREE.Mesh(new THREE.BoxGeometry(wallThickness, wallHeight, mapSize + wallThickness), wallMat), new THREE.Mesh(new THREE.BoxGeometry(wallThickness, wallHeight, mapSize + wallThickness), wallMat) ];
                walls[0].position.set(0, wallHeight/2, -mapSize/2); walls[1].position.set(0, wallHeight/2, mapSize/2); walls[2].position.set(-mapSize/2, wallHeight/2, 0); walls[3].position.set(mapSize/2, wallHeight/2, 0);
                walls.forEach(wall => { scene.add(wall); buildingColliders.push(new THREE.Box3().setFromObject(wall)); });
                
                return { ground, hemisphereLight, directionalLight, landingPadPosition: null, pyramidTopPosition: new THREE.Vector3(0, pyramidHeight + 0.5, 0) };
            },
            map: { size: 400, bgColor: '#110800', buildingColor: '#332211' }
        },
        ice: {
            name: 'Ice',
            musicFile: 'music_ice.mp3',
            spawnRange: 380,
            initialAlienCount: 18,
            fogColor: 0xeeeeff,
            create: (scene, buildingColliders) => {
                scene.background = new THREE.Color(GameWorld.levels.ice.fogColor);
                scene.fog = new THREE.Fog(GameWorld.levels.ice.fogColor, 0, 120);
                const hemisphereLight = new THREE.HemisphereLight(0xccddff, 0x99aadd, 1.5); scene.add(hemisphereLight);
                const directionalLight = new THREE.DirectionalLight(0xffffff, 0.9); directionalLight.position.set(-50, 80, -50); directionalLight.castShadow = true; directionalLight.shadow.mapSize.width = 2048; directionalLight.shadow.mapSize.height = 2048; directionalLight.shadow.camera.left = -150; directionalLight.shadow.camera.right = 150; directionalLight.shadow.camera.top = 150; directionalLight.shadow.camera.bottom = -150; scene.add(directionalLight);
                
                const groundMat = new THREE.MeshStandardMaterial({ 
                    color: (gameSettings.texturesEnabled && window.iceFloorTexture) ? 0xffffff : 0xddeeff, 
                    map: (gameSettings.texturesEnabled && window.iceFloorTexture) ? window.iceFloorTexture : null,
                    roughness: 0.1, 
                    metalness: 0.1 
                });
                const ground = new THREE.Mesh( new THREE.PlaneGeometry(400, 400), groundMat ); ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
                
                const rockGeo = new THREE.IcosahedronGeometry(2, 1); 
                const rockMat = new THREE.MeshStandardMaterial({ 
                    color: (gameSettings.texturesEnabled && window.iceRockTexture) ? 0xffffff : 0xaaccff, 
                    map: (gameSettings.texturesEnabled && window.iceRockTexture) ? window.iceRockTexture : null,
                    roughness: 0.2, 
                    metalness: 0.2, 
                    flatShading: true 
                });
                for(let i = 0; i < 50; i++) {
                    const rock = new THREE.Mesh(rockGeo, rockMat);
                    rock.scale.set( Math.random() * 4 + 3, Math.random() * 12 + 5, Math.random() * 4 + 3 );
                    rock.position.set( (Math.random() - 0.5) * 380, (rock.scale.y / 2) - Math.random() * 4, (Math.random() - 0.5) * 380 );
                    rock.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
                    rock.castShadow = true; rock.receiveShadow = true; scene.add(rock);
                    const box = new THREE.Box3().setFromObject(rock);
                    const size = new THREE.Vector3();
                    box.getSize(size);
                    box.expandByVector(size.multiplyScalar(-0.15)); 
                    buildingColliders.push(box);
                }
                const ruinMat = new THREE.MeshStandardMaterial({
                    color: (gameSettings.texturesEnabled && window.castleTexture) ? 0xffffff : 0x778899,
                    map: (gameSettings.texturesEnabled && window.castleTexture) ? window.castleTexture : null,
                    roughness: 0.8
                });
                const castleCenter = new THREE.Vector3(100,0,100);
                const castleRadiusSq = 25 * 25; 
                for(let i=0; i<30; i++) { 
                    const size = Math.random()*5+2; const h = Math.random()*8+1; 
                    const ruin = new THREE.Mesh(new THREE.BoxGeometry(size,h,size), ruinMat); 
                    ruin.position.set((Math.random()-0.5)*380, h/2, (Math.random()-0.5)*380); 
                    
                    if (ruin.position.distanceToSquared(castleCenter) < castleRadiusSq) {
                        i--; 
                        continue;
                    }

                    ruin.rotation.y = Math.random()*Math.PI; 
                    scene.add(ruin); 
                    const box = new THREE.Box3().setFromObject(ruin);
                    const boxSize = new THREE.Vector3();
                    box.getSize(boxSize);
                    box.expandByVector(boxSize.multiplyScalar(-0.01)); 
                    buildingColliders.push(box);
                }
                const createCastle = (pos) => {
                    let designatedTowerTopPos = null;
                    const wallMat = new THREE.MeshStandardMaterial({
                        color: (gameSettings.texturesEnabled && window.castleTexture) ? 0xffffff : 0x48494B,
                        map: (gameSettings.texturesEnabled && window.castleTexture) ? window.castleTexture : null,
                        roughness: 0.7
                    }); 
                    const wallHeight = 10, wallThick=2;
                    const createWall = (w,d, p, r) => { 
                        const wall = new THREE.Mesh(new THREE.BoxGeometry(w,wallHeight,d), wallMat); 
                        wall.position.copy(p); wall.rotation.y = r; scene.add(wall); 
                        const box = new THREE.Box3().setFromObject(wall);
                        const size = new THREE.Vector3(); box.getSize(size);
                        box.expandByVector(size.multiplyScalar(-0.1));
                        buildingColliders.push(box); 
                    };
                    const backWallPos = pos.clone().add(new THREE.Vector3(0,wallHeight/2,20));
                    createWall(40, wallThick, backWallPos, 0); 
                    createWall(15, wallThick, pos.clone().add(new THREE.Vector3(12.5,wallHeight/2,-20)), 0); 
                    createWall(15, wallThick, pos.clone().add(new THREE.Vector3(-12.5,wallHeight/2,-20)), 0); 
                    createWall(40, wallThick, pos.clone().add(new THREE.Vector3(20,wallHeight/2,0)), Math.PI/2); 
                    createWall(40, wallThick, pos.clone().add(new THREE.Vector3(-20,wallHeight/2,0)), Math.PI/2);
                    
                    const stairsMat = new THREE.MeshStandardMaterial({
                        color: (gameSettings.texturesEnabled && window.castleTexture) ? 0xffffff : 0x48494B,
                        map: (gameSettings.texturesEnabled && window.castleTexture) ? window.castleTexture : null,
                        roughness: 0.7
                    });
                    const stairWidth = 4;
                    const stairCount = 15;
                    const totalStairDepth = 10;
                    const stepHeight = wallHeight / stairCount;
                    const stepDepth = totalStairDepth / stairCount;

                    const stairCaseStartZ = backWallPos.z - (wallThick / 2) - totalStairDepth;

                    for (let i = 0; i < stairCount; i++) {
                        const stepGeo = new THREE.BoxGeometry(stairWidth, stepHeight, stepDepth);
                        const step = new THREE.Mesh(stepGeo, stairsMat);
                        step.position.set(
                            backWallPos.x,
                            (i * stepHeight) + (stepHeight / 2) + 0.25,
                            stairCaseStartZ + (i * stepDepth) + (stepDepth / 2)
                        );
                        step.castShadow = true;
                        step.receiveShadow = true;
                        scene.add(step);
                        buildingColliders.push(new THREE.Box3().setFromObject(step));
                    }

                    const patio = new THREE.Mesh(new THREE.BoxGeometry(38,0.5,38), wallMat); 
                    patio.position.copy(pos).add(new THREE.Vector3(0,0.25,0)); 
                    scene.add(patio); 
                    buildingColliders.push(new THREE.Box3().setFromObject(patio));
                    const towerHeight = 25; const towerRad = 5;
                    [-1,1].forEach(sx => { [-1,1].forEach(sz => {
                        const tPos = pos.clone().add(new THREE.Vector3(19*sx, 0, 19*sz)); 
                        const tower = new THREE.Mesh(new THREE.CylinderGeometry(towerRad,towerRad,towerHeight,12), wallMat);
                        tower.position.copy(tPos).add(new THREE.Vector3(0, towerHeight/2, 0)); 
                        scene.add(tower);
                        const towerBox = new THREE.Box3().setFromObject(tower);
                        const towerSize = new THREE.Vector3(); towerBox.getSize(towerSize);
                        towerBox.expandByVector(towerSize.multiplyScalar(-0.01));
                        buildingColliders.push(towerBox);
                        for(let y=0; y<towerHeight-1; y+=1){ 
                            const step = new THREE.Mesh(new THREE.BoxGeometry(towerRad*1.5, 0.3, 2), wallMat); 
                            const angle = y * 0.8; 
                            step.position.set(tPos.x + Math.cos(angle)*towerRad*0.6, y+0.5, tPos.z + Math.sin(angle)*towerRad*0.6); 
                            step.rotation.y = angle; 
                            scene.add(step); 
                            buildingColliders.push(new THREE.Box3().setFromObject(step)); 
                        }
                        if (sx === 1 && sz === 1) { 
                             designatedTowerTopPos = new THREE.Vector3(tPos.x, towerHeight, tPos.z);
                        }
                    })});
                    return designatedTowerTopPos;
                }
                const castleTowerTopPosition = createCastle(castleCenter);
                
                const wallMat = new THREE.MeshStandardMaterial({color:0xccffff, transparent: true, opacity:0.3, roughness:0.1});
                const wallHeight = 50; const mapSize = 400; const wallThickness = 5;
                const walls = [ new THREE.Mesh(new THREE.BoxGeometry(mapSize, wallHeight, wallThickness), wallMat), new THREE.Mesh(new THREE.BoxGeometry(mapSize, wallHeight, wallThickness), wallMat), new THREE.Mesh(new THREE.BoxGeometry(wallThickness, wallHeight, mapSize), wallMat), new THREE.Mesh(new THREE.BoxGeometry(wallThickness, wallHeight, mapSize), wallMat) ];
                walls[0].position.set(0, wallHeight/2, -mapSize/2); walls[1].position.set(0, wallHeight/2, mapSize/2); walls[2].position.set(-mapSize/2, wallHeight/2, 0); walls[3].position.set(mapSize/2, wallHeight/2, 0);
                walls.forEach(wall => { scene.add(wall); buildingColliders.push(new THREE.Box3().setFromObject(wall)); });

                return { ground, hemisphereLight, directionalLight, landingPadPosition: null, castleTowerTopPosition };
            },
            map: { size: 400, bgColor: '#a0b0d0', buildingColor: '#c0d0e8' }
        },
        toxic: {
            name: 'Toxic',
            musicFile: 'music_toxic.mp3',
            spawnRange: 380,
            initialAlienCount: 30,
            fogColor: 0x445544,
            fogDensity: 0.015,
            create: (scene, buildingColliders, vegetation, bunkers) => {
                scene.background = new THREE.Color(GameWorld.levels.toxic.fogColor);
                scene.fog = new THREE.FogExp2(GameWorld.levels.toxic.fogColor, GameWorld.levels.toxic.fogDensity);
                const hemisphereLight = new THREE.HemisphereLight(0xaaffaa, 0x446644, 1.3); scene.add(hemisphereLight);
                const directionalLight = new THREE.DirectionalLight(0x88ff88, 0.6); directionalLight.position.set(0, 100, 0); directionalLight.castShadow = true; directionalLight.shadow.mapSize.width = 2048; directionalLight.shadow.mapSize.height = 2048; directionalLight.shadow.camera.left = -150; directionalLight.shadow.camera.right = 150; directionalLight.shadow.camera.top = 150; directionalLight.shadow.camera.bottom = -150; scene.add(directionalLight);
                
                const groundMat = new THREE.MeshStandardMaterial({ 
                    color: (gameSettings.texturesEnabled && window.toxicFloorTexture) ? 0xffffff : 0x334433, 
                    map: (gameSettings.texturesEnabled && window.toxicFloorTexture) ? window.toxicFloorTexture : null,
                    roughness: 1.0 
                });
                const ground = new THREE.Mesh( new THREE.PlaneGeometry(400, 400), groundMat ); ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
                
                const rockGeo = new THREE.TorusKnotGeometry(1, 0.4, 64, 8, 2, 3); const rockMat = new THREE.MeshStandardMaterial({ color: 0x223322, roughness: 0.8, metalness: 0.4 });
                for(let i = 0; i < 40; i++) { 
                    const rock = new THREE.Mesh(rockGeo, rockMat); 
                    rock.scale.setScalar(Math.random() * 5 + 4); 
                    rock.position.set( (Math.random() - 0.5) * 380, rock.scale.y, (Math.random() - 0.5) * 380 ); 
                    rock.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI); 
                    rock.castShadow = true; 
                    rock.receiveShadow = true; 
                    scene.add(rock); 
                    const box = new THREE.Box3().setFromObject(rock);
                    const size = new THREE.Vector3();
                    box.getSize(size);
                    box.expandByVector(size.multiplyScalar(-0.15)); 
                    buildingColliders.push(box);
                }
                
                for(let i=0; i<150; i++){ 
                    const isPoison = Math.random() < 0.2;
                    const plant = new THREE.Group();
                    
                    const currentStemMat = new THREE.MeshStandardMaterial({
                        color: (gameSettings.texturesEnabled && window.toxicStemTexture) ? (isPoison ? 0xffff00 : 0xffffff) : (isPoison ? 0xffff00 : 0x44aa44),
                        map: (gameSettings.texturesEnabled && window.toxicStemTexture) ? window.toxicStemTexture : null,
                        emissive: isPoison ? 0xaaaa00 : 0x000000,
                        emissiveIntensity: isPoison ? 0.5 : 0.0,
                        roughness: 0.8
                    });

                    const currentLeafMat = new THREE.MeshStandardMaterial({
                        color: (gameSettings.texturesEnabled && window.toxicLeafTexture) ? (isPoison ? 0xffff00 : 0xffffff) : (isPoison ? 0xffff00 : 0x44aa44),
                        map: (gameSettings.texturesEnabled && window.toxicLeafTexture) ? window.toxicLeafTexture : null,
                        emissive: isPoison ? 0xaaaa00 : 0x000000,
                        emissiveIntensity: isPoison ? 0.5 : 0.0,
                        roughness: 0.8
                    });

                    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.4, 6, 8), currentStemMat);
                    stem.position.y = 3;
                    plant.add(stem);

                    for(let j=0; j<5; j++) {
                        const leaf = new THREE.Mesh(new THREE.SphereGeometry(1.5, 8, 4), currentLeafMat);
                        leaf.scale.set(1.0, 1.0, 0.2);
                        leaf.position.set(Math.random()*4-2, j+1, Math.random()*4-2);
                        leaf.rotation.set(Math.random()*Math.PI, Math.random()*Math.PI, Math.random()*Math.PI);
                        plant.add(leaf);
                    }
                    plant.position.set((Math.random()-0.5)*380, 0, (Math.random()-0.5)*380); 
                    plant.castShadow = true; plant.userData.isPoison = isPoison;
                    vegetation.push(plant); scene.add(plant); 
                }

                const grassGeo = new THREE.CylinderGeometry(0.02, 0.05, 0.5, 3);
                const grassMat = new THREE.MeshBasicMaterial({color:0x336633});
                const instancedGrass = new THREE.InstancedMesh(grassGeo, grassMat, 50000);
                const dummy = new THREE.Object3D();
                for(let i=0; i<50000; i++) {
                    dummy.position.set((Math.random()-0.5)*400, 0.25, (Math.random()-0.5)*400);
                    dummy.rotation.y = Math.random() * Math.PI;
                    dummy.scale.set(1.5, 1.5, 1.5);
                    dummy.updateMatrix();
                    instancedGrass.setMatrixAt(i, dummy.matrix);
                }
                scene.add(instancedGrass);
                
                const currentShelterMat = new THREE.MeshStandardMaterial({
                    color: (gameSettings.texturesEnabled && window.toxicStemTexture) ? 0xddffdd : 0x338833,
                    map: (gameSettings.texturesEnabled && window.toxicStemTexture) ? window.toxicStemTexture : null,
                    roughness: 0.9
                });

                for (let i = 0; i < 300; i++) {
                    const shelterPlant = new THREE.Group();
                    const height = Math.random() * 10 + 8; 
                    const stem = new THREE.Mesh(
                        new THREE.CylinderGeometry(0.1, 0.15, height, 5),
                        currentShelterMat
                    );
                    stem.position.y = height / 2;
                    shelterPlant.add(stem);
                    shelterPlant.position.set((Math.random() - 0.5) * 380, 0, (Math.random() - 0.5) * 380);
                    shelterPlant.castShadow = true;
                    shelterPlant.userData.isShelter = true; 
                    vegetation.push(shelterPlant); 
                    scene.add(shelterPlant);
                }

                const currentTrunkMat = new THREE.MeshStandardMaterial({
                    color: (gameSettings.texturesEnabled && window.toxicStemTexture) ? 0x8b5a2b : 0x5a3b2a,
                    map: (gameSettings.texturesEnabled && window.toxicStemTexture) ? window.toxicStemTexture : null,
                    roughness: 0.9
                });

                const currentCanopyMat = new THREE.MeshStandardMaterial({
                    color: (gameSettings.texturesEnabled && window.toxicLeafTexture) ? 0xddffdd : 0x223322,
                    map: (gameSettings.texturesEnabled && window.toxicLeafTexture) ? window.toxicLeafTexture : null,
                    roughness: 0.8
                });

                for (let i = 0; i < 70; i++) {
                    const tree = new THREE.Group();
                    const height = Math.random() * 20 + 30; 
                    const radius = Math.random() * 1 + 0.8;
                    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius * 0.8, height, 12), currentTrunkMat);
                    trunk.position.y = height / 2;
                    trunk.castShadow = true;
                    tree.add(trunk);
                    
                    const canopy = new THREE.Mesh(new THREE.SphereGeometry(radius * 5, 8, 6), currentCanopyMat);
                    canopy.position.y = height;
                    canopy.castShadow = true;
                    tree.add(canopy);
                    
                    tree.position.set((Math.random() - 0.5) * 380, 0, (Math.random() - 0.5) * 380);
                    tree.userData.isShelter = true;
                    tree.userData.isTree = true;
                    vegetation.push(tree);
                    scene.add(tree);
                    
                    tree.updateMatrixWorld(true);
                    
                    const trunkCollider = new THREE.Box3().setFromObject(trunk);
                    buildingColliders.push(trunkCollider);
                }

                return { ground, hemisphereLight, directionalLight, landingPadPosition: null, bunkers };
            },
            map: { size: 400, bgColor: '#2a382a', buildingColor: '#445544' }
        },
        crystal: {
            name: 'Crystal',
            musicFile: 'music_crystal.mp3',
            spawnRange: 380,
            initialAlienCount: 35,
            fogColor: 0x110022,
            create: (scene, buildingColliders) => {
                scene.background = new THREE.Color(GameWorld.levels.crystal.fogColor);
                scene.fog = new THREE.Fog(GameWorld.levels.crystal.fogColor, 0, 90);
                const hemisphereLight = new THREE.HemisphereLight(0xffaaff, 0xaa55ff, 1.6);
                scene.add(hemisphereLight);
                const directionalLight = new THREE.DirectionalLight(0xffccff, 0.7);
                directionalLight.position.set(70, 70, -70);
                directionalLight.castShadow = true;
                directionalLight.shadow.mapSize.width = 2048;
                directionalLight.shadow.mapSize.height = 2048;
                directionalLight.shadow.camera.left = -150;
                directionalLight.shadow.camera.right = 150;
                directionalLight.shadow.camera.top = 150;
                directionalLight.shadow.camera.bottom = -150;
                scene.add(directionalLight);

                const sunMatWhite = new THREE.MeshBasicMaterial({ color: 0xffffff, fog: false });
                const sunWhite = new THREE.Mesh(new THREE.SphereGeometry(20, 32, 16), sunMatWhite);
                sunWhite.position.set(-300, 200, -300);
                scene.add(sunWhite);

                const sunMatRed = new THREE.MeshBasicMaterial({ color: 0xff4422, fog: false });
                const sunRed = new THREE.Mesh(new THREE.SphereGeometry(30, 32, 16), sunMatRed);
                sunRed.position.set(300, 250, -250);
                scene.add(sunRed);

                const sunLightWhite = new THREE.PointLight(0xffffff, 0.5, 2000);
                sunLightWhite.position.copy(sunWhite.position);
                scene.add(sunLightWhite);

                const sunLightRed = new THREE.PointLight(0xff4422, 0.5, 2000);
                sunLightRed.position.copy(sunRed.position);
                scene.add(sunLightRed);

                const groundMat = new THREE.MeshStandardMaterial({
                    color: (gameSettings.texturesEnabled && window.crystalFloorTexture) ? 0xffffff : 0x221133,
                    map: (gameSettings.texturesEnabled && window.crystalFloorTexture) ? window.crystalFloorTexture : null,
                    roughness: 0.3
                });
                const ground = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), groundMat);
                ground.rotation.x = -Math.PI / 2;
                ground.receiveShadow = true;
                scene.add(ground);

                const mazeCenterPos = new THREE.Vector3(-100, 0, -100);
                const mazeGridSize = 25; 
                const cellSize = 8;
                const mazeRadius = (mazeGridSize / 2) * cellSize;
                
                const crystalGeo = new THREE.OctahedronGeometry(1);
                const crystalMat = new THREE.MeshStandardMaterial({
                    color: (gameSettings.texturesEnabled && window.crystalRockTexture) ? 0xffffff : 0xaa88ff,
                    map: (gameSettings.texturesEnabled && window.crystalRockTexture) ? window.crystalRockTexture : null,
                    roughness: 0.1,
                    metalness: 0.5,
                    flatShading: false,
                    emissive: 0x8844cc,
                    emissiveIntensity: 0.5,
                    transparent: true,
                    opacity: 0.75
                });
                for (let i = 0; i < 80; i++) {
                    const crystal = new THREE.Mesh(crystalGeo, crystalMat);
                    crystal.scale.setScalar(Math.random() * 12 + 3);
                    crystal.position.set((Math.random() - 0.5) * 380, (crystal.scale.y / 2) - Math.random() * 2, (Math.random() - 0.5) * 380);
                    
                    const distFromMazeCenter = new THREE.Vector2(crystal.position.x, crystal.position.z).distanceTo(new THREE.Vector2(mazeCenterPos.x, mazeCenterPos.z));
                    if (distFromMazeCenter < mazeRadius) {
                        i--; 
                        continue;
                    }

                    crystal.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
                    crystal.castShadow = true;
                    crystal.receiveShadow = true;
                    scene.add(crystal);
                    const box = new THREE.Box3().setFromObject(crystal);
                    const size = new THREE.Vector3();
                    box.getSize(size);
                    box.expandByVector(size.multiplyScalar(-0.2)); 
                    buildingColliders.push(box);
                }
                
                const hasCrystalBlockTex = gameSettings.texturesEnabled && window.crystalBlockTexture;
                const serverMat = new THREE.MeshStandardMaterial({
                    color: hasCrystalBlockTex ? 0xffffff : 0x333344,
                    map: hasCrystalBlockTex ? window.crystalBlockTexture : null,
                    emissive: hasCrystalBlockTex ? 0x000000 : 0x222288,
                    emissiveIntensity: hasCrystalBlockTex ? 0.0 : 1
                });
                for (let i = 0; i < 40; i++) {
                    const sSize = Math.random() * 4 + 2;
                    const server = new THREE.Mesh(new THREE.BoxGeometry(sSize, sSize * 2, sSize), serverMat);
                    server.position.set((Math.random() - 0.5) * 380, sSize, (Math.random() - 0.5) * 380);
                    
                    const distFromMazeCenter = new THREE.Vector2(server.position.x, server.position.z).distanceTo(new THREE.Vector2(mazeCenterPos.x, mazeCenterPos.z));
                    if (distFromMazeCenter < mazeRadius) {
                        i--; 
                        continue;
                    }

                    scene.add(server);
                    const box = new THREE.Box3().setFromObject(server);
                    const size = new THREE.Vector3();
                    box.getSize(size);
                    box.expandByVector(size.multiplyScalar(-0.1)); 
                    buildingColliders.push(box);
                }
                
                const wallHeight = 6;
                const wallThickness = 1.0;
                const hasCrystalWallTex = gameSettings.texturesEnabled && window.crystalWallTexture;
                const mazeMat = new THREE.MeshStandardMaterial({ 
                    color: hasCrystalWallTex ? 0xffffff : 0x332255, 
                    map: hasCrystalWallTex ? window.crystalWallTexture : null,
                    roughness: 0.6, 
                    metalness: 0.2, 
                    emissive: hasCrystalWallTex ? 0x000000 : 0x221133, 
                    emissiveIntensity: hasCrystalWallTex ? 0.0 : 0.4 
                });
                
                const generateMaze = (size) => {
                    const grid = Array(size).fill(null).map(() => Array(size).fill(null).map(() => ({ visited: false, walls: { N: true, S: true, E: true, W: true } })));
                    const stack = [];
                    let current = { r: Math.floor(Math.random() * size), c: Math.floor(Math.random() * size) };
                    grid[current.r][current.c].visited = true;
                    let visitedCount = 1;
                    while (visitedCount < size * size) {
                        const neighbors = [];
                        const { r, c } = current;
                        if (r > 0 && !grid[r - 1][c].visited) neighbors.push({ r: r - 1, c: c, dir: 'N' });
                        if (r < size - 1 && !grid[r + 1][c].visited) neighbors.push({ r: r + 1, c: c, dir: 'S' });
                        if (c > 0 && !grid[r][c - 1].visited) neighbors.push({ r: r, c: c - 1, dir: 'W' });
                        if (c < size - 1 && !grid[r][c + 1].visited) neighbors.push({ r: r, c: c + 1, dir: 'E' });

                        if (neighbors.length > 0) {
                            const next = neighbors[Math.floor(Math.random() * neighbors.length)];
                            stack.push(current);
                            if (next.dir === 'N') { grid[r][c].walls.N = false; grid[next.r][next.c].walls.S = false; }
                            if (next.dir === 'S') { grid[r][c].walls.S = false; grid[next.r][next.c].walls.N = false; }
                            if (next.dir === 'W') { grid[r][c].walls.W = false; grid[next.r][next.c].walls.E = false; }
                            if (next.dir === 'E') { grid[r][c].walls.E = false; grid[next.r][next.c].walls.W = false; }
                            current = { r: next.r, c: next.c };
                            grid[current.r][current.c].visited = true;
                            visitedCount++;
                        } else if (stack.length > 0) {
                            current = stack.pop();
                        } else {
                            let found = false;
                            for(let r=0; r<size; r++) {
                                for(let c=0; c<size; c++) {
                                    if(!grid[r][c].visited) {
                                        current = {r,c};
                                        grid[r][c].visited = true;
                                        visitedCount++;
                                        found = true;
                                        break;
                                    }
                                }
                                if(found) break;
                            }
                        }
                    }
                    return grid;
                };

                const mazeGrid = generateMaze(mazeGridSize);
                const halfGrid = Math.floor(mazeGridSize / 2);

                for (let r = 0; r < mazeGridSize; r++) {
                    for (let c = 0; c < mazeGridSize; c++) {
                        const cellWorldX = mazeCenterPos.x + (c - halfGrid) * cellSize;
                        const cellWorldZ = mazeCenterPos.z + (r - halfGrid) * cellSize;
                        const distFromCenter = Math.sqrt(Math.pow(c - halfGrid, 2) + Math.pow(r - halfGrid, 2));

                        if (distFromCenter > halfGrid) continue;

                        const cell = mazeGrid[r][c];

                        if (cell.walls.N) {
                            const wall = new THREE.Mesh(new THREE.BoxGeometry(cellSize + wallThickness, wallHeight, wallThickness), mazeMat);
                            wall.position.set(cellWorldX, wallHeight / 2, cellWorldZ - cellSize / 2);
                            wall.castShadow = true; wall.receiveShadow = true; scene.add(wall);
                            buildingColliders.push(new THREE.Box3().setFromObject(wall));
                        }
                        if (cell.walls.S) {
                            const wall = new THREE.Mesh(new THREE.BoxGeometry(cellSize + wallThickness, wallHeight, wallThickness), mazeMat);
                            wall.position.set(cellWorldX, wallHeight / 2, cellWorldZ + cellSize / 2);
                             wall.castShadow = true; wall.receiveShadow = true; scene.add(wall);
                            buildingColliders.push(new THREE.Box3().setFromObject(wall));
                        }
                        if (cell.walls.W) {
                            const wall = new THREE.Mesh(new THREE.BoxGeometry(wallThickness, wallHeight, cellSize + wallThickness), mazeMat);
                            wall.position.set(cellWorldX - cellSize / 2, wallHeight / 2, cellWorldZ);
                             wall.castShadow = true; wall.receiveShadow = true; scene.add(wall);
                            buildingColliders.push(new THREE.Box3().setFromObject(wall));
                        }
                        if (cell.walls.E) {
                            const wall = new THREE.Mesh(new THREE.BoxGeometry(wallThickness, wallHeight, cellSize + wallThickness), mazeMat);
                            wall.position.set(cellWorldX + cellSize / 2, wallHeight / 2, cellWorldZ);
                             wall.castShadow = true; wall.receiveShadow = true; scene.add(wall);
                            buildingColliders.push(new THREE.Box3().setFromObject(wall));
                        }
                    }
                }

                const wallMat = new THREE.MeshStandardMaterial({
                    color: 0xaa88ff,
                    transparent: true,
                    opacity: 0.2,
                    roughness: 0.1,
                    emissive: 0x8844cc,
                    emissiveIntensity: 0.3
                });
                const boundaryWallHeight = 60;
                const mapSize = 400;
                const boundaryWallThickness = 10;
                const walls = [new THREE.Mesh(new THREE.BoxGeometry(mapSize, boundaryWallHeight, boundaryWallThickness), wallMat), new THREE.Mesh(new THREE.BoxGeometry(mapSize, boundaryWallHeight, boundaryWallThickness), wallMat), new THREE.Mesh(new THREE.BoxGeometry(boundaryWallThickness, boundaryWallHeight, mapSize), wallMat), new THREE.Mesh(new THREE.BoxGeometry(boundaryWallThickness, boundaryWallHeight, mapSize), wallMat)];
                walls[0].position.set(0, boundaryWallHeight / 2, -mapSize / 2);
                walls[1].position.set(0, boundaryWallHeight / 2, mapSize / 2);
                walls[2].position.set(-mapSize / 2, boundaryWallHeight / 2, 0);
                walls[3].position.set(mapSize / 2, boundaryWallHeight / 2, 0);
                walls.forEach(wall => {
                    scene.add(wall);
                    buildingColliders.push(new THREE.Box3().setFromObject(wall));
                });
                return {
                    ground,
                    hemisphereLight,
                    directionalLight,
                    landingPadPosition: new THREE.Vector3(0, 1.0, 0),
                    mazeCenter: mazeCenterPos,
                    domeGuardianPosition: new THREE.Vector3(100, 0, 100)
                };
            },
            map: {
                size: 400,
                bgColor: '#221133',
                buildingColor: '#442266'
            }
        },
    },

    // --- PROP -MALLIEN GENERAATTORIT ---
    props: {
        createTrashCanMesh: () => {
            const group = new THREE.Group();
            const hasTex = (typeof gameSettings !== 'undefined' && gameSettings.texturesEnabled) && (window.trashTexture || window.trashCanTexture);
            const tex = window.trashTexture || window.trashCanTexture;

            const greenMat = new THREE.MeshStandardMaterial({ 
                color: hasTex ? 0xffffff : 0x1e6b27, 
                map: hasTex ? tex : null,
                roughness: 0.5, 
                metalness: 0.3 
            });
            const darkMetal = new THREE.MeshStandardMaterial({ color: 0x222225, roughness: 0.5, metalness: 0.8 });
            const rubberMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 });
            const yellowEmblemMat = new THREE.MeshStandardMaterial({ color: 0xffcc00, emissive: 0x332200 });

            const body = new THREE.Mesh(new THREE.BoxGeometry(0.75, 1.05, 0.75), greenMat);
            body.position.y = 0.58;
            body.castShadow = true; body.receiveShadow = true;
            group.add(body);

            for (let i = -1; i <= 1; i += 2) {
                const rib = new THREE.Mesh(new THREE.BoxGeometry(0.77, 0.05, 0.77), greenMat);
                rib.position.y = 0.4 + i * 0.3;
                group.add(rib);
            }

            const lid = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.12, 0.82), darkMetal);
            lid.position.y = 1.14;
            lid.castShadow = true;
            group.add(lid);

            const lidHandle = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.06, 0.08), darkMetal);
            lidHandle.position.set(0, 1.22, 0.28);
            group.add(lidHandle);

            const handleBarGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.7, 12);
            handleBarGeo.rotateZ(Math.PI / 2);
            const handleBar = new THREE.Mesh(handleBarGeo, darkMetal);
            handleBar.position.set(0, 1.02, -0.41);
            group.add(handleBar);

            for (let side = -1; side <= 1; side += 2) {
                const wheelGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.06, 16);
                wheelGeo.rotateZ(Math.PI / 2);
                const wheel = new THREE.Mesh(wheelGeo, rubberMat);
                wheel.position.set(0.40 * side, 0.12, -0.32);
                group.add(wheel);
            }

            const emblem = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.22, 0.02), yellowEmblemMat);
            emblem.position.set(0, 0.7, 0.38);
            group.add(emblem);

            group.scale.set(1.5, 1.5, 1.5);

            return group;
        },

        createStreetLightMesh: () => {
            const group = new THREE.Group();
            const hasTex = (typeof gameSettings !== 'undefined' && gameSettings.texturesEnabled) && window.streetLightTexture;
            const tex = window.streetLightTexture;

            const poleMetal = new THREE.MeshStandardMaterial({ 
                color: hasTex ? 0xffffff : 0x282b30, 
                map: hasTex ? tex : null,
                metalness: 0.85, 
                roughness: 0.35 
            });
            const darkBase = new THREE.MeshStandardMaterial({ 
                color: hasTex ? 0xcccccc : 0x18191c, 
                map: hasTex ? tex : null,
                metalness: 0.9, 
                roughness: 0.4 
            });
            const lampGlowMat = new THREE.MeshBasicMaterial({ color: 0xffea88 });

            const base = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.38, 0.5, 16), darkBase);
            base.position.y = 0.25;
            base.castShadow = true;
            group.add(base);

            const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.14, 4.2, 16), poleMetal);
            pole.position.y = 2.4;
            pole.castShadow = true;
            group.add(pole);

            const armGroup = new THREE.Group();
            armGroup.position.set(0, 4.4, 0);

            const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 1.2, 12), poleMetal);
            arm.position.set(0.4, 0.3, 0);
            arm.rotation.z = -Math.PI / 3;
            armGroup.add(arm);

            const head = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.14, 0.32), darkBase);
            head.position.set(0.9, 0.55, 0);
            armGroup.add(head);

            const glass = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.04, 0.24), lampGlowMat);
            glass.position.set(0.9, 0.49, 0);
            armGroup.add(glass);

            const light = new THREE.PointLight(0xffea88, 2.5, 10);
            light.position.set(0.9, 0.40, 0);
            armGroup.add(light);

            group.add(armGroup);
            return group;
        },

        // --- TUHOUTUVA URHEILUAUTO (2X SUUREMPI MALLI) ---
        createCarMesh: (colorHex = 0xf5f5f5) => {
            const root = new THREE.Group();
            const hasTex = typeof gameSettings !== 'undefined' && gameSettings.texturesEnabled;

            const carTex = hasTex ? (window.carTexture || null) : null;
            const carDestroyedTex = hasTex ? (window.carDestroyedTexture || carTex) : null;

            const bodyMat = new THREE.MeshStandardMaterial({
                color: colorHex,
                map: carTex,
                roughness: 0.25,
                metalness: 0.15
            });

            const damagedBodyMat = new THREE.MeshStandardMaterial({
                color: 0x777777,
                map: carDestroyedTex,
                roughness: 0.8,
                metalness: 0.5
            });

            const darkTrimMat = new THREE.MeshStandardMaterial({ color: 0x181818, roughness: 0.7, metalness: 0.3 });
            const interiorMat = new THREE.MeshStandardMaterial({ color: 0x282828, roughness: 0.85, metalness: 0.1 });
            const chromeMat = new THREE.MeshStandardMaterial({ color: 0xeeeeee, metalness: 0.95, roughness: 0.1 });
            const unlitReflectorMat = new THREE.MeshStandardMaterial({ color: 0xdddddd, metalness: 0.95, roughness: 0.1, emissive: 0x000000 });
            const glassMat = new THREE.MeshStandardMaterial({ color: 0x152535, transparent: true, opacity: 0.55, roughness: 0.1, side: THREE.DoubleSide });
            const clearHeadlightGlassMat = new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.45, roughness: 0.05 });
            const redLightMat = new THREE.MeshStandardMaterial({ color: 0xff1100, emissive: 0x660000 });
            const unlitIndicatorMat = new THREE.MeshStandardMaterial({ color: 0xbb6600, roughness: 0.5, emissive: 0x000000 });

            // 1. ALUSTA & KYNNYSKOTELOT
            const baseFrame = new THREE.Mesh(new THREE.BoxGeometry(1.68, 0.16, 3.68), darkTrimMat);
            baseFrame.position.set(0, 0.18, -0.15);
            root.add(baseFrame);

            for (let s = -1; s <= 1; s += 2) {
                const rocker = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.16, 1.22), darkTrimMat);
                rocker.position.set(0.82 * s, 0.22, 0.0);
                root.add(rocker);
            }

            const cabinFloor = new THREE.Mesh(new THREE.BoxGeometry(1.56, 0.05, 1.6), interiorMat);
            cabinFloor.position.set(0, 0.28, -0.05);
            root.add(cabinFloor);

            const firewall = new THREE.Mesh(new THREE.BoxGeometry(1.58, 0.45, 0.06), interiorMat);
            firewall.position.set(0, 0.52, 0.60);
            root.add(firewall);

            const rearBulkhead = new THREE.Mesh(new THREE.BoxGeometry(1.58, 0.55, 0.06), interiorMat);
            rearBulkhead.position.set(0, 0.55, -0.68);
            root.add(rearBulkhead);

            // Pyörät
            const wheelGeo = new THREE.CylinderGeometry(0.31, 0.31, 0.22, 24);
            wheelGeo.rotateZ(Math.PI / 2);
            const tireMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 });

            const rimGeo = new THREE.CylinderGeometry(0.20, 0.20, 0.23, 16);
            rimGeo.rotateZ(Math.PI / 2);

            const wheelPositions = [
                [-0.85, 0.31, 1.15],
                [0.85, 0.31, 1.15],
                [-0.85, 0.33, -1.3],
                [0.85, 0.33, -1.3]
            ];

            wheelPositions.forEach(pos => {
                const wheel = new THREE.Mesh(wheelGeo, tireMat);
                wheel.position.set(...pos);
                wheel.castShadow = true;

                const rim = new THREE.Mesh(rimGeo, chromeMat);
                wheel.add(rim);

                root.add(wheel);
            });

            // 2. SISÄTILAT
            const interiorGroup = new THREE.Group();

            function createSeat() {
                const seat = new THREE.Group();
                const cushion = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.12, 0.50), interiorMat);
                cushion.position.y = 0.35;
                seat.add(cushion);

                for (let s = -1; s <= 1; s += 2) {
                    const bolster = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.16, 0.50), interiorMat);
                    bolster.position.set(0.20 * s, 0.39, 0);
                    seat.add(bolster);
                }

                const backrest = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.52, 0.10), interiorMat);
                backrest.position.set(0, 0.62, -0.22);
                backrest.rotation.x = -0.18;
                seat.add(backrest);

                const headrest = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.18, 0.08), interiorMat);
                headrest.position.set(0, 0.92, -0.28);
                seat.add(headrest);

                return seat;
            }

            const leftSeat = createSeat();
            leftSeat.position.set(-0.35, 0, -0.10);
            interiorGroup.add(leftSeat);

            const rightSeat = createSeat();
            rightSeat.position.set(0.35, 0, -0.10);
            interiorGroup.add(rightSeat);

            const consoleBox = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.22, 0.90), interiorMat);
            consoleBox.position.set(0, 0.38, -0.10);
            interiorGroup.add(consoleBox);

            const dashboard = new THREE.Mesh(new THREE.BoxGeometry(1.45, 0.22, 0.38), interiorMat);
            dashboard.position.set(0, 0.66, 0.38);
            interiorGroup.add(dashboard);

            const steeringWheelGroup = new THREE.Group();
            const wheelRim = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.02, 12, 24), darkTrimMat);
            steeringWheelGroup.add(wheelRim);

            steeringWheelGroup.position.set(-0.35, 0.72, 0.12);
            steeringWheelGroup.rotation.x = 0.45;
            interiorGroup.add(steeringWheelGroup);

            root.add(interiorGroup);

            // 3. ETUOSA (NOKKA Z=1.65, PUSKURI Z=1.80)
            const frontClean = new THREE.Group();
            const frontDamaged = new THREE.Group();

            const noseGeo = new THREE.BoxGeometry(1.72, 0.16, 0.50);
            const nose = new THREE.Mesh(noseGeo, bodyMat);
            nose.position.set(0, 0.44, 1.65);
            frontClean.add(nose);

            const frontBumper = new THREE.Mesh(new THREE.BoxGeometry(1.76, 0.14, 0.20), darkTrimMat);
            frontBumper.position.set(0, 0.28, 1.80);
            frontClean.add(frontBumper);

            const hoodGeo = new THREE.BoxGeometry(1.74, 0.12, 1.10);
            const hood = new THREE.Mesh(hoodGeo, bodyMat);
            hood.position.set(0, 0.56, 1.15);
            hood.rotation.x = 0.13;
            frontClean.add(hood);

            for (let s = -1; s <= 1; s += 2) {
                const sideGeo = new THREE.BufferGeometry();
                const xPos = 0.85 * s;
                const vertices = new Float32Array([
                    xPos, 0.42, 1.70,
                    xPos, 0.42, 0.60,
                    xPos, 0.64, 0.60,

                    xPos, 0.42, 1.70,
                    xPos, 0.64, 0.60,
                    xPos, 0.42, 0.60
                ]);
                sideGeo.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
                sideGeo.computeVertexNormals();

                const sideMesh = new THREE.Mesh(sideGeo, bodyMat);
                frontClean.add(sideMesh);
            }

            const windshieldGeo = new THREE.BoxGeometry(1.48, 0.04, 0.92);
            const windshield = new THREE.Mesh(windshieldGeo, glassMat);
            windshield.position.set(0, 0.86, 0.38);
            windshield.rotation.x = 0.62;
            frontClean.add(windshield);

            for (let s = -1; s <= 1; s += 2) {
                const aPillar = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.06, 0.95), bodyMat);
                aPillar.position.set(0.74 * s, 0.86, 0.38);
                aPillar.rotation.x = 0.62;
                frontClean.add(aPillar);

                const popUp = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.02, 0.28), bodyMat);
                popUp.position.set(0.5 * s, 0.54, 1.45);
                popUp.rotation.x = 0.13;
                frontClean.add(popUp);

                // --- NOSTETUT JA PIMEÄT ETUVALOT ---
                const lightHousing = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.12, 0.08), darkTrimMat);
                lightHousing.position.set(0.52 * s, 0.44, 1.88);
                frontClean.add(lightHousing);

                for (let h = -1; h <= 1; h += 2) {
                    const reflectorGeo = new THREE.CylinderGeometry(0.048, 0.048, 0.04, 16);
                    reflectorGeo.rotateX(Math.PI / 2);
                    const reflector = new THREE.Mesh(reflectorGeo, unlitReflectorMat);
                    reflector.position.set(0.52 * s + h * 0.075, 0.44, 1.90);
                    frontClean.add(reflector);
                }

                const lightGlass = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.12, 0.02), clearHeadlightGlassMat);
                lightGlass.position.set(0.52 * s, 0.44, 1.92);
                frontClean.add(lightGlass);

                const indicator = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.08, 0.03), unlitIndicatorMat);
                indicator.position.set(0.71 * s, 0.36, 1.91);
                frontClean.add(indicator);
            }

            // Tuhoutunut etuosa
            const engineBlock = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.35, 0.85), darkTrimMat);
            engineBlock.position.set(0, 0.44, 1.10);
            frontDamaged.add(engineBlock);

            const fold1 = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.10, 1.00), damagedBodyMat);
            fold1.position.set(-0.35, 0.78, 1.10);
            fold1.rotation.set(-0.35, 0.25, -0.22);
            frontDamaged.add(fold1);

            const fold2 = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.10, 0.95), damagedBodyMat);
            fold2.position.set(0.38, 0.72, 1.15);
            fold2.rotation.set(0.28, -0.32, 0.18);
            frontDamaged.add(fold2);

            const smNose = new THREE.Mesh(new THREE.BoxGeometry(1.30, 0.34, 0.40), damagedBodyMat);
            smNose.position.set(-0.08, 0.40, 1.60);
            smNose.rotation.set(0.12, -0.18, 0.20);
            frontDamaged.add(smNose);

            frontDamaged.visible = false;

            const frontGroup = new THREE.Group();
            frontGroup.add(frontClean, frontDamaged);
            root.add(frontGroup);

            // 4. SIVUOVET & LASIT
            function createSideWindowGeo(isLeft) {
                const geom = new THREE.BufferGeometry();
                const sign = isLeft ? -1 : 1;
                const xBase = 0.81 * sign;
                const xTop = 0.70 * sign;

                const vertices = new Float32Array([
                    xBase, 0.60,  0.83,
                    xTop,  1.12,  0.025,
                    xTop,  1.12, -0.725,
                    xBase, 0.60, -0.725
                ]);

                const indices = isLeft ? [0, 1, 2,  0, 2, 3] : [0, 2, 1,  0, 3, 2];
                geom.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
                geom.setIndex(indices);
                geom.computeVertexNormals();
                return geom;
            }

            const doorLClean = new THREE.Group();
            const doorLDamaged = new THREE.Group();

            const doorLPanel = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.36, 1.32), bodyMat);
            doorLPanel.position.set(-0.82, 0.46, -0.06);
            doorLClean.add(doorLPanel);

            const doorLStripe = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.04, 1.32), darkTrimMat);
            doorLStripe.position.set(-0.83, 0.58, -0.06);
            doorLClean.add(doorLStripe);

            const doorLInner = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.42, 1.28), interiorMat);
            doorLInner.position.set(-0.76, 0.45, -0.06);
            doorLClean.add(doorLInner);

            const winL = new THREE.Mesh(createSideWindowGeo(true), glassMat);
            doorLClean.add(winL);

            const crDoorL1 = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.30, 1.25), damagedBodyMat);
            crDoorL1.position.set(-0.72, 0.46, -0.06);
            crDoorL1.rotation.set(0.12, 0.18, 0.25);
            doorLDamaged.add(crDoorL1);

            doorLDamaged.visible = false;

            const doorLGroup = new THREE.Group();
            doorLGroup.add(doorLClean, doorLDamaged);
            root.add(doorLGroup);

            const doorRClean = new THREE.Group();
            const doorRDamaged = new THREE.Group();

            const doorRPanel = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.36, 1.32), bodyMat);
            doorRPanel.position.set(0.82, 0.46, -0.06);
            doorRClean.add(doorRPanel);

            const doorRStripe = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.04, 1.32), darkTrimMat);
            doorRStripe.position.set(0.83, 0.58, -0.06);
            doorRClean.add(doorRStripe);

            const doorRInner = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.42, 1.28), interiorMat);
            doorRInner.position.set(0.76, 0.45, -0.06);
            doorRClean.add(doorRInner);

            const winR = new THREE.Mesh(createSideWindowGeo(false), glassMat);
            doorRClean.add(winR);

            const crDoorR1 = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.30, 1.25), damagedBodyMat);
            crDoorR1.position.set(0.72, 0.46, -0.06);
            crDoorR1.rotation.set(-0.12, -0.18, -0.25);
            doorRDamaged.add(crDoorR1);

            doorRDamaged.visible = false;

            const doorRGroup = new THREE.Group();
            doorRGroup.add(doorRClean, doorRDamaged);
            root.add(doorRGroup);

            // 5. TAKAOSA
            const rearClean = new THREE.Group();
            const rearDamaged = new THREE.Group();

            const roof = new THREE.Mesh(new THREE.BoxGeometry(1.35, 0.05, 0.75), bodyMat);
            roof.position.set(0, 1.12, -0.35);
            rearClean.add(roof);

            for (let s = -1; s <= 1; s += 2) {
                const bPillar = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.54, 0.12), bodyMat);
                bPillar.position.set(0.78 * s, 0.85, -0.66);
                rearClean.add(bPillar);

                const rearQuarterPanel = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.48, 1.10), bodyMat);
                rearQuarterPanel.position.set(0.80 * s, 0.54, -1.25);
                rearClean.add(rearQuarterPanel);

                const rearTriGeo = new THREE.BufferGeometry();
                const xSide = 0.79 * s;
                const rearVerts = new Float32Array([
                    xSide, 1.12, -0.66,
                    xSide, 0.78, -0.66,
                    xSide, 0.81, -1.75,

                    xSide, 1.12, -0.66,
                    xSide, 0.81, -1.75,
                    xSide, 0.78, -0.66
                ]);
                rearTriGeo.setAttribute('position', new THREE.BufferAttribute(rearVerts, 3));
                rearTriGeo.computeVertexNormals();

                const rearTriMesh = new THREE.Mesh(rearTriGeo, bodyMat);
                rearClean.add(rearTriMesh);
            }

            const rearUnderDeck = new THREE.Mesh(new THREE.BoxGeometry(1.48, 0.04, 1.10), bodyMat);
            rearUnderDeck.position.set(0, 0.94, -1.20);
            rearUnderDeck.rotation.x = -0.20;
            rearClean.add(rearUnderDeck);

            for (let i = 0; i < 5; i++) {
                const slat = new THREE.Mesh(new THREE.BoxGeometry(1.28, 0.025, 0.10), darkTrimMat);
                const slatY = 1.10 - i * 0.06;
                const slatZ = -0.70 - i * 0.18;
                slat.position.set(0, slatY, slatZ);
                slat.rotation.x = -0.38;
                rearClean.add(slat);
            }

            const rearDeck = new THREE.Mesh(new THREE.BoxGeometry(1.72, 0.38, 0.5), bodyMat);
            rearDeck.position.set(0, 0.62, -1.8);
            rearClean.add(rearDeck);

            const rearBumper = new THREE.Mesh(new THREE.BoxGeometry(1.76, 0.18, 0.2), darkTrimMat);
            rearBumper.position.set(0, 0.35, -2.02);
            rearClean.add(rearBumper);

            for (let s = -1; s <= 1; s += 2) {
                const tailLight = new THREE.Mesh(new THREE.BoxGeometry(0.50, 0.14, 0.04), redLightMat);
                tailLight.position.set(0.55 * s, 0.62, -2.06);
                rearClean.add(tailLight);
            }

            const exhaust = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.3, 12), chromeMat);
            exhaust.rotation.x = Math.PI / 2;
            exhaust.position.set(0.5, 0.25, -2.08);
            rearClean.add(exhaust);

            // MONIPUOLINEN TUHOUTUNUT TAKAOSA
            const crRearMain = new THREE.Mesh(new THREE.BoxGeometry(1.65, 0.38, 1.10), damagedBodyMat);
            crRearMain.position.set(-0.05, 0.66, -1.50);
            crRearMain.rotation.set(0.18, -0.12, 0.15);
            rearDamaged.add(crRearMain);

            const crSlatBundle = new THREE.Mesh(new THREE.BoxGeometry(1.25, 0.12, 0.65), darkTrimMat);
            crSlatBundle.position.set(0.10, 0.88, -1.15);
            crSlatBundle.rotation.set(-0.35, 0.25, -0.20);
            rearDamaged.add(crSlatBundle);

            const crBumperBent = new THREE.Mesh(new THREE.BoxGeometry(1.50, 0.18, 0.22), darkTrimMat);
            crBumperBent.position.set(-0.15, 0.28, -2.05);
            crBumperBent.rotation.set(0.25, -0.30, 0.12);
            rearDamaged.add(crBumperBent);

            const crTailFrame = new THREE.Mesh(new THREE.BoxGeometry(1.40, 0.15, 0.15), darkTrimMat);
            crTailFrame.position.set(0.0, 0.42, -1.75);
            rearDamaged.add(crTailFrame);

            const crTailLightLeft = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.12, 0.05), redLightMat);
            crTailLightLeft.position.set(-0.55, 0.58, -2.02);
            crTailLightLeft.rotation.set(0.30, 0.15, -0.40);
            rearDamaged.add(crTailLightLeft);

            const crExhaust1 = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.35, 12), chromeMat);
            crExhaust1.position.set(0.48, 0.20, -2.10);
            crExhaust1.rotation.set(0.8, -0.3, 0);
            rearDamaged.add(crExhaust1);

            const crExhaust2 = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.35, 12), chromeMat);
            crExhaust2.position.set(-0.48, 0.18, -2.08);
            crExhaust2.rotation.set(0.6, 0.2, 0.2);
            rearDamaged.add(crExhaust2);

            const crFoldedPanel = new THREE.Mesh(new THREE.BoxGeometry(0.40, 0.25, 0.80), damagedBodyMat);
            crFoldedPanel.position.set(0.70, 0.72, -1.30);
            crFoldedPanel.rotation.set(-0.40, -0.20, 0.35);
            rearDamaged.add(crFoldedPanel);

            const crInternalRib = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.35, 0.80), darkTrimMat);
            crInternalRib.position.set(-0.35, 0.52, -1.25);
            crInternalRib.rotation.set(0.20, 0.40, -0.15);
            rearDamaged.add(crInternalRib);

            rearDamaged.visible = false;

            const rearGroup = new THREE.Group();
            rearGroup.add(rearClean, rearDamaged);
            root.add(rearGroup);

            const carState = {
                frontDestroyed: false,
                doorLeftDestroyed: false,
                doorRightDestroyed: false,
                rearDestroyed: false
            };

            root.userData = {
                isCar: true,
                carState,
                frontClean, frontDamaged,
                doorLClean, doorLDamaged,
                doorRClean, doorRDamaged,
                rearClean, rearDamaged
            };

            root.traverse(child => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });

            // TUPLATAAN AUTON KOKO (2X SUUREMPI)
            root.scale.set(2.0, 2.0, 2.0);

            return root;
        }
    },

    spacecraft: {
        createModel: () => {
            const ship = new THREE.Group(); 
            const hasSpacecraftTex = gameSettings.texturesEnabled && window.spacecraftTexture;

            const bodyMaterial = new THREE.MeshStandardMaterial({ 
                color: hasSpacecraftTex ? 0xffffff : 0x777788, 
                map: hasSpacecraftTex ? window.spacecraftTexture : null,
                metalness: 0.8, 
                roughness: 0.4 
            }); 
            const wingMaterial = new THREE.MeshStandardMaterial({ 
                color: hasSpacecraftTex ? 0xffffff : 0xbb4433, 
                map: hasSpacecraftTex ? window.spacecraftTexture : null,
                metalness: 0.7, 
                roughness: 0.5 
            }); 
            const cockpitMaterial = new THREE.MeshStandardMaterial({ 
                color: 0x00aaff, 
                metalness: 0.2, 
                roughness: 0.1, 
                transparent: true, 
                opacity: 0.4 
            }); 
            const engineGlowMaterial = new THREE.MeshBasicMaterial({ color: 0x00ffff }); 
            const gunMaterial = new THREE.MeshStandardMaterial({ 
                color: hasSpacecraftTex ? 0xffffff : 0x333333, 
                map: hasSpacecraftTex ? window.spacecraftTexture : null,
                metalness: 0.9, 
                roughness: 0.6 
            }); 
            
            const bodyGeometry = new THREE.IcosahedronGeometry(4, 1); 
            const mainBody = new THREE.Mesh(bodyGeometry, bodyMaterial); 
            mainBody.scale.set(1, 0.4, 2.5); 
            mainBody.castShadow = true; 
            ship.add(mainBody); 
            
            const cockpitGeometry = new THREE.SphereGeometry(1.5, 32, 16); 
            const cockpit = new THREE.Mesh(cockpitGeometry, cockpitMaterial); 
            cockpit.position.set(0, 0.7, 3.5); 
            cockpit.scale.set(1, 0.7, 1.2); 
            ship.add(cockpit); 
            
            const wingShape = new THREE.Shape(); 
            wingShape.moveTo(0, 0); 
            wingShape.lineTo(6, 1.5); 
            wingShape.lineTo(7, -1.5); 
            wingShape.lineTo(0, -1); 
            wingShape.lineTo(0, 0); 
            const extrudeSettings = { depth: 0.2, bevelEnabled: false }; 
            const wingGeometry = new THREE.ExtrudeGeometry(wingShape, extrudeSettings); 
            const rightWing = new THREE.Mesh(wingGeometry, wingMaterial); 
            rightWing.position.set(1.5, 0, -1); 
            rightWing.castShadow = true; 
            ship.add(rightWing); 
            const leftWing = rightWing.clone(); 
            leftWing.scale.x = -1; 
            leftWing.position.x = -1.5; 
            ship.add(leftWing); 
            
            const engineGroup = new THREE.Group(); 
            const engineBodyGeom = new THREE.CylinderGeometry(1, 1.2, 3, 16); 
            const engineBody = new THREE.Mesh(engineBodyGeom, bodyMaterial); 
            engineBody.castShadow = true; 
            const engineGlowGeom = new THREE.CylinderGeometry(0.8, 0.8, 0.1, 16); 
            const engineGlow = new THREE.Mesh(engineGlowGeom, engineGlowMaterial); 
            engineGlow.position.y = -1.5; 
            engineBody.add(engineGlow); 
            const rightEngine = engineBody.clone(); 
            rightEngine.position.set(2.5, 0, -5); 
            ship.add(rightEngine); 
            const leftEngine = engineBody.clone(); 
            leftEngine.position.set(-2.5, 0, -5); 
            ship.add(leftEngine); 
            
            const createMachineGun = () => { 
                const gun = new THREE.Group(); 
                const barrelGeom = new THREE.CylinderGeometry(0.1, 0.1, 2.5, 8); 
                const barrel = new THREE.Mesh(barrelGeom, gunMaterial); 
                barrel.rotation.x = Math.PI / 2; 
                barrel.position.z = 1.25; 
                const bodyGeom = new THREE.BoxGeometry(0.5, 0.4, 1); 
                const body = new THREE.Mesh(bodyGeom, gunMaterial); 
                gun.add(barrel, body); 
                return gun; 
            }; 
            const rightGun = createMachineGun(); 
            rightGun.position.set(3.5, -0.5, 1.5); 
            ship.add(rightGun); 
            const leftGun = createMachineGun(); 
            leftGun.position.set(-3.5, -0.5, 1.5); 
            ship.add(leftGun); 
            ship.userData.guns = [rightGun, leftGun]; 
            return ship;
        },
        createJoystickModel: () => {
            const joystick = new THREE.Group(); joystick.scale.setScalar(1.0); const mat = new THREE.MeshStandardMaterial({color: 0x282828, roughness: 0.3, metalness: 0.9}); const base = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.25, 0.1, 16), mat); joystick.add(base); const stickMat = new THREE.MeshStandardMaterial({color: 0x555555, roughness: 0.2, metalness: 1.0}); const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.5, 8), stickMat); stick.position.y = 0.25; joystick.add(stick); const handleMat = new THREE.MeshStandardMaterial({color: 0x282828, roughness: 0.4, metalness: 0.5}); const handle = new THREE.SphereGeometry(0.06, 16, 16); const hMesh = new THREE.Mesh(handle, handleMat); hMesh.position.y = 0.25; stick.add(hMesh); joystick.position.set(0, -0.7, -0.7); joystick.rotation.x = 0.3; joystick.visible = false; joystick.renderOrder = 999; joystick.traverse(child => { if (child.isMesh) { child.material.depthTest = false; child.material.depthWrite = false; } }); return joystick;
        },
        createCockpitHUDModel: () => {
            const canvas = document.createElement('canvas'); canvas.width = 512; canvas.height = 256; const ctx = canvas.getContext('2d'); const hexRadius = 30; const hexHeight = Math.sqrt(3) * hexRadius; const hexWidth = 2 * hexRadius; ctx.strokeStyle = 'rgba(0, 180, 255, 1.0)'; ctx.lineWidth = 3; for (let row = -1; row < canvas.height / hexHeight + 1; row++) { for (let col = -1; col < canvas.width / (hexWidth * 0.75) + 1; col++) { let x = col * hexWidth * 0.75; let y = row * hexHeight; if (col % 2 !== 0) { y += hexHeight / 2; } ctx.beginPath(); for (let i = 0; i < 6; i++) { const angle_deg = 60 * i - 30; const angle_rad = Math.PI / 180 * angle_deg; ctx.lineTo(x + hexRadius * Math.cos(angle_rad), y + hexRadius * Math.sin(angle_rad)); } ctx.closePath(); ctx.stroke(); } } const texture = new THREE.CanvasTexture(canvas); texture.wrapS = THREE.RepeatWrapping; texture.wrapT = THREE.RepeatWrapping; texture.repeat.set(2, 1);
            const hudMaterial = new THREE.MeshBasicMaterial({ map: texture, color: 0x00aaff, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, depthWrite: false });
            const hudGeometry = new THREE.CylinderGeometry(1.5, 1.5, 2, 64, 1, true, -Math.PI/3, Math.PI * (2/3)); const hud = new THREE.Mesh(hudGeometry, hudMaterial); hud.position.set(0, 0.6, -1.6); hud.rotation.set(-0.2, 0, 0); hud.visible = false; return hud;
        },
        createStarfield: () => {
            const starCount = 5000; const positions = new Float32Array(starCount * 3); const geometry = new THREE.BufferGeometry(); for (let i = 0; i < starCount; i++) { const i3 = i * 3; positions[i3] = (Math.random() - 0.5) * 1000; positions[i3 + 1] = (Math.random() - 0.5) * 1000; positions[i3 + 2] = (Math.random() - 1) * 1000; } geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3)); const material = new THREE.PointsMaterial({ color: 0xffffff, size: 1.5, sizeAttenuation: true, depthWrite: false, blending: THREE.AdditiveBlending }); const points = new THREE.Points(geometry, material); points.visible = false; return points;
        }
    }
};