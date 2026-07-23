// --- PROSEDURAALINEN METALLITEKSTUURI ROBOTILLE ---
function createAdvancedMetalTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#787b82';
    ctx.fillRect(0, 0, 512, 512);

    for (let i = 0; i < 100000; i++) {
        const x = Math.random() * 512;
        const y = Math.random() * 512;
        const val = (Math.random() - 0.5) * 40;
        ctx.fillStyle = `rgba(${120 + val}, ${120 + val}, ${120 + val}, 0.12)`;
        ctx.fillRect(x, y, 2, 2);
    }

    for (let i = 0; i < 300; i++) {
        ctx.strokeStyle = Math.random() > 0.5 ? 'rgba(30, 30, 35, 0.12)' : 'rgba(230, 230, 240, 0.18)';
        ctx.lineWidth = Math.random() * 1.5;
        ctx.beginPath();
        const x = Math.random() * 512;
        const y = Math.random() * 512;
        const len = 30 + Math.random() * 80;
        ctx.moveTo(x, y);
        ctx.lineTo(x + len, y + (Math.random() - 0.5) * 10);
        ctx.stroke();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(2, 2);
    return texture;
}

let robotMetalTexture = null;

GameData.enemies = {
    ground: {
        name: 'Bionic Bug',
        description: 'A fast, spider-like robot that chases and pounces on its target.',
        levels: ['city', 'desert', 'volcanic', 'toxic', 'crystal'],
        spawnWeight: 0.65,
        initialSpawn: false,
        properties: { health: 2, score: 15, spawnY: 0.6, sightRange: 40, chaseSpeed: 8, pounceRange: 35, pounceCooldown: 2.0, pounceWindUp: 0.25, pounceForce: 30, pounceLift: 12, pounceDamage: 20 },
        model: () => {
            const spiderGroup = new THREE.Group();
            const animatableGroup = new THREE.Group(); spiderGroup.add(animatableGroup);
            const hasEnemyBlackTex = (typeof gameSettings !== 'undefined' && gameSettings.texturesEnabled) && window.enemyBlackTexture;
            const bodyMaterial = new THREE.MeshStandardMaterial({ 
                color: hasEnemyBlackTex ? 0xffffff : 0x444444, 
                map: hasEnemyBlackTex ? window.enemyBlackTexture : null,
                metalness: 0.8, 
                roughness: 0.4 
            });
            const jointMaterial = new THREE.MeshStandardMaterial({ color: 0xdb346e, metalness: 0.6, roughness: 0.3 });
            const eyeMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0xff0000, emissiveIntensity: 1.5 });
            const mainBody = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 16), bodyMaterial);
            mainBody.scale.set(1, 0.8, 1.5); mainBody.position.y = 1.5; mainBody.castShadow = true;
            animatableGroup.add(mainBody);
            const head = new THREE.Mesh(new THREE.SphereGeometry(0.7, 32, 16), bodyMaterial);
            head.position.set(0, 0.3, -1.2); head.scale.set(1, 0.8, 1); head.castShadow = true;
            mainBody.add(head);
            const eye = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.1, 0.2, 16), eyeMaterial);
            eye.position.set(0, 0.1, -0.6); eye.rotation.x = Math.PI / 2;
            head.add(eye);
            const legs = [];
            const legPositions = [ { x: 0.7, z: -0.8 }, { x: -0.7, z: -0.8 }, { x: 0.9, z: -0.2 }, { x: -0.9, z: -0.2 }, { x: 0.9, z: 0.4 }, { x: -0.9, z: 0.4 }, { x: 0.7, z: 0.9 }, { x: -0.7, z: 0.9 }, ];
            const createLeg = (index) => {
                const legGroup = new THREE.Group();
                const jointSphere = new THREE.Mesh(new THREE.SphereGeometry(0.15), jointMaterial); legGroup.add(jointSphere);
                const femur = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.06, 1.5, 8), bodyMaterial); femur.position.y = -0.75; femur.castShadow = true; legGroup.add(femur);
                const tibiaPivot = new THREE.Group(); tibiaPivot.position.y = -1.5; legGroup.add(tibiaPivot);
                const kneeSphere = new THREE.Mesh(new THREE.SphereGeometry(0.12), jointMaterial); tibiaPivot.add(kneeSphere);
                const tibia = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.04, 1.5, 8), bodyMaterial); tibia.position.y = -0.75; tibia.castShadow = true; tibiaPivot.add(tibia);
                const isRight = index % 2 !== 0; legGroup.rotation.z = isRight ? -Math.PI / 4 : Math.PI / 4; tibiaPivot.rotation.z = isRight ? Math.PI / 2.5 : -Math.PI / 2.5; legGroup.userData = { tibiaPivot };
                return legGroup;
            }
            legPositions.forEach((pos, i) => {
                const leg = createLeg(i); leg.position.set(pos.x, 1.5, pos.z); animatableGroup.add(leg); legs.push(leg);
            });
            spiderGroup.userData.animatableGroup = animatableGroup; spiderGroup.userData.mainBody = mainBody; spiderGroup.userData.head = head; spiderGroup.userData.legs = legs;
            spiderGroup.scale.setScalar(0.4);
            return spiderGroup;
        },
        animations: {
            _animateLegs: (alien, time, speed) => { const { animatableGroup, mainBody, head, legs } = alien.userData; if (!animatableGroup || !mainBody || !head || !legs) return; const bobbingSpeed = speed * 2; const legAnimationSpeed = speed * 4; animatableGroup.position.y = Math.sin(time * bobbingSpeed) * 0.05; mainBody.rotation.z = Math.cos(time * speed) * 0.03; head.rotation.y = Math.sin(time * 0.7) * 0.5; legs.forEach((leg, i) => { const isOddGroup = i % 2 === 0; const phaseOffset = isOddGroup ? 0 : Math.PI; const swingAngle = Math.cos(time * legAnimationSpeed + phaseOffset) * 0.6; leg.rotation.y = swingAngle; const liftAngle = Math.sin(time * legAnimationSpeed + phaseOffset); const onGround = liftAngle <= 0; const baseZRot = (i % 2 !== 0 ? -1 : 1) * Math.PI / 4; const baseKneeRot = (i % 2 !== 0 ? 1 : -1) * Math.PI / 2.5; if (onGround) { leg.rotation.z = baseZRot; leg.userData.tibiaPivot.rotation.z = baseKneeRot; } else { leg.rotation.z = baseZRot + liftAngle * 0.5; leg.userData.tibiaPivot.rotation.z = baseKneeRot + liftAngle * 0.8; } }); },
            idle: (alien, time) => { GameData.enemies.ground.animations._animateLegs(alien, time, 1.5); },
            walk: (alien, time) => { GameData.enemies.ground.animations._animateLegs(alien, time, 3.0); },
            pounce: (alien) => { const { mainBody, legs } = alien.userData; mainBody.position.y = 1.3; legs.forEach((leg, i) => { leg.rotation.y = 0; leg.rotation.z = (i % 2 !== 0 ? -1 : 1) * Math.PI / 3; }); },
            leap: (alien) => { const { mainBody, legs } = alien.userData; mainBody.position.y = 1.5; legs.forEach((leg, i) => { leg.rotation.y = 0; leg.rotation.z = (i % 2 !== 0 ? -1 : 1) * Math.PI / 6; leg.userData.tibiaPivot.rotation.z = (i % 2 !== 0 ? 1 : -1) * Math.PI / 1.5; }); }
        }
    },
    flyer: {
        name: 'Flying Wasp',
        description: 'A small, flying drone that shoots energy projectiles from above.',
        levels: ['city', 'desert', 'volcanic', 'toxic'],
        spawnWeight: 0.05,
        properties: { health: 1, score: 10, spawnY: () => Math.random() * 20 + 15, sightRange: 50, attackCooldown: 3.0, projectileSpeed: 30, patrolRadius: 20 },
        model: () => {
            const g = new THREE.Group(); 
            const hasEnemyBlackTex = (typeof gameSettings !== 'undefined' && gameSettings.texturesEnabled) && window.enemyBlackTexture;
            const bM = new THREE.MeshStandardMaterial({ 
                color: hasEnemyBlackTex ? 0xffffff : 0x333322, 
                map: hasEnemyBlackTex ? window.enemyBlackTexture : null,
                roughness: 0.2, 
                metalness: 0.9 
            }); 
            const eM = new THREE.MeshStandardMaterial({ color: 0xcc00ff, emissive: 0xcc00ff, emissiveIntensity: 3 }); const b = new THREE.Mesh(new THREE.SphereGeometry(0.6, 16, 8), bM); g.add(b); const e = new THREE.Mesh(new THREE.SphereGeometry(0.25, 16, 8), eM); e.position.z = 0.5; g.add(e); const wG = new THREE.BoxGeometry(1.5, 0.1, 0.8); for(let i = 0; i < 2; i++) { const w = new THREE.Mesh(wG, bM); const s = (i % 2 === 0) ? 1 : -1; w.position.set(1.0 * s, 0, -0.2); w.rotation.z = Math.PI / 8 * s; g.add(w); } return g;
        }
    },
    cyborg: {
        name: '3D Perfect Droid',
        description: 'A heavily armored combat droid equipped with high-tech assault rifle.',
        levels: ['city', 'desert', 'volcanic', 'crystal'],
        spawnWeight: 0.125,
        properties: { health: 3, score: 25, spawnY: 0.0, sightRange: 30, attackRange: 25, attackCooldown: () => Math.random() * 2 + 3, projectileSpeed: 50 },
        model: () => {
            const rootGroup = new THREE.Group();
            const robotBodyGroup = new THREE.Group();

            if (!robotMetalTexture) {
                robotMetalTexture = createAdvancedMetalTexture();
            }

            const hasEnemyBlackTex = (typeof gameSettings !== 'undefined' && gameSettings.texturesEnabled) && window.enemyBlackTexture;

            const mainMetal = new THREE.MeshStandardMaterial({
                color: 0x82858b,
                metalness: 0.82,
                roughness: 0.38,
                map: robotMetalTexture,
                roughnessMap: robotMetalTexture,
                side: THREE.DoubleSide
            });

            // Sovellettu enemyblack.jpg mustille osille
            const darkMetal = new THREE.MeshStandardMaterial({
                color: hasEnemyBlackTex ? 0xffffff : 0x1f2125,
                map: hasEnemyBlackTex ? window.enemyBlackTexture : null,
                metalness: 0.88,
                roughness: 0.30,
                side: THREE.DoubleSide
            });

            const chromeMetal = new THREE.MeshStandardMaterial({
                color: 0xdedede,
                metalness: 0.98,
                roughness: 0.12
            });

            const gunMetal = new THREE.MeshStandardMaterial({
                color: hasEnemyBlackTex ? 0xcccccc : 0x28292d,
                map: hasEnemyBlackTex ? window.enemyBlackTexture : null,
                metalness: 0.90,
                roughness: 0.25
            });

            const eyeRedGlowMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
            const eyeCoreMat = new THREE.MeshBasicMaterial({ color: 0xff2200 }); 
            const haloGlowMat = new THREE.MeshBasicMaterial({ 
                color: 0xff0000, 
                transparent: true, 
                opacity: 0.85, 
                side: THREE.DoubleSide 
            });

            // 1. KAULANIVEL & KAULUS
            const neckSocketGroup = new THREE.Group();
            const collarRingGeo = new THREE.TorusGeometry(0.24, 0.05, 16, 32);
            collarRingGeo.rotateX(Math.PI / 2);
            const collarRing = new THREE.Mesh(collarRingGeo, mainMetal);
            collarRing.position.set(0, 0.67, 0.02);
            neckSocketGroup.add(collarRing);

            const neckBaseGeo = new THREE.CylinderGeometry(0.16, 0.18, 0.22, 20);
            const neckBase = new THREE.Mesh(neckBaseGeo, darkMetal);
            neckBase.position.set(0, 0.76, 0.02);
            neckSocketGroup.add(neckBase);

            for (let i = -1; i <= 1; i += 2) {
                const pistonGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.20, 12);
                const piston = new THREE.Mesh(pistonGeo, chromeMetal);
                piston.position.set(0.12 * i, 0.84, 0.08);
                piston.rotation.z = -0.1 * i;
                neckSocketGroup.add(piston);

                const backPiston = piston.clone();
                backPiston.position.set(0.09 * i, 0.84, -0.05);
                neckSocketGroup.add(backPiston);
            }
            robotBodyGroup.add(neckSocketGroup);

            // 2. ROBOTIN PÄÄ
            const robotHeadGroup = new THREE.Group();

            const topDomeGeo = new THREE.SphereGeometry(0.62, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.42);
            topDomeGeo.scale(0.82, 0.82, 1.0); 
            const topDome = new THREE.Mesh(topDomeGeo, mainMetal);
            topDome.position.set(0, 0.34, -0.05);
            robotHeadGroup.add(topDome);

            const leftSkullGeo = new THREE.SphereGeometry(0.62, 24, 16, Math.PI * 0.70, Math.PI * 0.60, Math.PI * 0.42, Math.PI * 0.58);
            leftSkullGeo.scale(0.82, 0.82, 1.0);
            const leftSkull = new THREE.Mesh(leftSkullGeo, mainMetal);
            leftSkull.position.set(0, 0.34, -0.05);
            robotHeadGroup.add(leftSkull);

            const rightSkullGeo = new THREE.SphereGeometry(0.62, 24, 16, Math.PI * 1.70, Math.PI * 0.60, Math.PI * 0.42, Math.PI * 0.58);
            rightSkullGeo.scale(0.82, 0.82, 1.0);
            const rightSkull = new THREE.Mesh(rightSkullGeo, mainMetal);
            rightSkull.position.set(0, 0.34, -0.05);
            robotHeadGroup.add(rightSkull);

            const innerSkullGeo = new THREE.SphereGeometry(0.56, 32, 20);
            innerSkullGeo.scale(0.78, 0.78, 0.92);
            const innerSkull = new THREE.Mesh(innerSkullGeo, darkMetal);
            innerSkull.position.set(0, 0.22, -0.12);
            robotHeadGroup.add(innerSkull);

            const innerDetailGeo = new THREE.TorusGeometry(0.38, 0.022, 12, 24);
            const innerDetail = new THREE.Mesh(innerDetailGeo, mainMetal);
            innerDetail.rotation.x = Math.PI / 3;
            innerDetail.position.set(0, 0.22, -0.16);
            robotHeadGroup.add(innerDetail);

            const foreheadSeamGeo = new THREE.BoxGeometry(0.015, 0.3, 0.5);
            const foreheadSeam = new THREE.Mesh(foreheadSeamGeo, darkMetal);
            foreheadSeam.position.set(0, 0.44, 0.1);
            robotHeadGroup.add(foreheadSeam);

            for (let side = -1; side <= 1; side += 2) {
                const angryBrowGeo = new THREE.BoxGeometry(0.42, 0.13, 0.42);
                const angryBrow = new THREE.Mesh(angryBrowGeo, mainMetal);
                angryBrow.position.set(0.20 * side, 0.41, 0.22);
                angryBrow.rotation.x = 0.32;
                angryBrow.rotation.z = +0.26 * side;
                angryBrow.rotation.y = -0.12 * side;
                robotHeadGroup.add(angryBrow);
            }

            const browCenterGeo = new THREE.BoxGeometry(0.22, 0.20, 0.40);
            const browCenter = new THREE.Mesh(browCenterGeo, mainMetal);
            browCenter.position.set(0, 0.39, 0.32);
            browCenter.rotation.x = 0.42;
            robotHeadGroup.add(browCenter);

            const eyeGroup = new THREE.Group();
            for (let side = -1; side <= 1; side += 2) {
                const sideEyeGroup = new THREE.Group();

                const socketBoxGeo = new THREE.BoxGeometry(0.24, 0.15, 0.2);
                const socketBox = new THREE.Mesh(socketBoxGeo, darkMetal);
                sideEyeGroup.add(socketBox);

                const frameGeo = new THREE.BoxGeometry(0.25, 0.16, 0.04);
                const frame = new THREE.Mesh(frameGeo, mainMetal);
                frame.position.set(0, 0, 0.08);
                sideEyeGroup.add(frame);

                const eyelidGeo = new THREE.BoxGeometry(0.28, 0.06, 0.12);
                const eyelid = new THREE.Mesh(eyelidGeo, mainMetal);
                eyelid.position.set(0, 0.06, 0.10);
                eyelid.rotation.z = +0.24 * side;
                eyelid.rotation.x = 0.15;
                sideEyeGroup.add(eyelid);

                const bezelGeo = new THREE.TorusGeometry(0.058, 0.016, 16, 24);
                const bezel = new THREE.Mesh(bezelGeo, darkMetal);
                bezel.position.set(0, 0, 0.095);
                sideEyeGroup.add(bezel);

                const haloGeo = new THREE.RingGeometry(0.015, 0.095, 20);
                const halo = new THREE.Mesh(haloGeo, haloGlowMat);
                halo.position.set(0, 0, 0.092);
                sideEyeGroup.add(halo);

                const lensGeo = new THREE.SphereGeometry(0.052, 20, 20);
                const lens = new THREE.Mesh(lensGeo, eyeRedGlowMat);
                lens.position.set(0, -0.01, 0.095);
                lens.scale.set(1.1, 0.7, 0.45);
                sideEyeGroup.add(lens);

                const coreGeo = new THREE.SphereGeometry(0.024, 16, 16);
                const core = new THREE.Mesh(coreGeo, eyeCoreMat);
                core.position.set(0, -0.01, 0.11);
                sideEyeGroup.add(core);

                sideEyeGroup.position.set(0.22 * side, 0.28, 0.28);
                sideEyeGroup.rotation.y = 0.14 * side;
                sideEyeGroup.rotation.x = 0.08;
                sideEyeGroup.rotation.z = +0.16 * side;

                eyeGroup.add(sideEyeGroup);
            }
            robotHeadGroup.add(eyeGroup);

            const cheekGroup = new THREE.Group();
            for (let side = -1; side <= 1; side += 2) {
                const cheekGeo = new THREE.BoxGeometry(0.22, 0.09, 0.20);
                const cheek = new THREE.Mesh(cheekGeo, mainMetal);
                cheek.position.set(0.25 * side, 0.11, 0.32);
                cheek.rotation.y = 0.32 * side;
                cheek.rotation.x = -0.28;
                cheek.rotation.z = -0.18 * side;
                cheekGroup.add(cheek);

                const cheekRidgeGeo = new THREE.BoxGeometry(0.18, 0.04, 0.18);
                const cheekRidge = new THREE.Mesh(cheekRidgeGeo, darkMetal);
                cheekRidge.position.set(0.26 * side, 0.08, 0.35);
                cheekRidge.rotation.y = 0.32 * side;
                cheekRidge.rotation.x = -0.28;
                cheekRidge.rotation.z = -0.18 * side;
                cheekGroup.add(cheekRidge);
            }
            robotHeadGroup.add(cheekGroup);

            const noseGeo = new THREE.CylinderGeometry(0.06, 0.22, 0.48, 4);
            const nose = new THREE.Mesh(noseGeo, mainMetal);
            nose.position.set(0, 0.12, 0.42);
            nose.rotation.x = 0.24;
            nose.scale.set(1.2, 1, 0.72);
            robotHeadGroup.add(nose);

            function createExactEar(sideMultiplier) {
                const earGroup = new THREE.Group();
                const outerRimGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.06, 32);
                outerRimGeo.rotateZ(Math.PI / 2);
                const outerRim = new THREE.Mesh(outerRimGeo, mainMetal);
                earGroup.add(outerRim);

                const innerRingGeo = new THREE.CylinderGeometry(0.15, 0.15, 0.08, 32);
                innerRingGeo.rotateZ(Math.PI / 2);
                const innerRing = new THREE.Mesh(innerRingGeo, darkMetal);
                earGroup.add(innerRing);

                const centerCapGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.1, 32);
                centerCapGeo.rotateZ(Math.PI / 2);
                const centerCap = new THREE.Mesh(centerCapGeo, mainMetal);
                earGroup.add(centerCap);

                const diagBarGeo = new THREE.BoxGeometry(0.04, 0.11, 0.18);
                const diagBar = new THREE.Mesh(diagBarGeo, darkMetal);
                diagBar.rotation.x = Math.PI / 4;
                diagBar.position.x = 0.05 * sideMultiplier;
                earGroup.add(diagBar);

                earGroup.position.set(0.50 * sideMultiplier, 0.28, -0.02);
                return earGroup;
            }
            robotHeadGroup.add(createExactEar(-1));
            robotHeadGroup.add(createExactEar(1));

            const jawGroup = new THREE.Group();
            const upperBridgeGeo = new THREE.BoxGeometry(0.22, 0.12, 0.16);
            const upperBridge = new THREE.Mesh(upperBridgeGeo, mainMetal);
            upperBridge.position.set(0, -0.05, 0.42);
            jawGroup.add(upperBridge);

            const mainSnoutGeo = new THREE.BoxGeometry(0.30, 0.24, 0.28);
            const mainSnout = new THREE.Mesh(mainSnoutGeo, mainMetal);
            mainSnout.position.set(0, -0.17, 0.39);
            jawGroup.add(mainSnout);

            const ventSocketGeo = new THREE.BoxGeometry(0.24, 0.16, 0.06);
            const ventSocket = new THREE.Mesh(ventSocketGeo, darkMetal);
            ventSocket.position.set(0, -0.17, 0.52);
            jawGroup.add(ventSocket);

            const frameTopGeo = new THREE.BoxGeometry(0.26, 0.025, 0.04);
            const frameTop = new THREE.Mesh(frameTopGeo, mainMetal);
            frameTop.position.set(0, -0.085, 0.54);
            jawGroup.add(frameTop);

            const frameBottom = frameTop.clone();
            frameBottom.position.y = -0.255;
            jawGroup.add(frameBottom);

            const ventBarPositions = [-0.075, -0.025, 0.025, 0.075];
            ventBarPositions.forEach(xPos => {
                const ventBarGeo = new THREE.BoxGeometry(0.02, 0.14, 0.04);
                const ventBar = new THREE.Mesh(ventBarGeo, mainMetal);
                ventBar.position.set(xPos, -0.17, 0.54);
                jawGroup.add(ventBar);
            });

            const bottomChinGeo = new THREE.BoxGeometry(0.24, 0.08, 0.24);
            const bottomChin = new THREE.Mesh(bottomChinGeo, darkMetal);
            bottomChin.position.set(0, -0.29, 0.39);
            jawGroup.add(bottomChin);

            const chinTipGeo = new THREE.CylinderGeometry(0.11, 0.08, 0.06, 4);
            const chinTip = new THREE.Mesh(chinTipGeo, mainMetal);
            chinTip.rotation.y = Math.PI / 4;
            chinTip.position.set(0, -0.32, 0.40);
            chinTip.scale.set(1.1, 1, 0.9);
            jawGroup.add(chinTip);

            const throatAnchorGeo = new THREE.BoxGeometry(0.18, 0.12, 0.22);
            const throatAnchor = new THREE.Mesh(throatAnchorGeo, darkMetal);
            throatAnchor.position.set(0, -0.28, 0.24);
            jawGroup.add(throatAnchor);

            function createSeamlessJawStrut(side) {
                const strutGroup = new THREE.Group();

                const upperBarGeo = new THREE.BoxGeometry(0.07, 0.32, 0.10);
                const upperBar = new THREE.Mesh(upperBarGeo, mainMetal);
                upperBar.position.set(0.46 * side, 0.12, 0.06);
                upperBar.rotation.z = -0.22 * side;
                upperBar.rotation.x = -0.35;
                strutGroup.add(upperBar);

                const lowerBarGeo = new THREE.BoxGeometry(0.08, 0.32, 0.12);
                const lowerBar = new THREE.Mesh(lowerBarGeo, mainMetal);
                lowerBar.position.set(0.31 * side, -0.13, 0.28);
                lowerBar.rotation.z = -0.58 * side;
                lowerBar.rotation.y = 0.45 * side;
                lowerBar.rotation.x = 0.15;
                strutGroup.add(lowerBar);

                const sideBracketGeo = new THREE.BoxGeometry(0.06, 0.20, 0.18);
                const sideBracket = new THREE.Mesh(sideBracketGeo, darkMetal);
                sideBracket.position.set(0.16 * side, -0.17, 0.38);
                strutGroup.add(sideBracket);

                const cheekConnectorGeo = new THREE.BoxGeometry(0.05, 0.18, 0.08);
                const cheekConnector = new THREE.Mesh(cheekConnectorGeo, mainMetal);
                cheekConnector.position.set(0.28 * side, -0.02, 0.30);
                cheekConnector.rotation.z = -0.3 * side;
                cheekConnector.rotation.x = -0.1;
                strutGroup.add(cheekConnector);

                const bolt1Geo = new THREE.CylinderGeometry(0.03, 0.03, 0.12, 12);
                bolt1Geo.rotateZ(Math.PI / 2);
                const bolt1 = new THREE.Mesh(bolt1Geo, chromeMetal);
                bolt1.position.set(0.18 * side, -0.12, 0.41);
                strutGroup.add(bolt1);

                const bolt2 = bolt1.clone();
                bolt2.position.set(0.18 * side, -0.21, 0.38);
                strutGroup.add(bolt2);

                return strutGroup;
            }

            jawGroup.add(createSeamlessJawStrut(-1));
            jawGroup.add(createSeamlessJawStrut(1));
            robotHeadGroup.add(jawGroup);

            const neckGroup = new THREE.Group();
            const innerThroatGeo = new THREE.CylinderGeometry(0.15, 0.17, 0.6, 16);
            const innerThroat = new THREE.Mesh(innerThroatGeo, darkMetal);
            innerThroat.position.set(0, -0.15, 0.06);
            neckGroup.add(innerThroat);

            for (let i = 0; i < 8; i++) {
                const ringGeo = new THREE.TorusGeometry(0.17, 0.032, 12, 24);
                const ring = new THREE.Mesh(ringGeo, darkMetal);
                ring.rotation.x = Math.PI / 2;
                ring.position.y = -0.16 - (i * 0.06);
                ring.position.z = -0.02;
                neckGroup.add(ring);
            }
            robotHeadGroup.add(neckGroup);

            robotHeadGroup.scale.set(0.38, 0.38, 0.38);
            robotHeadGroup.position.set(0, 0.90, 0.02);
            robotBodyGroup.add(robotHeadGroup);

            // 3. RINTOJEN PÄÄ-HAARNISKA
            const chestGroup = new THREE.Group();
            const chestMainGeo = new THREE.BoxGeometry(0.72, 0.58, 0.42);
            const chestMain = new THREE.Mesh(chestMainGeo, mainMetal);
            chestMain.position.set(0, 0.45, 0.02);
            chestGroup.add(chestMain);

            const chestSeamGeo = new THREE.BoxGeometry(0.02, 0.56, 0.44);
            const chestSeam = new THREE.Mesh(chestSeamGeo, darkMetal);
            chestSeam.position.set(0, 0.45, 0.02);
            chestGroup.add(chestSeam);

            const chestPlateFrontGeo = new THREE.BoxGeometry(0.32, 0.38, 0.06);
            const chestPlateFront = new THREE.Mesh(chestPlateFrontGeo, mainMetal);
            chestPlateFront.position.set(0, 0.46, 0.24);
            chestGroup.add(chestPlateFront);

            const chestLatchGeo = new THREE.BoxGeometry(0.12, 0.14, 0.04);
            const chestLatch = new THREE.Mesh(chestLatchGeo, darkMetal);
            chestLatch.position.set(0, 0.52, 0.28);
            chestGroup.add(chestLatch);

            const backPackGeo = new THREE.BoxGeometry(0.52, 0.48, 0.22);
            const backPack = new THREE.Mesh(backPackGeo, mainMetal);
            backPack.position.set(0, 0.48, -0.20);
            chestGroup.add(backPack);

            robotBodyGroup.add(chestGroup);

            // 4. VATSAPALAT & SELKÄRANKA
            const abGroup = new THREE.Group();
            const spineCoreGeo = new THREE.CylinderGeometry(0.12, 0.14, 0.48, 16);
            const spineCore = new THREE.Mesh(spineCoreGeo, darkMetal);
            spineCore.position.set(0, 0.02, -0.02);
            abGroup.add(spineCore);

            const abHeights = [0.12, 0.0, -0.11];
            const abWidths = [0.46, 0.42, 0.38];
            abHeights.forEach((yPos, idx) => {
                const abPlateGeo = new THREE.BoxGeometry(abWidths[idx], 0.09, 0.32);
                const abPlate = new THREE.Mesh(abPlateGeo, mainMetal);
                abPlate.position.set(0, yPos, 0.05);
                abGroup.add(abPlate);

                const abGrooveGeo = new THREE.BoxGeometry(abWidths[idx] - 0.08, 0.03, 0.04);
                const abGroove = new THREE.Mesh(abGrooveGeo, darkMetal);
                abGroove.position.set(0, yPos, 0.21);
                abGroup.add(abGroove);
            });

            for (let side = -1; side <= 1; side += 2) {
                const waistPistonGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.42, 12);
                const waistPiston = new THREE.Mesh(waistPistonGeo, chromeMetal);
                waistPiston.position.set(0.22 * side, 0.02, 0.08);
                waistPiston.rotation.z = -0.15 * side;
                abGroup.add(waistPiston);
            }
            robotBodyGroup.add(abGroup);

            // 5. LANTIO JA LONKKANIVELET
            const pelvisGroup = new THREE.Group();
            const pelvisMainGeo = new THREE.CylinderGeometry(0.38, 0.28, 0.28, 6);
            const pelvisMain = new THREE.Mesh(pelvisMainGeo, mainMetal);
            pelvisMain.position.set(0, -0.32, 0.02);
            pelvisMain.scale.set(1.1, 1, 0.9);
            pelvisGroup.add(pelvisMain);

            const groinBlockGeo = new THREE.BoxGeometry(0.18, 0.22, 0.24);
            const groinBlock = new THREE.Mesh(groinBlockGeo, darkMetal);
            groinBlock.position.set(0, -0.36, 0.10);
            pelvisGroup.add(groinBlock);

            for (let side = -1; side <= 1; side += 2) {
                const hipDiscGeo = new THREE.CylinderGeometry(0.17, 0.17, 0.12, 24);
                hipDiscGeo.rotateZ(Math.PI / 2);
                const hipDisc = new THREE.Mesh(hipDiscGeo, darkMetal);
                hipDisc.position.set(0.32 * side, -0.32, 0.02);
                pelvisGroup.add(hipDisc);

                const hipCapGeo = new THREE.CylinderGeometry(0.11, 0.11, 0.14, 20);
                hipCapGeo.rotateZ(Math.PI / 2);
                const hipCap = new THREE.Mesh(hipCapGeo, mainMetal);
                hipCap.position.set(0.32 * side, -0.32, 0.02);
                pelvisGroup.add(hipCap);
            }
            robotBodyGroup.add(pelvisGroup);

            // 6. NIVELÖIDYT JALAT
            const legGroups = {};
            const lowerLegGroups = {};

            function createHierarchicalLeg(side) {
                const legHipGroup = new THREE.Group();
                legHipGroup.position.set(0.32 * side, -0.32, 0.02);

                const thighGeo = new THREE.BoxGeometry(0.24, 0.65, 0.26);
                const thigh = new THREE.Mesh(thighGeo, mainMetal);
                thigh.position.set(0, -0.40, 0);
                legHipGroup.add(thigh);

                const thighDetailGeo = new THREE.BoxGeometry(0.16, 0.45, 0.06);
                const thighDetail = new THREE.Mesh(thighDetailGeo, darkMetal);
                thighDetail.position.set(0, -0.40, 0.12);
                legHipGroup.add(thighDetail);

                const kneeDiscGeo = new THREE.CylinderGeometry(0.13, 0.13, 0.14, 24);
                kneeDiscGeo.rotateZ(Math.PI / 2);
                const kneeDisc = new THREE.Mesh(kneeDiscGeo, darkMetal);
                kneeDisc.position.set(0, -0.78, 0);
                legHipGroup.add(kneeDisc);

                const kneeCapGeo = new THREE.BoxGeometry(0.16, 0.18, 0.08);
                const kneeCap = new THREE.Mesh(kneeCapGeo, mainMetal);
                kneeCap.position.set(0, -0.76, 0.10);
                legHipGroup.add(kneeCap);

                const lowerLegGroup = new THREE.Group();
                lowerLegGroup.position.set(0, -0.78, 0);

                const shinMainGeo = new THREE.BoxGeometry(0.20, 0.66, 0.20);
                const shinMain = new THREE.Mesh(shinMainGeo, mainMetal);
                shinMain.position.set(0, -0.40, -0.02);
                lowerLegGroup.add(shinMain);

                const shinPlateFrontGeo = new THREE.BoxGeometry(0.22, 0.62, 0.06);
                const shinPlateFront = new THREE.Mesh(shinPlateFrontGeo, mainMetal);
                shinPlateFront.position.set(0, -0.38, 0.09);
                lowerLegGroup.add(shinPlateFront);

                const shinSeamGeo = new THREE.BoxGeometry(0.018, 0.58, 0.07);
                const shinSeam = new THREE.Mesh(shinSeamGeo, darkMetal);
                shinSeam.position.set(0, -0.38, 0.095);
                lowerLegGroup.add(shinSeam);

                const calfEllipsoidGeo = new THREE.SphereGeometry(0.18, 24, 20);
                calfEllipsoidGeo.scale(0.85, 1.35, 0.80);
                const calfRearPod = new THREE.Mesh(calfEllipsoidGeo, darkMetal);
                calfRearPod.position.set(0, -0.32, -0.07);
                lowerLegGroup.add(calfRearPod);

                const achillesOuterGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.24, 12);
                const achillesOuter = new THREE.Mesh(achillesOuterGeo, darkMetal);
                achillesOuter.position.set(0, -0.52, -0.09);
                achillesOuter.rotation.x = -0.10;
                lowerLegGroup.add(achillesOuter);

                const achillesInnerGeo = new THREE.CylinderGeometry(0.013, 0.013, 0.28, 12);
                const achillesPiston = new THREE.Mesh(achillesInnerGeo, chromeMetal);
                achillesPiston.position.set(0, -0.68, -0.07);
                achillesPiston.rotation.x = -0.10;
                lowerLegGroup.add(achillesPiston);

                const ankleDiscGeo = new THREE.CylinderGeometry(0.11, 0.11, 0.14, 24);
                ankleDiscGeo.rotateZ(Math.PI / 2);
                const ankleDisc = new THREE.Mesh(ankleDiscGeo, darkMetal);
                ankleDisc.position.set(0, -0.76, -0.02);
                lowerLegGroup.add(ankleDisc);

                const ankleCapGeo = new THREE.CylinderGeometry(0.07, 0.07, 0.16, 20);
                ankleCapGeo.rotateZ(Math.PI / 2);
                const ankleCap = new THREE.Mesh(ankleCapGeo, mainMetal);
                ankleCap.position.set(0, -0.76, -0.02);
                lowerLegGroup.add(ankleCap);

                const footSoleGeo = new THREE.BoxGeometry(0.23, 0.04, 0.44);
                const footSole = new THREE.Mesh(footSoleGeo, darkMetal);
                footSole.position.set(0, -0.90, 0.06);
                lowerLegGroup.add(footSole);

                const footHeelGeo = new THREE.BoxGeometry(0.20, 0.12, 0.16);
                const footHeel = new THREE.Mesh(footHeelGeo, mainMetal);
                footHeel.position.set(0, -0.83, -0.08);
                lowerLegGroup.add(footHeel);

                const footInstepGeo = new THREE.BoxGeometry(0.21, 0.10, 0.22);
                const footInstep = new THREE.Mesh(footInstepGeo, mainMetal);
                footInstep.position.set(0, -0.81, 0.06);
                footInstep.rotation.x = 0.25;
                lowerLegGroup.add(footInstep);

                const footToeCapGeo = new THREE.BoxGeometry(0.21, 0.06, 0.18);
                const footToeCap = new THREE.Mesh(footToeCapGeo, mainMetal);
                footToeCap.position.set(0, -0.86, 0.19);
                lowerLegGroup.add(footToeCap);

                const toeSeamGeo = new THREE.BoxGeometry(0.016, 0.07, 0.19);
                const toeSeam = new THREE.Mesh(toeSeamGeo, darkMetal);
                toeSeam.position.set(0, -0.86, 0.19);
                lowerLegGroup.add(toeSeam);

                legHipGroup.add(lowerLegGroup);

                const key = (side === -1) ? 'left' : 'right';
                legGroups[key] = legHipGroup;
                lowerLegGroups[key] = lowerLegGroup;

                return legHipGroup;
            }

            robotBodyGroup.add(createHierarchicalLeg(-1));
            robotBodyGroup.add(createHierarchicalLeg(1));

            // 7. NIVELÖIDYT KÄDET
            const armGroups = {};

            function createHierarchicalArm(side) {
                const armShoulderGroup = new THREE.Group();
                armShoulderGroup.position.set(0.52 * side, 0.52, 0.02);

                const pauldronGeo = new THREE.SphereGeometry(0.19, 20, 20, 0, Math.PI * 2, 0, Math.PI * 0.5);
                pauldronGeo.scale(0.95, 0.65, 0.80);
                const pauldron = new THREE.Mesh(pauldronGeo, mainMetal);
                pauldron.position.set(-0.03 * side, 0.04, 0);
                pauldron.rotation.z = -0.785 * side;
                pauldron.rotation.x = 0.15;
                armShoulderGroup.add(pauldron);

                const shoulderBallGeo = new THREE.SphereGeometry(0.15, 20, 20);
                const shoulderBall = new THREE.Mesh(shoulderBallGeo, darkMetal);
                shoulderBall.position.set(-0.04 * side, 0, 0);
                armShoulderGroup.add(shoulderBall);

                const upperArmGeo = new THREE.BoxGeometry(0.16, 0.42, 0.18);
                const upperArm = new THREE.Mesh(upperArmGeo, mainMetal);
                upperArm.position.set(0, -0.30, 0);
                armShoulderGroup.add(upperArm);

                const elbowGeo = new THREE.CylinderGeometry(0.10, 0.10, 0.12, 20);
                elbowGeo.rotateZ(Math.PI / 2);
                const elbow = new THREE.Mesh(elbowGeo, darkMetal);
                elbow.position.set(0, -0.56, 0);
                armShoulderGroup.add(elbow);

                const forearmGeo = new THREE.BoxGeometry(0.16, 0.46, 0.18);
                const forearm = new THREE.Mesh(forearmGeo, mainMetal);
                forearm.position.set(0, -0.86, 0.02);
                armShoulderGroup.add(forearm);

                const wristGeo = new THREE.CylinderGeometry(0.07, 0.07, 0.10, 16);
                const wrist = new THREE.Mesh(wristGeo, darkMetal);
                wrist.position.set(0, -1.12, 0.02);
                armShoulderGroup.add(wrist);

                const handGeo = new THREE.BoxGeometry(0.12, 0.14, 0.12);
                const hand = new THREE.Mesh(handGeo, mainMetal);
                hand.position.set(0, -1.24, 0.02);
                armShoulderGroup.add(hand);

                const key = (side === -1) ? 'left' : 'right';
                armGroups[key] = armShoulderGroup;

                return armShoulderGroup;
            }

            robotBodyGroup.add(createHierarchicalArm(-1));
            robotBodyGroup.add(createHierarchicalArm(1));

            // 8. KONEKIVÄÄRI
            const rifleGroup = new THREE.Group();

            const rifleBodyGeo = new THREE.BoxGeometry(0.08, 0.14, 0.52);
            const rifleBody = new THREE.Mesh(rifleBodyGeo, gunMetal);
            rifleGroup.add(rifleBody);

            const barrelGeo = new THREE.CylinderGeometry(0.022, 0.022, 0.42, 16);
            barrelGeo.rotateX(Math.PI / 2);
            const barrel = new THREE.Mesh(barrelGeo, darkMetal);
            barrel.position.set(0, 0.02, 0.42);
            rifleGroup.add(barrel);

            const suppressorGeo = new THREE.CylinderGeometry(0.032, 0.032, 0.14, 16);
            suppressorGeo.rotateX(Math.PI / 2);
            const suppressor = new THREE.Mesh(suppressorGeo, gunMetal);
            suppressor.position.set(0, 0.02, 0.68);
            rifleGroup.add(suppressor);

            rifleGroup.position.set(0, -1.20, 0.10);
            rifleGroup.rotation.x = Math.PI / 2;
            rifleGroup.rotation.y = -0.10;
            armGroups['left'].add(rifleGroup);

            // Tasaa jalkapohjat tasolle Y = 0 (offset +2.0)
            robotBodyGroup.position.y = 2.0;
            rootGroup.add(robotBodyGroup);

            // Skaalataan robotti täsmäämään aiemman Cyborgin pituuteen
            rootGroup.scale.set(0.85, 0.85, 0.85);

            // HAJOAMISJÄRJESTELMÄN OSA-ALUEET (Shatter system)
            const debrisParts = [
                { mesh: robotHeadGroup },
                { mesh: chestGroup },
                { mesh: neckSocketGroup },
                { mesh: abGroup },
                { mesh: pelvisGroup },
                { mesh: legGroups['left'] },
                { mesh: legGroups['right'] },
                { mesh: armGroups['left'] },
                { mesh: armGroups['right'] },
                { mesh: rifleGroup }
            ];

            // Rekisteröidään ohjausrakenteet animaatioille
            rootGroup.userData = {
                robotBodyGroup,
                robotHeadGroup,
                legGroups,
                lowerLegGroups,
                armGroups,
                rifleGroup,
                rifleBarrel: suppressor,
                debrisParts: debrisParts,
                isShattered: false
            };

            rootGroup.traverse(child => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });

            return rootGroup;
        },
        animations: {
            idle: (alien) => {
                const { robotBodyGroup, legGroups, lowerLegGroups, armGroups, rifleGroup } = alien.userData;
                if (!robotBodyGroup || alien.userData.isShattered) return;

                const lerpSpeed = 0.15;
                legGroups['left'].rotation.x += (0 - legGroups['left'].rotation.x) * lerpSpeed;
                legGroups['right'].rotation.x += (0 - legGroups['right'].rotation.x) * lerpSpeed;
                lowerLegGroups['left'].rotation.x += (0 - lowerLegGroups['left'].rotation.x) * lerpSpeed;
                lowerLegGroups['right'].rotation.x += (0 - lowerLegGroups['right'].rotation.x) * lerpSpeed;

                armGroups['left'].rotation.x += (0 - armGroups['left'].rotation.x) * lerpSpeed;
                armGroups['left'].rotation.z += (0 - armGroups['left'].rotation.z) * lerpSpeed;
                armGroups['right'].rotation.x += (0 - armGroups['right'].rotation.x) * lerpSpeed;
                armGroups['right'].rotation.z += (0 - armGroups['right'].rotation.z) * lerpSpeed;

                rifleGroup.rotation.x += (Math.PI / 2 - rifleGroup.rotation.x) * lerpSpeed;
                rifleGroup.rotation.y += (-0.10 - rifleGroup.rotation.y) * lerpSpeed;
                rifleGroup.position.y += (-1.20 - rifleGroup.position.y) * lerpSpeed;

                robotBodyGroup.position.y += (2.0 - robotBodyGroup.position.y) * lerpSpeed;
                robotBodyGroup.rotation.x += (0 - robotBodyGroup.rotation.x) * lerpSpeed;
                robotBodyGroup.rotation.y += (0 - robotBodyGroup.rotation.y) * lerpSpeed;
                robotBodyGroup.rotation.z += (0 - robotBodyGroup.rotation.z) * lerpSpeed;
            },
            walk: (alien, time) => {
                const { robotBodyGroup, legGroups, lowerLegGroups, armGroups, rifleGroup } = alien.userData;
                if (!robotBodyGroup || alien.userData.isShattered) return;

                // Nopeutettu kävelyanimaatio (time * 7.5)
                const walkTime = time * 7.5;
                const stride = Math.sin(walkTime) * 0.45;
                const counterStride = -stride;

                legGroups['left'].rotation.x = stride;
                legGroups['right'].rotation.x = counterStride;

                const leftKneeBend = Math.max(0, Math.sin(walkTime + Math.PI * 0.25) * 0.55);
                const rightKneeBend = Math.max(0, Math.sin(walkTime + Math.PI * 1.25) * 0.55);

                lowerLegGroups['left'].rotation.x = leftKneeBend;
                lowerLegGroups['right'].rotation.x = rightKneeBend;

                armGroups['left'].rotation.x = counterStride * 0.45;
                armGroups['right'].rotation.x = stride * 0.60;

                rifleGroup.rotation.x = Math.PI / 2;
                rifleGroup.position.y = -1.20;

                robotBodyGroup.position.y = 2.0 + Math.abs(Math.sin(walkTime * 2)) * 0.03;
                robotBodyGroup.rotation.y = Math.sin(walkTime) * 0.06;
                robotBodyGroup.rotation.z = Math.cos(walkTime) * 0.03;
            },
            shoot: (alien, progress) => {
                const { robotBodyGroup, legGroups, lowerLegGroups, armGroups, rifleGroup } = alien.userData;
                if (!robotBodyGroup || alien.userData.isShattered) return false;

                const lerpSpeed = 0.25;
                const targetArmAngle = -Math.PI / 2.2;
                const targetRifleAngle = Math.PI / 2;

                armGroups['left'].rotation.x += (targetArmAngle - armGroups['left'].rotation.x) * lerpSpeed;
                armGroups['right'].rotation.x += (-0.35 - armGroups['right'].rotation.x) * lerpSpeed;
                
                rifleGroup.rotation.x += (targetRifleAngle - rifleGroup.rotation.x) * lerpSpeed;

                legGroups['left'].rotation.x += (0.10 - legGroups['left'].rotation.x) * lerpSpeed;
                legGroups['right'].rotation.x += (-0.15 - legGroups['right'].rotation.x) * lerpSpeed;
                lowerLegGroups['left'].rotation.x += (0.15 - lowerLegGroups['left'].rotation.x) * lerpSpeed;
                lowerLegGroups['right'].rotation.x += (0.20 - lowerLegGroups['right'].rotation.x) * lerpSpeed;

                if (progress > 0.3 && progress < 0.4 && !alien.userData.hasFiredInThisShot) {
                    rifleGroup.position.y = -1.15; // Rekyyli
                    alien.userData.hasFiredInThisShot = true;
                    return true;
                } else if (progress < 0.3 || progress > 0.4) {
                    rifleGroup.position.y = -1.20;
                }

                return false;
            },
            death: (alien, progress, delta) => {
                const { robotBodyGroup, debrisParts } = alien.userData;
                if (!robotBodyGroup) return;

                if (progress < 0.35) {
                    // Robotti tuupertuu ensin taaksepäin ennen räjähdystä / hajoamista
                    const p = progress / 0.35;
                    const easeFall = p * p;
                    robotBodyGroup.position.y = THREE.MathUtils.lerp(2.0, 0.5, easeFall);
                    robotBodyGroup.rotation.x = -easeFall * (Math.PI / 2 + 0.1);
                    robotBodyGroup.rotation.z = easeFall * 0.2;
                } else {
                    // Robotti hajoaa osiin + RUNSAS PUNAINEN PALLOPARTIKKELIRÄJÄHDYS
                    if (!alien.userData.isShattered) {
                        alien.userData.isShattered = true;

                        // Laukaistaan runsaat punaiset pallopartikkelit (Alien debris explosion)
                        if (typeof createAlienDebris === 'function') {
                            const spawnCenter = alien.position.clone().add(new THREE.Vector3(0, 1.2, 0));
                            for (let k = 0; k < 4; k++) {
                                createAlienDebris(spawnCenter, 0xff0000);
                            }
                        }

                        if (debrisParts) {
                            debrisParts.forEach(part => {
                                const worldPos = new THREE.Vector3();
                                const worldQuat = new THREE.Quaternion();

                                part.mesh.getWorldPosition(worldPos);
                                part.mesh.getWorldQuaternion(worldQuat);

                                if (typeof scene !== 'undefined') {
                                    scene.add(part.mesh);
                                }
                                part.mesh.position.copy(worldPos);
                                part.mesh.quaternion.copy(worldQuat);

                                part.vel = new THREE.Vector3(
                                    (Math.random() - 0.5) * 5.0,
                                    Math.random() * 3.0 + 1.5,
                                    (Math.random() - 0.5) * 5.0
                                );
                                part.rotVel = new THREE.Vector3(
                                    (Math.random() - 0.5) * 12.0,
                                    (Math.random() - 0.5) * 12.0,
                                    (Math.random() - 0.5) * 12.0
                                );
                            });
                        }
                        // Piilotetaan pääryhmä
                        robotBodyGroup.visible = false;
                    }

                    // Irto-osien fysiikkapäivitys (painovoima + törmäys maahan)
                    if (debrisParts && delta) {
                        const floorY = 0.05;
                        debrisParts.forEach(part => {
                            if (!part.vel) return;
                            part.vel.y -= 20.0 * delta; // Painovoima
                            part.mesh.position.addScaledVector(part.vel, delta);

                            part.mesh.rotation.x += part.rotVel.x * delta;
                            part.mesh.rotation.y += part.rotVel.y * delta;
                            part.mesh.rotation.z += part.rotVel.z * delta;

                            if (part.mesh.position.y <= floorY) {
                                part.mesh.position.y = floorY;
                                part.vel.y = -part.vel.y * 0.25; // Bounssi
                                part.vel.x *= 0.6; // Kitka
                                part.vel.z *= 0.6;
                                part.rotVel.multiplyScalar(0.6);
                            }
                        });
                    }
                }
            }
        }
    },
    stingray: {
        name: 'Skyray Bomber',
        description: 'A massive, high-altitude bomber that drops powerful explosives.',
        levels: ['desert'],
        spawnWeight: 0.1,
        properties: { health: 15, score: 75, spawnY: () => Math.random() * 20 + 80, sightRange: 300, attackCooldown: 5.0, speed: 15, bombDropRate: 0.5 },
        model: () => {
            const g = new THREE.Group(); 
            const hasEnemyBlackTex = (typeof gameSettings !== 'undefined' && gameSettings.texturesEnabled) && window.enemyBlackTexture;
            const bodyMat = new THREE.MeshStandardMaterial({
                color: hasEnemyBlackTex ? 0xffffff : 0x5d5d7a, 
                map: hasEnemyBlackTex ? window.enemyBlackTexture : null,
                metalness: 0.9, 
                roughness: 0.3
            }); 
            const shape = new THREE.Shape(); shape.moveTo(0,-8); shape.quadraticCurveTo(8, -4, 10, 0); shape.quadraticCurveTo(8, 4, 0, 8); shape.quadraticCurveTo(-8, 4, -10, 0); shape.quadraticCurveTo(-8, -4, 0, -8); const extrudeSettings = { depth: 0.5, bevelEnabled: true, bevelThickness: 0.5, bevelSize: 0.5, bevelSegments: 2 }; const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings); const body = new THREE.Mesh(geo, bodyMat); body.rotation.x = Math.PI/2; g.add(body); const eyeMat = new THREE.MeshStandardMaterial({color:0xff2200, emissive:0xff2200}); const eye = new THREE.Mesh(new THREE.SphereGeometry(0.8), eyeMat); eye.position.set(0, 0.5, 6); g.add(eye); g.scale.set(1.5,1.5,1.5); return g;
        }
    },
    tentacle: {
        name: 'Ice Tentacle',
        description: 'A hidden predator that emerges from the ground to strike unwary travelers.',
        levels: ['ice'],
        spawnWeight: 0.80,
        initialSpawn: false,
        properties: { 
            health: 8, 
            score: 50, 
            spawnY: -20, 
            attackRange: 25, 
            attackDamage: 30, 
            emergeSpeed: 10, 
            hitCooldown: 1.5, 
            attackImpulse: 15,
            attackCooldown: 5.0 
        },
        model: () => {
            const g = new THREE.Group();
            const hasEnemyBlackTex = (typeof gameSettings !== 'undefined' && gameSettings.texturesEnabled) && window.enemyBlackTexture;
            const mat = new THREE.MeshStandardMaterial({ 
                color: hasEnemyBlackTex ? 0xffffff : 0x111111, 
                map: hasEnemyBlackTex ? window.enemyBlackTexture : null,
                roughness: 0.2, 
                metalness: 0.8 
            });
            const segmentCount = 10;
            const segmentLength = 2.0;
            const segmentMeshes = [];
            let parent = g;

            for (let i = 0; i < segmentCount; i++) {
                const isTip = i === segmentCount - 1;
                const topRadius = 1.0 - (i / segmentCount) * 0.9;
                const bottomRadius = 1.0 - ((i - 1) / segmentCount) * 0.9;
                
                let segment;
                if (isTip) {
                    segment = new THREE.Mesh(new THREE.ConeGeometry(topRadius, segmentLength * 1.5, 8), mat);
                    segment.position.y = segmentLength * 0.75;
                } else {
                    segment = new THREE.Mesh(new THREE.CylinderGeometry(topRadius, bottomRadius, segmentLength, 8), mat);
                    segment.position.y = segmentLength / 2;
                }
                
                parent.add(segment);
                segmentMeshes.push(segment);
                parent = segment;
            }
            g.userData.segments = segmentMeshes;
            g.userData.totalHeight = segmentCount * segmentLength;
            return g;
        },
        animations: {
            wave: (alien, time, playerDirection) => {
                if (!alien.userData.segments) return;
                const segmentCount = alien.userData.segments.length;
                alien.userData.segments.forEach((segment, index) => {
                    const waveSpeed = 2.0;
                    const waveOffset = index * 0.4;
                    const influence = (index / segmentCount) * (index / segmentCount);
                    
                    let rotX = Math.sin(time * waveSpeed + waveOffset) * 0.25 * influence;
                    let rotZ = Math.cos(time * waveSpeed * 0.8 + waveOffset) * 0.25 * influence;
                    
                    if (playerDirection) {
                        rotX += playerDirection.z * 0.6 * influence;
                        rotZ -= playerDirection.x * 0.6 * influence;
                    }

                    segment.rotation.x = THREE.MathUtils.lerp(segment.rotation.x, rotX, 0.1);
                    segment.rotation.z = THREE.MathUtils.lerp(segment.rotation.z, rotZ, 0.1);
                });
            }
        }
    },
    worm_swarm: {
        name: 'Corrosive Worm Swarm',
        description: 'A writhing mass of worms that damages anything it touches.',
        levels: ['toxic'],
        spawnWeight: 0.40,
        properties: { health: 4, score: 20, speed: 6, attackRange: 2.0, attackDamage: 0.5, attackCooldown: 1.5 },
        model: () => {
            const swarmGroup = new THREE.Group();
            const mat = new THREE.MeshStandardMaterial({color: 0x6e5033, roughness:0.8});
            const wormCount = 10;
            const worms = [];

            for (let i=0; i<wormCount; i++) {
                const worm = new THREE.Group();
                worm.userData.angle = Math.random() * Math.PI * 2;
                worm.userData.radius = Math.random() * 0.5 + 0.3;
                worm.userData.speed = Math.random() * 3 + 2;
                worm.userData.yOffset = Math.random() * Math.PI * 2;
                worms.push(worm);
                swarmGroup.add(worm);

                let parent = worm;
                for (let j=0; j<5; j++) {
                    const segment = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 6), mat);
                    segment.position.z = 0.15;
                    parent.add(segment);
                    parent = segment;
                }
            }
            swarmGroup.userData.worms = worms;
            return swarmGroup;
        },
        animations: {
            idle: (alien, time) => { GameData.enemies.worm_swarm.animations.swirl(alien, time); },
            walk: (alien, time) => { GameData.enemies.worm_swarm.animations.swirl(alien, time); },
            swirl: (alien, time) => {
                if (!alien.userData.worms) return;
                alien.userData.worms.forEach(worm => {
                    worm.userData.angle += worm.userData.speed * 0.016; 
                    worm.position.x = Math.cos(worm.userData.angle) * worm.userData.radius;
                    worm.position.z = Math.sin(worm.userData.angle) * worm.userData.radius;
                    worm.position.y = Math.sin(time * 5 + worm.userData.yOffset) * 0.5;

                    let parent = worm;
                    for(let i=0; i<worm.children.length; i++) {
                        const segment = worm.children[i];
                        segment.rotation.y = Math.sin(time*15 + i*0.5) * 0.5;
                        parent = segment;
                    }
                });
            }
        }
    },
    shard_roller: {
        name: 'Shard Roller',
        description: 'A large crystal robot that shatters into smaller mites when destroyed.',
        levels: ['crystal'],
        spawnWeight: 0.40,
        properties: { health: 6, score: 30, speed: 8, spawnY: 1.0, attackRange: 35, attackCooldown: 2.0, projectileSpeed: 40 },
        model: () => {
            const group = new THREE.Group();
            const hasShardRollerTex = gameSettings.texturesEnabled && window.shardRollerTexture;
            
            const mat = new THREE.MeshStandardMaterial({ 
                color: hasShardRollerTex ? 0xffffff : 0xeeccff, 
                map: hasShardRollerTex ? window.shardRollerTexture : null,
                metalness: 0.6, 
                roughness: 0.2, 
                emissive: hasShardRollerTex ? 0x000000 : 0xaa88ff, 
                emissiveIntensity: hasShardRollerTex ? 0.0 : 0.4 
            });
            const body = new THREE.Mesh(new THREE.IcosahedronGeometry(1.0, 1), mat);
            group.add(body);
            const vertices = body.geometry.attributes.position;
            for (let i = 0; i < vertices.count; i++) {
                const spike = new THREE.Mesh(new THREE.ConeGeometry(0.15, 2.0, 4), mat);
                const vertex = new THREE.Vector3().fromBufferAttribute(vertices, i);
                spike.position.copy(vertex).multiplyScalar(0.8);
                spike.lookAt(group.position);
                spike.rotation.x += Math.PI; 
                group.add(spike);
            }
            group.scale.setScalar(1.2);
            group.userData.rollAxis = new THREE.Vector3(Math.random() - 0.5, 0, Math.random() - 0.5).normalize();
            return group;
        },
        animations: {
            roll: (alien, delta) => {
                const speed = GameData.enemies.shard_roller.properties.speed;
                const circumference = 2 * Math.PI * 1.2;
                const rotationAmount = (speed * delta) / circumference;
                const q = new THREE.Quaternion().setFromAxisAngle(alien.userData.rollAxis, rotationAmount);
                alien.quaternion.multiplyQuaternions(q, alien.quaternion);
            }
        }
    },
    shard_mite: {
        name: 'Shard Mite',
        description: 'A small, fast crystal shard.',
        levels: ['crystal'],
        spawnWeight: 0, 
        properties: { health: 1, score: 5, speed: 10, spawnY: 0.5 },
        model: () => {
            const group = new THREE.Group();
            const hasShardMiteTex = gameSettings.texturesEnabled && window.shardMiteTexture;

            const mat = new THREE.MeshStandardMaterial({ 
                color: hasShardMiteTex ? 0xffffff : 0xeeccff, 
                map: hasShardMiteTex ? window.shardMiteTexture : null,
                metalness: 0.6, 
                roughness: 0.2, 
                emissive: hasShardMiteTex ? 0x000000 : 0x9966cc, 
                emissiveIntensity: hasShardMiteTex ? 0.0 : 0.8 
            });
            const body = new THREE.Mesh(new THREE.IcosahedronGeometry(0.5, 0), mat);
            group.add(body);
            group.userData.rollAxis = new THREE.Vector3(Math.random() - 0.5, 0, Math.random() - 0.5).normalize();
            return group;
        },
        animations: {
            roll: (alien, delta) => {
                const speed = GameData.enemies.shard_mite.properties.speed;
                const circumference = 2 * Math.PI * 0.5;
                const rotationAmount = (speed * delta) / circumference;
                const q = new THREE.Quaternion().setFromAxisAngle(alien.userData.rollAxis, rotationAmount);
                alien.quaternion.multiplyQuaternions(q, alien.quaternion);
            }
        }
    },
    predator: {
        name: 'Stalker',
        description: 'A semi-invisible predator that ambushes its prey on the toxic plains.',
        levels: ['toxic'],
        spawnWeight: 0.80,
        initialSpawn: false,
        properties: { health: 5, score: 40, spawnY: 1.2, sightRange: 35, attackRange: 2.5, attackCooldown: 1.5, speed: 7, attackDamage: 25 },
        model: () => {
            const group = new THREE.Group();
            const bodyMat = new THREE.MeshPhysicalMaterial({
                color: 0xbbbbbb,
                metalness: 0.1,
                roughness: 0.05,
                ior: 2.3, 
                transmission: 1.0, 
                thickness: 0.5, 
                transparent: true,
                opacity: 0.25 
            });

            group.userData.material = bodyMat;
            group.userData.legs = [];
            group.userData.spikes = [];

            const body = new THREE.Mesh(new THREE.SphereGeometry(0.8, 16, 8), bodyMat);
            body.scale.set(1, 0.5, 2.0);
            body.position.y = 1.2;
            group.add(body);

            const head = new THREE.Mesh(new THREE.SphereGeometry(0.5, 12, 8), bodyMat);
            head.position.set(0, 1.4, 1.2);
            group.add(head);

            const mouthGeo = new THREE.SphereGeometry(0.4, 12, 8, 0, Math.PI);
            const hasStalkerMouthTex = gameSettings.texturesEnabled && window.stalkerMouthTexture;
            const mouthMat = new THREE.MeshStandardMaterial({
                color: hasStalkerMouthTex ? 0xffffff : 0x660000,
                map: hasStalkerMouthTex ? window.stalkerMouthTexture : null,
                roughness: 0.8,
                side: THREE.DoubleSide
            });
            const mouth = new THREE.Mesh(mouthGeo, mouthMat);
            mouth.rotation.x = -Math.PI / 1.5;
            mouth.position.set(0, -0.1, 0.3);
            head.add(mouth);
            group.userData.mouth = mouth;

            const toothGeo = new THREE.ConeGeometry(0.05, 0.2, 4);
            const toothMat = new THREE.MeshStandardMaterial({color: 0xffffff});
            for(let i=0; i < 10; i++) {
                const tooth = new THREE.Mesh(toothGeo, toothMat);
                const angle = (i / 9) * Math.PI;
                const radius = 0.38;
                tooth.position.set(Math.cos(angle) * radius, -0.1, Math.sin(angle) * radius * 0.5 + 0.1);
                tooth.lookAt(new THREE.Vector3(0, -1, 0));
                mouth.add(tooth);
            }

            let parentSegment = group;
            const tailSegmentGeo = new THREE.SphereGeometry(0.4, 8, 6);
            for(let i = 0; i < 5; i++) {
                const scale = 1.0 - (i * 0.15);
                const tailSegment = new THREE.Mesh(tailSegmentGeo, bodyMat);
                tailSegment.scale.set(scale, scale, scale);
                tailSegment.position.set(0, 0.3, -0.7); 
                parentSegment.add(tailSegment);
                parentSegment = tailSegment;
            }

            for(let i=0; i<4; i++) {
                const side = (i % 2 === 0) ? 1 : -1;
                const zPos = (i < 2) ? 0.5 : -0.5;
                const leg = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.5, 0.1), bodyMat);
                leg.position.set(0.6 * side, 0.7, zPos);
                leg.rotation.z = -Math.PI / 6 * side;
                group.add(leg);
                group.userData.legs.push(leg);
            }
            
            const spikeGeo = new THREE.ConeGeometry(0.1, 1.5, 4); 
            for(let i = 0; i < 50; i++) { 
                const spike = new THREE.Mesh(spikeGeo, bodyMat);
                const phi = Math.acos(-1 + (2 * i) / 49);
                const theta = Math.sqrt(50 * Math.PI) * phi;
                const spikePos = new THREE.Vector3();
                spikePos.setFromSphericalCoords(0.8, phi, theta);
                spike.position.copy(body.position).add(spikePos);
                spike.lookAt(body.position);
                spike.rotation.x += Math.PI;
                group.add(spike);
                group.userData.spikes.push(spike);
            }

            return group;
        },
        animations: {
            walk: (alien, time, delta) => {
                if (!alien.userData.legs || !alien.userData.spikes) return;
                const speed = 7;
                alien.userData.legs.forEach((leg, i) => {
                    leg.rotation.x = Math.sin(time * speed * 2 + (i < 2 ? 0 : Math.PI)) * 0.4;
                });
                alien.userData.spikes.forEach((spike, i) => {
                    const wobbleSpeed = 15;
                    const wobbleAmount = 0.3;
                    spike.rotation.z = Math.sin(time * wobbleSpeed + i * 0.5) * wobbleAmount * delta * 50;
                });
            },
            mouth_animate: (alien, time) => {
                if (!alien.userData.mouth) return;
                const mouth = alien.userData.mouth;
                mouth.rotation.x = -Math.PI / 1.5 + Math.sin(time * 50) * 0.2; 
            }
        }
    },
    dome_guardian: {
        name: 'Dome Guardian',
        description: 'A stationary crystal turret that scans for targets and fires a powerful lightning bolt.',
        levels: ['crystal'],
        spawnWeight: 0.1,
        properties: { health: 20, score: 150, spawnY: 4, sightRange: 80, attackRange: 70, attackCooldown: 4.0, attackDamage: 50 },
        model: () => {
            const group = new THREE.Group();
            const hasDomeGuardianTex = gameSettings.texturesEnabled && window.domeGuardianTexture;

            const crystalMat = new THREE.MeshStandardMaterial({
                color: hasDomeGuardianTex ? 0xffffff : 0xaa88ff, 
                map: hasDomeGuardianTex ? window.domeGuardianTexture : null,
                roughness: 0.1, 
                metalness: 0.5, 
                flatShading: false,
                emissive: hasDomeGuardianTex ? 0x000000 : 0x8844cc, 
                emissiveIntensity: hasDomeGuardianTex ? 0.0 : 0.5, 
                transparent: true, 
                opacity: 0.85
            });
            const eyeMat = new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0xff0000, emissiveIntensity: 1.0 });

            const dome = new THREE.Mesh(new THREE.SphereGeometry(4, 32, 24), crystalMat);
            group.add(dome);
            
            const eyePivot = new THREE.Group();
            group.add(eyePivot);

            const eye = new THREE.Mesh(new THREE.SphereGeometry(0.5, 32, 16), eyeMat);
            eye.position.z = 3.8;
            eyePivot.add(eye);

            group.userData.eyePivot = eyePivot;
            group.userData.eye = eye;
            group.userData.eyeMaterial = eyeMat;

            return group;
        },
        animations: {
            idle: (alien, time) => {
                const initialY = GameData.enemies.dome_guardian.properties.spawnY;
                alien.position.y = initialY + Math.sin(time * 0.5) * 0.2;
                alien.rotation.y += 0.001;
            },
            scan: (alien, time, player, distance, playerDir, delta) => {
                const { eyePivot, eye, eyeMaterial } = alien.userData;
                const props = GameData.enemies.dome_guardian.properties;
                let shouldFire = false;
    
                if (!alien.userData.state) alien.userData.state = 'scanning';
    
                switch (alien.userData.state) {
                    case 'scanning':
                        eyePivot.rotation.y = Math.sin(time * 0.4) * Math.PI * 0.4;
                        eyePivot.rotation.x = Math.sin(time * 0.25) * Math.PI * 0.2;
                        
                        if (distance < props.sightRange) {
                           const forward = new THREE.Vector3(0, 0, 1);
                           forward.applyQuaternion(eye.getWorldQuaternion(new THREE.Quaternion()));
                           if (forward.dot(playerDir) > 0.95) { 
                               alien.userData.state = 'locked';
                               alien.userData.lockTimer = 1.0;
                           }
                        }
                        break;
    
                    case 'locked':
                        const targetWorldPos = player.position.clone().add(new THREE.Vector3(0, GameWorld.player.height / 2, 0));
                        const targetLocalPos = alien.worldToLocal(targetWorldPos);
                        
                        const tempMatrix = new THREE.Matrix4();
                        tempMatrix.lookAt(targetLocalPos, new THREE.Vector3(0,0,0), alien.up);
                        const targetQuaternion = new THREE.Quaternion().setFromRotationMatrix(tempMatrix);
                        
                        eyePivot.quaternion.slerp(targetQuaternion, 0.1);
    
                        eyeMaterial.emissiveIntensity = 3 + Math.sin(time * 30) * 2.5;
    
                        alien.userData.lockTimer -= delta;
                        if (alien.userData.lockTimer <= 0) {
                            if (distance < props.attackRange) {
                                alien.userData.state = 'firing';
                                shouldFire = true;
                            } else {
                                alien.userData.state = 'scanning';
                            }
                        }
                        break;
    
                    case 'firing':
                        eyeMaterial.emissiveIntensity = 8.0;
                        alien.userData.state = 'cooldown';
                        alien.userData.cooldownTimer = 0.5;
                        break;
    
                    case 'cooldown':
                        alien.userData.cooldownTimer -= delta;
                        eyeMaterial.emissiveIntensity = THREE.MathUtils.lerp(eyeMaterial.emissiveIntensity, 1.0, 0.1);
                        if (alien.userData.cooldownTimer <= 0) {
                            alien.userData.state = 'scanning';
                        }
                        break;
                }
                return shouldFire;
            }
        }
    }
};

