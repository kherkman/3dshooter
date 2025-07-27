const GameWorld = {
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
            spawnRange: 190,
            initialAlienCount: 15,
            fogColor: 0x8899aa,
            create: (scene, buildingColliders) => {
                const mistColor = GameWorld.levels.city.fogColor;
                scene.background = new THREE.Color(mistColor);
                scene.fog = new THREE.Fog(mistColor, 0, 70);
                const hemisphereLight = new THREE.HemisphereLight(0xffdcb1, 0x444455, 1.2); scene.add(hemisphereLight);
                const directionalLight = new THREE.DirectionalLight(0xffa500, 0.7); directionalLight.position.set(50, 50, 25); directionalLight.castShadow = true; directionalLight.shadow.mapSize.width = 2048; directionalLight.shadow.mapSize.height = 2048; directionalLight.shadow.camera.left = -100; directionalLight.shadow.camera.right = 100; directionalLight.shadow.camera.top = 100; directionalLight.shadow.camera.bottom = -100; scene.add(directionalLight);
                const ground = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.MeshStandardMaterial({ color: 0x4a4a4a, roughness: 0.9 })); ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
                
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
                
                const bG = new THREE.BoxGeometry(1, 1, 1); const wG = new THREE.BoxGeometry(0.8, 1.6, 0.1); const wM = new THREE.MeshStandardMaterial({ emissive: 0xffaa00, emissiveIntensity: 1.5, color: 0xffaa00 }); const sR = 15.0; for (let i = 0; i < 200; i++) { const p = new THREE.Vector2((Math.random() - 0.5) * 190, (Math.random() - 0.5) * 190); if (p.distanceTo(new THREE.Vector2(0,10)) < sR || p.distanceTo(new THREE.Vector2(50,50)) < 30) continue; const w = Math.random() * 8 + 6; const d = Math.random() * 8 + 6; const h = Math.random() * 40 + 15; let c = new THREE.Color(); if (Math.random() > 0.4) { const b = Math.random() * 0.2 + 0.2; c.setRGB(b, b * 0.7, b * 0.5); } else { const g = Math.random() * 0.3 + 0.2; c.setRGB(g, g, g); } const bM = new THREE.MeshStandardMaterial({ color: c, roughness: 0.9, metalness: 0.2 }); const b = new THREE.Mesh(bG, bM); b.scale.set(w, h, d); b.position.set(p.x, h / 2, p.y); b.castShadow = true; b.receiveShadow = true; scene.add(b); buildingColliders.push(new THREE.Box3().setFromObject(b)); const wS = 2.0; for (let y = wS; y < h - wS; y += wS * 1.5) { for (let x = -w / 2 + wS; x < w / 2 - wS; x += wS) { if (Math.random() > 0.3) { const win = new THREE.Mesh(wG, wM); win.position.set(p.x + x, y, p.y + d / 2 + 0.01); scene.add(win); } if (Math.random() > 0.3) { const win = new THREE.Mesh(wG, wM); win.position.set(p.x + x, y, p.y - d / 2 - 0.01); scene.add(win); } } for (let z = -d / 2 + wS; z < d / 2 - wS; z += wS) { if (Math.random() > 0.3) { const win = new THREE.Mesh(wG, wM); win.rotation.y = Math.PI / 2; win.position.set(p.x + w / 2 + 0.01, y, p.y + z); scene.add(win); } if (Math.random() > 0.3) { const win = new THREE.Mesh(wG, wM); win.rotation.y = Math.PI / 2; win.position.set(p.x - w / 2 - 0.01, y, p.y + z); scene.add(win); } } } }
                return { ground, hemisphereLight, directionalLight, landingPadPosition: landingPad.position.clone().add(new THREE.Vector3(0, 1.0, 0)) };
            },
            map: { size: 200, bgColor: '#2a1d14', buildingColor: '#5a483c' }
        },
        desert: {
            name: 'Desert',
            spawnRange: 380,
            initialAlienCount: 20,
            fogColor: 0xd2b48c,
            create: (scene, buildingColliders) => {
                const desertColor = GameWorld.levels.desert.fogColor;
                scene.background = new THREE.Color(desertColor);
                scene.fog = new THREE.Fog(desertColor, 0, 100);
                const hemisphereLight = new THREE.HemisphereLight(0xffffbb, 0x080820, 1.5); scene.add(hemisphereLight);
                const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0); directionalLight.position.set(-100, 100, 50); directionalLight.castShadow = true; directionalLight.shadow.mapSize.width = 2048; directionalLight.shadow.mapSize.height = 2048; directionalLight.shadow.camera.left = -150; directionalLight.shadow.camera.right = 150; directionalLight.shadow.camera.top = 150; directionalLight.shadow.camera.bottom = -150; scene.add(directionalLight);
                const ground = new THREE.Mesh( new THREE.PlaneGeometry(400, 400), new THREE.MeshStandardMaterial({ color: 0xc2b280, roughness: 1.0 }) ); ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
                const rockGeo = new THREE.DodecahedronGeometry(1); const rockMat = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 1.0, flatShading: true });
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
            spawnRange: 380,
            initialAlienCount: 25,
            fogColor: 0x221105,
            create: (scene, buildingColliders) => {
                scene.background = new THREE.Color(GameWorld.levels.volcanic.fogColor);
                scene.fog = new THREE.Fog(GameWorld.levels.volcanic.fogColor, 0, 80);
                const hemisphereLight = new THREE.HemisphereLight(0xff8844, 0x111111, 1.8); scene.add(hemisphereLight);
                const directionalLight = new THREE.DirectionalLight(0xff4500, 0.8); directionalLight.position.set(80, 60, 70); directionalLight.castShadow = true; directionalLight.shadow.mapSize.width = 2048; directionalLight.shadow.mapSize.height = 2048; directionalLight.shadow.camera.left = -150; directionalLight.shadow.camera.right = 150; directionalLight.shadow.camera.top = 150; directionalLight.shadow.camera.bottom = -150; scene.add(directionalLight);
                const ground = new THREE.Mesh( new THREE.PlaneGeometry(400, 400), new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.7 }) ); ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
                const rockGeo = new THREE.IcosahedronGeometry(1, 0); const rockMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9, flatShading: true });
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
                const pyramidMat = new THREE.MeshStandardMaterial({ color: 0x181818, roughness: 0.8 });
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
            spawnRange: 380,
            initialAlienCount: 18,
            fogColor: 0xeeeeff,
            create: (scene, buildingColliders) => {
                scene.background = new THREE.Color(GameWorld.levels.ice.fogColor);
                scene.fog = new THREE.Fog(GameWorld.levels.ice.fogColor, 0, 120);
                const hemisphereLight = new THREE.HemisphereLight(0xccddff, 0x99aadd, 1.5); scene.add(hemisphereLight);
                const directionalLight = new THREE.DirectionalLight(0xffffff, 0.9); directionalLight.position.set(-50, 80, -50); directionalLight.castShadow = true; directionalLight.shadow.mapSize.width = 2048; directionalLight.shadow.mapSize.height = 2048; directionalLight.shadow.camera.left = -150; directionalLight.shadow.camera.right = 150; directionalLight.shadow.camera.top = 150; directionalLight.shadow.camera.bottom = -150; scene.add(directionalLight);
                const ground = new THREE.Mesh( new THREE.PlaneGeometry(400, 400), new THREE.MeshStandardMaterial({ color: 0xddeeff, roughness: 0.1, metalness: 0.1 }) ); ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
                const rockGeo = new THREE.IcosahedronGeometry(2, 1); const rockMat = new THREE.MeshStandardMaterial({ color: 0xaaccff, roughness: 0.2, metalness: 0.2, flatShading: true });
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
                const ruinMat = new THREE.MeshStandardMaterial({color:0x778899, roughness:0.8});
                for(let i=0; i<30; i++) { 
                    const size = Math.random()*5+2; const h = Math.random()*8+1; 
                    const ruin = new THREE.Mesh(new THREE.BoxGeometry(size,h,size), ruinMat); 
                    ruin.position.set((Math.random()-0.5)*380, h/2, (Math.random()-0.5)*380); 
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
                    const wallMat = new THREE.MeshStandardMaterial({color:0x48494B, roughness:0.7}); const wallHeight = 10, wallThick=2;
                    const createWall = (w,d, p, r) => { 
                        const wall = new THREE.Mesh(new THREE.BoxGeometry(w,wallHeight,d), wallMat); 
                        wall.position.copy(p); wall.rotation.y = r; scene.add(wall); 
                        const box = new THREE.Box3().setFromObject(wall);
                        const size = new THREE.Vector3(); box.getSize(size);
                        box.expandByVector(size.multiplyScalar(-0.1));
                        buildingColliders.push(box); 
                    };
                    createWall(40, wallThick, pos.clone().add(new THREE.Vector3(0,wallHeight/2,20)), 0); 
                    createWall(15, wallThick, pos.clone().add(new THREE.Vector3(12.5,wallHeight/2,-20)), 0); 
                    createWall(15, wallThick, pos.clone().add(new THREE.Vector3(-12.5,wallHeight/2,-20)), 0); 
                    createWall(40, wallThick, pos.clone().add(new THREE.Vector3(20,wallHeight/2,0)), Math.PI/2); 
                    createWall(40, wallThick, pos.clone().add(new THREE.Vector3(-20,wallHeight/2,0)), Math.PI/2);
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
                const castleTowerTopPosition = createCastle(new THREE.Vector3(100,0,100));
                
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
            spawnRange: 380,
            initialAlienCount: 30,
            fogColor: 0x445544,
            fogDensity: 0.015,
            create: (scene, buildingColliders, vegetation, bunkers) => {
                scene.background = new THREE.Color(GameWorld.levels.toxic.fogColor);
                scene.fog = new THREE.FogExp2(GameWorld.levels.toxic.fogColor, GameWorld.levels.toxic.fogDensity);
                const hemisphereLight = new THREE.HemisphereLight(0xaaffaa, 0x446644, 1.3); scene.add(hemisphereLight);
                const directionalLight = new THREE.DirectionalLight(0x88ff88, 0.6); directionalLight.position.set(0, 100, 0); directionalLight.castShadow = true; directionalLight.shadow.mapSize.width = 2048; directionalLight.shadow.mapSize.height = 2048; directionalLight.shadow.camera.left = -150; directionalLight.shadow.camera.right = 150; directionalLight.shadow.camera.top = 150; directionalLight.shadow.camera.bottom = -150; scene.add(directionalLight);
                const ground = new THREE.Mesh( new THREE.PlaneGeometry(400, 400), new THREE.MeshStandardMaterial({ color: 0x334433, roughness: 1.0 }) ); ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
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
                
                const vegMat = new THREE.MeshStandardMaterial({color:0x44aa44, roughness:0.8}); const poisonMat = new THREE.MeshStandardMaterial({color:0xffff00, emissive:0xaaaa00, emissiveIntensity:0.5});
                for(let i=0;i<150;i++){ 
                    const isPoison = Math.random()<0.2;
                    const plant = new THREE.Group();
                    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.4, 6, 8), isPoison ? poisonMat : vegMat);
                    stem.position.y = 3;
                    plant.add(stem);
                    for(let j=0; j<5; j++) {
                        const leaf = new THREE.Mesh(new THREE.SphereGeometry(1.5, 8, 4), isPoison ? poisonMat : vegMat);
                        leaf.scale.z = 0.2;
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
                const instancedGrass = new THREE.InstancedMesh(grassGeo, grassMat, 220000);
                const dummy = new THREE.Object3D();
                for(let i=0; i<220000; i++) {
                    dummy.position.set((Math.random()-0.5)*400, 0.25, (Math.random()-0.5)*400);
                    dummy.rotation.y = Math.random() * Math.PI;
                    dummy.updateMatrix();
                    instancedGrass.setMatrixAt(i, dummy.matrix);
                }
                scene.add(instancedGrass);
                
                const shelterPlantMat = new THREE.MeshStandardMaterial({color: 0x338833, roughness: 0.9});
                for (let i = 0; i < 300; i++) {
                    const shelterPlant = new THREE.Group();
                    const height = Math.random() * 10 + 8; 
                    const stem = new THREE.Mesh(
                        new THREE.CylinderGeometry(0.1, 0.15, height, 5),
                        shelterPlantMat
                    );
                    stem.position.y = height / 2;
                    shelterPlant.add(stem);
                    shelterPlant.position.set((Math.random() - 0.5) * 380, 0, (Math.random() - 0.5) * 380);
                    shelterPlant.castShadow = true;
                    shelterPlant.userData.isShelter = true; 
                    vegetation.push(shelterPlant); 
                    scene.add(shelterPlant);
                }

                const treeTrunkMat = new THREE.MeshStandardMaterial({ color: 0x5a3b2a, roughness: 0.9 });
                const treeLeafMat = new THREE.MeshStandardMaterial({ color: 0x223322, roughness: 0.8 });
                for (let i = 0; i < 70; i++) {
                    const tree = new THREE.Group();
                    const height = Math.random() * 20 + 30; 
                    const radius = Math.random() * 1 + 0.8;
                    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius * 0.8, height, 12), treeTrunkMat);
                    trunk.position.y = height / 2;
                    trunk.castShadow = true;
                    tree.add(trunk);
                    
                    const canopy = new THREE.Mesh(new THREE.SphereGeometry(radius * 5, 8, 6), treeLeafMat);
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
                const ground = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), new THREE.MeshStandardMaterial({
                    color: 0x221133,
                    roughness: 0.3
                }));
                ground.rotation.x = -Math.PI / 2;
                ground.receiveShadow = true;
                scene.add(ground);
                const crystalGeo = new THREE.OctahedronGeometry(1);
                const crystalMat = new THREE.MeshStandardMaterial({
                    color: 0xaa88ff,
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
                const serverMat = new THREE.MeshStandardMaterial({
                    color: 0x333344,
                    emissive: 0x222288,
                    emissiveIntensity: 1
                });
                for (let i = 0; i < 40; i++) {
                    const sSize = Math.random() * 4 + 2;
                    const server = new THREE.Mesh(new THREE.BoxGeometry(sSize, sSize * 2, sSize), serverMat);
                    server.position.set((Math.random() - 0.5) * 380, sSize, (Math.random() - 0.5) * 380);
                    scene.add(server);
                    const box = new THREE.Box3().setFromObject(server);
                    const size = new THREE.Vector3();
                    box.getSize(size);
                    box.expandByVector(size.multiplyScalar(-0.1)); 
                    buildingColliders.push(box);
                }
                
                const mazeGridSize = 25; 
                const cellSize = 8;
                const wallHeight = 6;
                const wallThickness = 1.0;
                const mazeCenterPos = new THREE.Vector3(-100, 0, -100);
                const mazeMat = new THREE.MeshStandardMaterial({ color: 0x332255, roughness: 0.6, metalness: 0.2, emissive: 0x221133, emissiveIntensity: 0.4 });
                
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
                    mazeCenter: mazeCenterPos
                };
            },
            map: {
                size: 400,
                bgColor: '#221133',
                buildingColor: '#442266'
            }
        },
    },

    spacecraft: {
        createModel: () => {
            const ship = new THREE.Group(); const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x777788, metalness: 0.8, roughness: 0.4 }); const wingMaterial = new THREE.MeshStandardMaterial({ color: 0xbb4433, metalness: 0.7, roughness: 0.5 }); const cockpitMaterial = new THREE.MeshStandardMaterial({ color: 0x00aaff, metalness: 0.2, roughness: 0.1, transparent: true, opacity: 0.4 }); const engineGlowMaterial = new THREE.MeshBasicMaterial({ color: 0x00ffff }); const gunMaterial = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.9, roughness: 0.6 }); const bodyGeometry = new THREE.IcosahedronGeometry(4, 1); const mainBody = new THREE.Mesh(bodyGeometry, bodyMaterial); mainBody.scale.set(1, 0.4, 2.5); mainBody.castShadow = true; ship.add(mainBody); const cockpitGeometry = new THREE.SphereGeometry(1.5, 32, 16); const cockpit = new THREE.Mesh(cockpitGeometry, cockpitMaterial); cockpit.position.set(0, 0.7, 3.5); cockpit.scale.set(1, 0.7, 1.2); ship.add(cockpit); const wingShape = new THREE.Shape(); wingShape.moveTo(0, 0); wingShape.lineTo(6, 1.5); wingShape.lineTo(7, -1.5); wingShape.lineTo(0, -1); wingShape.lineTo(0, 0); const extrudeSettings = { depth: 0.2, bevelEnabled: false }; const wingGeometry = new THREE.ExtrudeGeometry(wingShape, extrudeSettings); const rightWing = new THREE.Mesh(wingGeometry, wingMaterial); rightWing.position.set(1.5, 0, -1); rightWing.castShadow = true; ship.add(rightWing); const leftWing = rightWing.clone(); leftWing.scale.x = -1; leftWing.position.x = -1.5; ship.add(leftWing); const engineGroup = new THREE.Group(); const engineBodyGeom = new THREE.CylinderGeometry(1, 1.2, 3, 16); const engineBody = new THREE.Mesh(engineBodyGeom, bodyMaterial); engineBody.castShadow = true; const engineGlowGeom = new THREE.CylinderGeometry(0.8, 0.8, 0.1, 16); const engineGlow = new THREE.Mesh(engineGlowGeom, engineGlowMaterial); engineGlow.position.y = -1.5; engineBody.add(engineGlow); const rightEngine = engineBody.clone(); rightEngine.position.set(2.5, 0, -5); ship.add(rightEngine); const leftEngine = engineBody.clone(); leftEngine.position.set(-2.5, 0, -5); ship.add(leftEngine); const createMachineGun = () => { const gun = new THREE.Group(); const barrelGeom = new THREE.CylinderGeometry(0.1, 0.1, 2.5, 8); const barrel = new THREE.Mesh(barrelGeom, gunMaterial); barrel.rotation.x = Math.PI / 2; barrel.position.z = 1.25; const bodyGeom = new THREE.BoxGeometry(0.5, 0.4, 1); const body = new THREE.Mesh(bodyGeom, gunMaterial); gun.add(barrel, body); return gun; }; const rightGun = createMachineGun(); rightGun.position.set(3.5, -0.5, 1.5); ship.add(rightGun); const leftGun = createMachineGun(); leftGun.position.set(-3.5, -0.5, 1.5); ship.add(leftGun); ship.userData.guns = [rightGun, leftGun]; return ship;
        },
        createJoystickModel: () => {
            const joystick = new THREE.Group(); joystick.scale.setScalar(1.0); const mat = new THREE.MeshStandardMaterial({color: 0x282828, roughness: 0.3, metalness: 0.9}); const base = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.25, 0.1, 16), mat); joystick.add(base); const stickMat = new THREE.MeshStandardMaterial({color: 0x555555, roughness: 0.2, metalness: 1.0}); const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.5, 8), stickMat); stick.position.y = 0.25; joystick.add(stick); const handleMat = new THREE.MeshStandardMaterial({color: 0xdd2222, roughness: 0.4, metalness: 0.5}); const handle = new THREE.Mesh(new THREE.SphereGeometry(0.06, 16, 16), handleMat); handle.position.y = 0.25; stick.add(handle); joystick.position.set(0, -0.9, -0.7); joystick.rotation.x = 0.3; joystick.visible = false; joystick.renderOrder = 999; joystick.traverse(child => { if (child.isMesh) { child.material.depthTest = false; child.material.depthWrite = false; } }); return joystick;
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