let fuzzyEffectActive = false;

function spawnShardMites(position) {
    const count = 5; 
    for (let i = 0; i < count; i++) {
        const data = GameData.enemies.shard_mite;
        const mite = data.model();
        const offset = new THREE.Vector3((Math.random() - 0.5) * 3, 1.0, (Math.random() - 0.5) * 3);
        mite.position.copy(position).add(offset);

        mite.castShadow = true;
        mite.userData.type = 'shard_mite';
        mite.userData.velocity = new THREE.Vector3((Math.random() - 0.5) * 15, Math.random() * 5, (Math.random() - 0.5) * 15);
        mite.userData.state = 'chasing';
        mite.userData.attackCooldown = 0;
        mite.userData.health = data.properties.health;

        aliens.push(mite);
        scene.add(mite);
    }
}

function handleEnemyCollision(alien, deltaPos) {
    const enemyBox = new THREE.Box3();
    let enemySize;

    if (alien.userData.type === 'ground') {
        enemySize = new THREE.Vector3(1.2, 1.0, 1.2);
    } else if (alien.userData.type === 'tentacle') {
        enemySize = new THREE.Vector3(2, 20, 2);
    } else {
        enemySize = new THREE.Vector3(0.8, 1.5, 0.8);
    }

    enemyBox.setFromCenterAndSize(alien.position.clone().add(new THREE.Vector3(deltaPos.x, enemySize.y / 2, 0)), enemySize);
    if (checkBuildingCollision(enemyBox)) {
        deltaPos.x = 0;
        alien.userData.velocity.x *= -0.1;
    }
    alien.position.x += deltaPos.x;

    enemyBox.setFromCenterAndSize(alien.position.clone().add(new THREE.Vector3(0, enemySize.y / 2, deltaPos.z)), enemySize);
    if (checkBuildingCollision(enemyBox)) {
        deltaPos.z = 0;
        alien.userData.velocity.z *= -0.1;
    }
    alien.position.z += deltaPos.z;
    
    alien.position.y += deltaPos.y;
}

function spawnAliens(count, isInitialSpawn = false) {
    let validEnemies = Object.entries(GameData.enemies).filter(([key, data]) => data.levels.includes(currentLevel));

    if (isInitialSpawn) {
        validEnemies = validEnemies.filter(([_, data]) => data.initialSpawn !== false);
    }

    if (validEnemies.length === 0) return;

    for (let i = 0; i < count; i++) {
        const rand = Math.random();
        let cumulativeWeight = 0;
        let selectedEnemy;

        for (const [key, data] of validEnemies) {
            cumulativeWeight += data.spawnWeight;
            if (rand <= cumulativeWeight) {
                selectedEnemy = { type: key, data: data };
                break;
            }
        }
        if (!selectedEnemy) selectedEnemy = { type: validEnemies[0][0], data: validEnemies[0][1] };
        
        const alien = selectedEnemy.data.model();
        const spawnY = typeof selectedEnemy.data.properties.spawnY === 'function' ? selectedEnemy.data.properties.spawnY() : selectedEnemy.data.properties.spawnY;
        
        if (spawnSafe(alien, spawnY)) {
            if (selectedEnemy.type === 'dome_guardian') {
                const colliderBox = new THREE.Box3().setFromObject(alien);
                buildingColliders.push(colliderBox);
                alien.userData.colliderBox = colliderBox;
            }
            
            alien.castShadow = true;
            alien.userData.type = selectedEnemy.type;
            alien.userData.velocity = new THREE.Vector3((Math.random() - 0.5) * 4, 0, (Math.random() - 0.5) * 4);
            alien.userData.state = 'idle';
            alien.userData.attackCooldown = typeof selectedEnemy.data.properties.attackCooldown === 'function' ? selectedEnemy.data.properties.attackCooldown() : selectedEnemy.data.properties.attackCooldown;
            alien.userData.health = selectedEnemy.data.properties.health;
            if (selectedEnemy.type === 'flyer') {
                alien.userData.spawnPoint = alien.position.clone();
            }
            if (selectedEnemy.data.animations) {
                if (selectedEnemy.type === 'cyborg') {
                    alien.userData.animationProgress = 0;
                    selectedEnemy.data.animations.idle(alien);
                }
                if (selectedEnemy.type === 'ground' || selectedEnemy.type === 'worm_swarm') {
                    selectedEnemy.data.animations.idle?.(alien, 0);
                }
            }
            aliens.push(alien);
            scene.add(alien);
        }
    }
}

function spawnDelayedEnemies(count) {
    const enemiesToSpawn = Object.entries(GameData.enemies)
        .filter(([_, data]) => data.levels.includes(currentLevel) && data.initialSpawn === false);

    if (enemiesToSpawn.length === 0 || !playerObject) return;

    for (let i = 0; i < count; i++) {
        const [key, data] = enemiesToSpawn[Math.floor(Math.random()*enemiesToSpawn.length)]; 
        const alien = data.model();
        
        const angle = Math.random() * Math.PI * 2;
        const distance = 40 + Math.random() * 20;
        const spawnPos = new THREE.Vector3(
            playerObject.position.x + Math.cos(angle) * distance,
            0,
            playerObject.position.z + Math.sin(angle) * distance
        );

        let isSafe = false, tries = 0;
        const spawnY = typeof data.properties.spawnY === 'function' ? data.properties.spawnY() : data.properties.spawnY;
        
        alien.position.copy(spawnPos);
        alien.position.y = spawnY;

        do {
            const box = new THREE.Box3().setFromObject(alien);
            if (!checkBuildingCollision(box)) {
                isSafe = true;
            } else {
                alien.position.x += (Math.random() - 0.5) * 10;
                alien.position.z += (Math.random() - 0.5) * 10;
            }
            tries++;
        } while (!isSafe && tries < 20);
        
        if (isSafe) {
            alien.castShadow = true;
            alien.userData.type = key;
            alien.userData.velocity = new THREE.Vector3();
            alien.userData.state = 'idle';
            alien.userData.attackCooldown = typeof data.properties.attackCooldown === 'function' ? data.properties.attackCooldown() : data.properties.attackCooldown;
            alien.userData.health = data.properties.health;
            if (data.animations && (key === 'ground' || key === 'tentacle')) data.animations.idle?.(alien, 0);
            aliens.push(alien);
            scene.add(alien);
        }
    }
}

function updateAliens(delta) {
    let playerTarget = playerObject;
    if (player.state === 'driving_motorcycle') playerTarget = motorcycle;
    else if (player.state !== 'on_foot') playerTarget = spacecraft;

    for (let i = aliens.length - 1; i >= 0; i--) {
        const alien = aliens[i];
        const data = alien.userData;
        const enemyDef = GameData.enemies[data.type];
        const enemyProps = enemyDef.properties;
        
        if(data.attackCooldown > 0) data.attackCooldown -= delta;
        if(data.hitCooldown > 0) data.hitCooldown -= delta;

        for (let j = i - 1; j >= 0; j--) {
            const otherAlien = aliens[j];
            if (otherAlien.userData.type === 'dome_guardian' || data.type === 'dome_guardian') continue;
            const dist = alien.position.distanceTo(otherAlien.position);
            const requiredDist = 2.0; 
            if (dist < requiredDist) {
                const pushVector = new THREE.Vector3().subVectors(alien.position, otherAlien.position).normalize();
                const pushAmount = (requiredDist - dist) * 0.5;
                alien.position.add(pushVector.clone().multiplyScalar(pushAmount));
                otherAlien.position.sub(pushVector.clone().multiplyScalar(pushAmount));
            }
        }
        
        if (player.carriedObject && player.carriedObject.userData.key === 'glowing_orb') {
            data.state = 'idle'; 
            if (data.velocity) data.velocity.multiplyScalar(0.95);
            if (data.type !== 'dome_guardian') {
                const deltaPos = data.velocity.clone().multiplyScalar(delta);
                handleEnemyCollision(alien, deltaPos); 
            }
            continue; 
        }

        switch(data.type) {
            case 'dome_guardian': {
                enemyDef.animations.idle(alien, clock.getElapsedTime());

                const playerCenterPos = playerTarget.position.clone().add(new THREE.Vector3(0, GameWorld.player.height / 2, 0));
                const playerDirection = new THREE.Vector3().subVectors(playerCenterPos, alien.position);
                const distanceToPlayer = playerDirection.length();
                playerDirection.normalize();
                
                const shouldFire = enemyDef.animations.scan(alien, clock.getElapsedTime(), playerTarget, distanceToPlayer, playerDirection, delta);
            
                if (shouldFire && data.attackCooldown <= 0) {
                    data.attackCooldown = enemyProps.attackCooldown;
                    const eyePosition = new THREE.Vector3();
                    alien.userData.eye.getWorldPosition(eyePosition);
            
                    createLightningBolt(eyePosition, playerCenterPos, enemyProps.attackDamage);
                }
                continue;
            }
            case 'predator': {
                const distanceToPlayer = alien.position.distanceTo(playerTarget.position);
                alien.lookAt(playerTarget.position);
                if (distanceToPlayer < enemyProps.sightRange) {
                    data.state = 'stalking';
                    const dir = new THREE.Vector3().subVectors(playerTarget.position, alien.position).normalize();
                    data.velocity.lerp(dir.multiplyScalar(enemyProps.speed), 0.1);
                    
                    if (enemyDef.animations && enemyDef.animations.walk) {
                        enemyDef.animations.walk(alien, clock.getElapsedTime(), delta);
                    }

                    if (distanceToPlayer < enemyProps.attackRange) {
                        if (enemyDef.animations && enemyDef.animations.mouth_animate) {
                            enemyDef.animations.mouth_animate(alien, clock.getElapsedTime());
                        }
                        if (data.attackCooldown <= 0) {
                            health = Math.max(0, health - enemyProps.attackDamage);
                            lastAttackerPosition = alien.position.clone();
                            playSound('player_damage');
                            data.attackCooldown = enemyProps.attackCooldown;
                        }
                    }

                } else {
                    data.state = 'idle';
                    data.velocity.multiplyScalar(0.95);
                }
                break;
            }
            case 'shard_roller':
            case 'shard_mite': {
                const distanceToPlayer = alien.position.distanceTo(playerTarget.position);
                if (distanceToPlayer < 40) {
                    const dir = new THREE.Vector3().subVectors(playerTarget.position, alien.position).normalize();
                    data.velocity.lerp(dir.multiplyScalar(enemyProps.speed), 0.05);
                }
                if (distanceToPlayer < 1.5) {
                    health = Math.max(0, health - 5);
                    lastAttackerPosition = alien.position.clone();
                }

                if (data.type === 'shard_roller' && distanceToPlayer < enemyProps.attackRange && data.attackCooldown <= 0) {
                    data.attackCooldown = enemyProps.attackCooldown;
                    const spike = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.8, 4), alien.children[0].material);
                    spike.position.copy(alien.position);
                    const fireDir = new THREE.Vector3().subVectors(playerTarget.position, alien.position).normalize();
                    spike.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0), fireDir);
                    spike.userData.velocity = fireDir.multiplyScalar(enemyProps.projectileSpeed);
                    shardProjectiles.push(spike);
                    scene.add(spike);
                }

                enemyDef.animations.roll(alien, delta);
                break;
            }
            case 'worm_swarm': {
                const distanceToPlayer = alien.position.distanceTo(playerTarget.position);
                enemyDef.animations.swirl(alien, clock.getElapsedTime());
                alien.lookAt(playerTarget.position.x, alien.position.y, playerTarget.position.z);
                if (distanceToPlayer < enemyProps.attackRange && data.attackCooldown <= 0) {
                    health = Math.max(0, health - enemyProps.attackDamage);
                    lastAttackerPosition = alien.position.clone();
                    wormAttackOverlay.style.opacity = 1;
                    setTimeout(()=> { wormAttackOverlay.style.opacity = 0; }, 200);
                    data.attackCooldown = enemyProps.attackCooldown;
                } else if (distanceToPlayer < 40) {
                    const dir = new THREE.Vector3().subVectors(playerTarget.position, alien.position).normalize();
                    data.velocity.lerp(dir.multiplyScalar(enemyProps.speed), 0.1);
                }
                break;
            }
            case 'tentacle': {
                const distanceToPlayer = alien.position.distanceTo(playerTarget.position);
                const targetY = 0;
                switch (data.state) {
                    case 'idle':
                        if (data.attackCooldown <= 0) {
                            data.state = 'emerging';
                            alien.position.x = playerTarget.position.x + (Math.random() - 0.5) * 5;
                            alien.position.z = playerTarget.position.z + (Math.random() - 0.5) * 5;
                            alien.position.y = enemyProps.spawnY;
                            data.attackCooldown = 5.0;
                            createHitScatter(new THREE.Vector3(alien.position.x, 0, alien.position.z), 0xffffff);
                        }
                        break;
                    case 'emerging':
                        alien.position.y += enemyProps.emergeSpeed * delta;
                        if (alien.position.y >= targetY) {
                            alien.position.y = targetY;
                            data.state = 'attacking';
                            data.attackTimer = 4.0;
                            data.hitCooldown = 0;
                        }
                        break;
                    case 'attacking':
                        const playerDirection = new THREE.Vector3().subVectors(playerTarget.position, alien.position).normalize();
                        enemyDef.animations.wave(alien, clock.getElapsedTime(), playerDirection);
                        
                        const moveDir = new THREE.Vector3().subVectors(playerTarget.position, alien.position).normalize();
                        moveDir.y = 0;
                        data.velocity.lerp(moveDir.multiplyScalar(0.5), 0.1);
                        
                        const deltaPosMove = data.velocity.clone().multiplyScalar(delta);
                        handleEnemyCollision(alien, deltaPosMove);

                        data.attackTimer -= delta;
                        if (distanceToPlayer < 8 && data.hitCooldown <= 0) {
                            health = Math.max(0, health - enemyProps.attackDamage);
                            lastAttackerPosition = alien.position.clone();
                            player.velocity.y = enemyProps.attackImpulse;
                            playSound('player_damage');
                            data.hitCooldown = enemyProps.hitCooldown;
                        }
                        if (data.attackTimer <= 0) {
                            data.state = 'retracting';
                            createHitScatter(new THREE.Vector3(alien.position.x, 0, alien.position.z), 0xffffff);
                        }
                        break;
                    case 'retracting':
                        alien.userData.segments.forEach(seg => {
                            seg.rotation.x = THREE.MathUtils.lerp(seg.rotation.x, 0, 0.05);
                            seg.rotation.z = THREE.MathUtils.lerp(seg.rotation.z, 0, 0.05);
                        });
                        alien.position.y -= enemyProps.emergeSpeed * 0.7 * delta;
                        if (alien.position.y <= enemyProps.spawnY) {
                            data.state = 'idle';
                        }
                        break;
                }
                continue;
            }
            case 'stingray': {
                const distanceToPlayer = alien.position.distanceTo(playerTarget.position);
                const hoverPointStingray = playerTarget.position.clone().add(new THREE.Vector3(Math.sin(clock.getElapsedTime()*0.2)*100, 0, Math.cos(clock.getElapsedTime()*0.2)*100));
                data.spawnY = data.spawnY || enemyProps.spawnY();
                hoverPointStingray.y = data.spawnY;
                const dirToHover = new THREE.Vector3().subVectors(hoverPointStingray, alien.position).normalize();
                data.velocity.lerp(dirToHover.multiplyScalar(enemyProps.speed), 0.05);
                alien.lookAt(alien.position.clone().add(data.velocity));
                if (distanceToPlayer < enemyProps.sightRange && data.attackCooldown <= 0) {
                    data.attackCooldown = enemyProps.bombDropRate;
                    const bomb = new THREE.Mesh(new THREE.SphereGeometry(1.0, 12, 8), new THREE.MeshStandardMaterial({color: 0x111111}));
                    bomb.position.copy(alien.position);
                    bomb.userData.velocity = new THREE.Vector3(0, -10, 0);
                    bombs.push(bomb);
                    scene.add(bomb);
                }
                break;
            }
            case 'cyborg': {
                const distanceToPlayer = alien.position.distanceTo(playerTarget.position);
                if (data.state === 'dying') { 
                    data.animationProgress += delta * 0.5; 
                    enemyDef.animations.death(alien, data.animationProgress, delta); 
                    if (data.animationProgress >= 1) { 
                        if (alien.userData.debrisParts) {
                            alien.userData.debrisParts.forEach(part => {
                                if (part.mesh && part.mesh.parent) {
                                    scene.remove(part.mesh);
                                }
                            });
                        }
                        scene.remove(alien); 
                        aliens.splice(i, 1); 
                        score += enemyProps.score; 
                    } 
                    continue; 
                } 
                
                alien.lookAt(playerTarget.position.x, alien.position.y, playerTarget.position.z); 
                
                if (distanceToPlayer < enemyProps.attackRange && data.attackCooldown <= 0 && data.state !== 'shooting') { 
                    data.state = 'shooting'; 
                    data.animationProgress = 0; 
                    data.hasFiredInThisShot = false; 
                    data.attackCooldown = typeof enemyProps.attackCooldown === 'function' ? enemyProps.attackCooldown() : enemyProps.attackCooldown; 
                } else if (data.state !== 'shooting') { 
                    if (distanceToPlayer > enemyProps.sightRange) data.state = 'idle'; 
                    else data.state = 'chasing'; 
                } 
                
                switch(data.state) { 
                    case 'idle': 
                        enemyDef.animations.idle(alien); 
                        data.velocity.multiplyScalar(0.9);
                        break; 
                    case 'chasing': 
                        enemyDef.animations.walk(alien, clock.getElapsedTime()); 
                        const dir = new THREE.Vector3().subVectors(playerTarget.position, alien.position).normalize(); 
                        // Nopeutettu liikenopeus (1.8 -> 3.2) nopeutettuun kävelyanimaatioon sopivaksi
                        data.velocity.lerp(dir.multiplyScalar(3.2), 0.1); 
                        break; 
                    case 'shooting': 
                        // Pysäytetään robotin liike täysin ampumisen ajaksi
                        data.velocity.set(0, 0, 0);
                        const didFire = enemyDef.animations.shoot(alien, data.animationProgress); 
                        if (didFire) { 
                            const startPos = new THREE.Vector3(); 
                            if (alien.userData.rifleBarrel) {
                                alien.userData.rifleBarrel.getWorldPosition(startPos); 
                            } else {
                                startPos.copy(alien.position).add(new THREE.Vector3(0, 1.2, 0));
                            }
                            const fireDir = new THREE.Vector3().subVectors(playerTarget.position, startPos).normalize(); 
                            const proj = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 8), new THREE.MeshBasicMaterial({color: 0xff0000, emissive: 0xff0000, emissiveIntensity: 3})); 
                            proj.position.copy(startPos); 
                            proj.userData.velocity = fireDir.multiplyScalar(enemyProps.projectileSpeed); 
                            cyborgProjectiles.push(proj); 
                            scene.add(proj); 
                            playSound('cyborg_shoot'); 
                        } 
                        data.animationProgress += delta * 2.0; 
                        if (data.animationProgress >= 1) data.state = 'chasing'; 
                        break; 
                }
                break;
            }
            case 'ground': {
                const distanceToPlayer = alien.position.distanceTo(playerTarget.position);
                const enemyDefAnims = GameData.enemies.ground.animations;
                const onGround = alien.position.y <= enemyProps.spawnY + 0.01;
                switch (data.state) {
                    case 'idle': if (distanceToPlayer < enemyProps.sightRange) { data.state = 'chase'; } if (enemyDefAnims) enemyDefAnims.idle(alien, clock.getElapsedTime()); data.velocity.x *= 0.8; data.velocity.z *= 0.8; break;
                    case 'chase': alien.lookAt(playerTarget.position.x, alien.position.y, playerTarget.position.z); const dirToPlayer = new THREE.Vector3().subVectors(playerTarget.position, alien.position).normalize(); data.velocity.lerp(dirToPlayer.multiplyScalar(enemyProps.chaseSpeed), 0.1); if (enemyDefAnims) enemyDefAnims.walk(alien, clock.getElapsedTime()); if (distanceToPlayer < enemyProps.pounceRange && data.attackCooldown <= 0 && onGround) { data.state = 'pounce'; data.pounceTimer = enemyProps.pounceWindUp; data.velocity.set(0, 0, 0); } break;
                    case 'pounce': if (enemyDefAnims) enemyDefAnims.pounce(alien); alien.lookAt(playerTarget.position.x, alien.position.y, playerTarget.position.z); data.pounceTimer -= delta; if (data.pounceTimer <= 0) { const pounceDir = new THREE.Vector3().subVectors(playerTarget.position, alien.position); pounceDir.y = 0; pounceDir.normalize().multiplyScalar(enemyProps.pounceForce); pounceDir.y = enemyProps.pounceLift; data.velocity.copy(pounceDir); data.state = 'leaping'; data.attackCooldown = enemyProps.pounceCooldown; } break;
                    case 'leaping': if (enemyDefAnims) enemyDefAnims.leap(alien); if ((player.state === 'on_foot' || player.state === 'driving_motorcycle') && distanceToPlayer < 1.8) { health = Math.max(0, health - enemyProps.pounceDamage); lastAttackerPosition = alien.position.clone(); playSound('player_damage'); data.velocity.multiplyScalar(-0.5); data.state = 'idle'; } if (onGround && data.velocity.y < 0) { data.state = 'idle'; } break;
                }
                data.velocity.y -= GRAVITY * delta;
                break;
            }
            case 'flyer': {
                const distanceToPlayer = alien.position.distanceTo(playerTarget.position);
                switch(data.state) {
                    case 'idle': 
                        if (distanceToPlayer < enemyProps.sightRange) {
                            data.state = 'attacking';
                        } else {
                            if (!data.patrolTarget || alien.position.distanceTo(data.patrolTarget) < 5) {
                                const angle = Math.random() * 2 * Math.PI;
                                const radius = Math.random() * enemyProps.patrolRadius;
                                data.patrolTarget = data.spawnPoint.clone().add(new THREE.Vector3(Math.cos(angle) * radius, 0, Math.sin(angle) * radius));
                            }
                            const dirToPatrol = new THREE.Vector3().subVectors(data.patrolTarget, alien.position).normalize();
                            data.velocity.lerp(dirToPatrol.multiplyScalar(3), 0.05);
                        }
                        break;
                    case 'attacking':
                        const hoverPointFlyer = playerTarget.position.clone().add(new THREE.Vector3(0, 10, 0)); 
                        const directionToHover = new THREE.Vector3().subVectors(hoverPointFlyer, alien.position).normalize(); 
                        data.velocity.lerp(directionToHover.multiplyScalar(5), 0.05); 
                        if(distanceToPlayer < enemyProps.sightRange && data.attackCooldown <= 0) { 
                            const projectile = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 8), new THREE.MeshBasicMaterial({ color: 0xcc00ff, emissive: 0xcc00ff, emissiveIntensity: 2 })); 
                            projectile.position.copy(alien.position); 
                            projectile.userData.velocity = new THREE.Vector3().subVectors(playerTarget.position, alien.position).normalize().multiplyScalar(enemyProps.projectileSpeed); 
                            alienProjectiles.push(projectile); scene.add(projectile); 
                            data.attackCooldown = enemyProps.attackCooldown; 
                        }
                        if (distanceToPlayer > enemyProps.sightRange * 1.2) { 
                            data.state = 'idle';
                        }
                        break;
                }
                alien.lookAt(alien.position.clone().add(data.velocity));
                break;
            }
        }

        if (data.type !== 'dome_guardian') {
            const deltaPos = data.velocity.clone().multiplyScalar(delta);
            handleEnemyCollision(alien, deltaPos);
            
            if((data.type === 'ground' || data.type === 'worm_swarm' || data.type === 'shard_roller' || data.type === 'shard_mite' || data.type === 'predator') && alien.position.y < enemyProps.spawnY) {
                alien.position.y = enemyProps.spawnY;
                 if (data.state !== 'leaping') {
                     data.velocity.y = 0;
                 }
            }
        }
    }
}

function updateAlienProjectiles(delta) {
    for (let i = alienProjectiles.length - 1; i >= 0; i--) {
        const p = alienProjectiles[i];
        p.position.add(p.userData.velocity.clone().multiplyScalar(delta));
        const projectileBox = new THREE.Box3().setFromObject(p);
        if (checkBuildingCollision(projectileBox) || p.position.y <= 0) {
            createHitScatter(p.position); scene.remove(p); alienProjectiles.splice(i, 1); continue;
        }
        let targetPos, hitRadius;
        if (player.state === 'on_foot') { targetPos = playerObject.position; hitRadius = 1.5; }
        else if (player.state === 'driving_motorcycle') { targetPos = motorcycle.position; hitRadius = 3.0; }
        else { targetPos = spacecraft.position; hitRadius = 5.0; }
        if (p.position.distanceTo(targetPos) < hitRadius) {
            if (player.state === 'on_foot' || player.state === 'driving_motorcycle') {
                health = Math.max(0, health - 10);
                lastAttackerPosition = p.position.clone();
                playSound('player_damage');
            }
            scene.remove(p); alienProjectiles.splice(i, 1);
        } else if (p.position.y < -10) {
            scene.remove(p); alienProjectiles.splice(i, 1);
        }
    }
}

function updateCyborgProjectiles(delta) {
    for (let i = cyborgProjectiles.length - 1; i >= 0; i--) {
        const p = cyborgProjectiles[i];
        p.position.add(p.userData.velocity.clone().multiplyScalar(delta));
        const projectileBox = new THREE.Box3().setFromObject(p);
        if (checkBuildingCollision(projectileBox) || p.position.y <= 0) {
            createHitScatter(p.position); scene.remove(p); cyborgProjectiles.splice(i, 1); continue;
        }
        let targetPos, hitRadius;
        if (player.state === 'on_foot') { targetPos = playerObject.position; hitRadius = 1.5; }
        else if (player.state === 'driving_motorcycle') { targetPos = motorcycle.position; hitRadius = 3.0; }
        else { continue; }
        if (p.position.distanceTo(targetPos) < hitRadius) {
            health = Math.max(0, health - 15);
            lastAttackerPosition = p.position.clone();
            playSound('player_damage');
            scene.remove(p); cyborgProjectiles.splice(i, 1);
        } else if (p.position.y < -10) {
            scene.remove(p); cyborgProjectiles.splice(i, 1);
        }
    }
}

function updateBombs(delta) {
    for (let i = bombs.length - 1; i >= 0; i--) {
        const b = bombs[i];
        b.userData.velocity.y -= GRAVITY * 0.5 * delta;
        b.position.add(b.userData.velocity.clone().multiplyScalar(delta));
        let hit = false;
        const bombBox = new THREE.Box3().setFromObject(b);
        if (checkBuildingCollision(bombBox) || b.position.y <= 0) {
            hit = true;
        }
        if (!hit) {
            let targetPos, hitRadius;
            if (player.state === 'on_foot') { targetPos = playerObject.position; hitRadius = 3.0; }
            else if (player.state === 'driving_motorcycle') { targetPos = motorcycle.position; hitRadius = 4.0; }
            else { targetPos = null; }
            if(targetPos && b.position.distanceTo(targetPos) < hitRadius) {
                 health = Math.max(0, health - 40);
                 lastAttackerPosition = b.position.clone();
                 hit = true;
            }
        }
        if (hit) {
            createExplosion(b.position, 10); scene.remove(b); bombs.splice(i, 1);
        }
    }
}

function updateDebris(delta) { 
    for (let i = alienDebris.length - 1; i >= 0; i--) { 
        const p = alienDebris[i]; 
        p.velocity.y -= GRAVITY * 0.5 * delta; 
        p.mesh.position.add(p.velocity.clone().multiplyScalar(delta)); 
        p.lifetime -= delta; 
        if (p.lifetime <= 0) { 
            scene.remove(p.mesh); 
            if (p.mesh.material) {
                p.mesh.material.dispose();
            }
            alienDebris.splice(i, 1); 
        } 
    } 
}

function updateShardProjectiles(delta) {
    for (let i = shardProjectiles.length - 1; i >= 0; i--) {
        const p = shardProjectiles[i];
        p.position.add(p.userData.velocity.clone().multiplyScalar(delta));
        const projectileBox = new THREE.Box3().setFromObject(p);
        if (checkBuildingCollision(projectileBox) || p.position.y <= 0) {
            createHitScatter(p.position, 0xeeccff); scene.remove(p); shardProjectiles.splice(i, 1); continue;
        }
        let targetPos, hitRadius;
        if (player.state === 'on_foot') { targetPos = playerObject.position; hitRadius = 1.5; }
        else if (player.state === 'driving_motorcycle') { targetPos = motorcycle.position; hitRadius = 3.0; }
        else { continue; } 
        if (p.position.distanceTo(targetPos) < hitRadius) {
            health = Math.max(0, health - 10);
            lastAttackerPosition = p.position.clone();
            playSound('player_damage');
            createHitScatter(p.position, 0xeeccff);

            if (damageFlashElement) {
                damageFlashElement.style.opacity = 0.5;
                setTimeout(() => { damageFlashElement.style.opacity = 0; }, 120);
            }

            if (fuzzyVisionOverlay && !fuzzyEffectActive) {
                fuzzyEffectActive = true;
                fuzzyVisionOverlay.classList.add('effect-active');
                
                setTimeout(() => {
                    fuzzyVisionOverlay.classList.remove('effect-active');
                    fuzzyEffectActive = false;
                }, 1000);
            }

            scene.remove(p);
            shardProjectiles.splice(i, 1);
        } else if (p.position.y < -10) {
            scene.remove(p); shardProjectiles.splice(i, 1);
        }
    }
}
