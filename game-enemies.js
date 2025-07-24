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
            const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 0.8, roughness: 0.4 });
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
        levels: ['city', 'desert', 'volcanic', 'toxic', 'crystal'],
        spawnWeight: 0.05,
        properties: { health: 1, score: 10, spawnY: () => Math.random() * 20 + 15, sightRange: 40, attackCooldown: 3.0, projectileSpeed: 30 },
        model: () => {
            const g = new THREE.Group(); const bM = new THREE.MeshStandardMaterial({ color: 0x333322, roughness: 0.2, metalness: 0.9 }); const eM = new THREE.MeshStandardMaterial({ color: 0xcc00ff, emissive: 0xcc00ff, emissiveIntensity: 3 }); const b = new THREE.Mesh(new THREE.SphereGeometry(0.6, 16, 8), bM); g.add(b); const e = new THREE.Mesh(new THREE.SphereGeometry(0.25, 16, 8), eM); e.position.z = 0.5; g.add(e); const wG = new THREE.BoxGeometry(1.5, 0.1, 0.8); for(let i = 0; i < 2; i++) { const w = new THREE.Mesh(wG, bM); const s = (i % 2 === 0) ? 1 : -1; w.position.set(1.0 * s, 0, -0.2); w.rotation.z = Math.PI / 8 * s; g.add(w); } return g;
        }
    },
    cyborg: {
        name: 'Cyborg Soldier',
        description: 'A heavily-armored humanoid soldier equipped with a rapid-fire rifle.',
        levels: ['city', 'desert', 'volcanic', 'toxic', 'crystal'],
        spawnWeight: 0.125,
        properties: { health: 3, score: 25, spawnY: 1.4, sightRange: 30, attackRange: 25, attackCooldown: () => Math.random() * 2 + 3, projectileSpeed: 50 },
        model: () => {
            const soldierGroup = new THREE.Group(); const armorMat = new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.25, metalness: 0.9 }); const underSuitMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.8, metalness: 0.1 }); const emissiveMat = new THREE.MeshStandardMaterial({ color: 0xdd0000, emissive: 0xdd0000, emissiveIntensity: 2 }); const torsoGroup = new THREE.Group(); soldierGroup.add(torsoGroup); soldierGroup.userData.torso = torsoGroup; const pelvis = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.4, 0.5), underSuitMat); pelvis.position.y = 0.9; torsoGroup.add(pelvis); const chestUnder = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.9, 0.6), underSuitMat); chestUnder.position.y = 1.55; torsoGroup.add(chestUnder); const mainChestPlate = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.6, 0.2), armorMat); mainChestPlate.position.set(0, 1.6, 0.3); mainChestPlate.rotation.x = Math.PI / 12; torsoGroup.add(mainChestPlate); const abPlate = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.3, 0.15), armorMat); abPlate.position.set(0, 1.2, 0.3); torsoGroup.add(abPlate); const head = new THREE.Group(); head.position.y = 2.2; torsoGroup.add(head); soldierGroup.userData.head = head; const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.25, 16, 12), armorMat); helmet.scale.set(1, 1.1, 1); head.add(helmet); const visor = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.2, 8, 1, false, 0, Math.PI), emissiveMat); visor.rotation.x = Math.PI / 2; visor.scale.y = 0.5; visor.position.set(0, -0.05, 0.18); helmet.add(visor); const createLeg = (isLeft) => { const leg = new THREE.Group(); const side = isLeft ? 1 : -1; leg.position.set(side * -0.2, 0.7, 0); const thigh = GameData._createCapsuleMesh(0.18, 0.8, underSuitMat); thigh.position.y = -0.5; leg.add(thigh); const thighArmor = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.7, 8, 1, true), armorMat); thighArmor.position.set(0, -0.5, 0.15); leg.add(thighArmor); const knee = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.3, 8), armorMat); knee.rotation.z = Math.PI/2; knee.position.y = -1.0; leg.add(knee); const calf = GameData._createCapsuleMesh(0.15, 0.8, underSuitMat); calf.position.y = -1.5; leg.add(calf); const shinGuard = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.9, 8, 1, true), armorMat); shinGuard.position.set(0, -1.5, 0.1); leg.add(shinGuard); const foot = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.2, 0.6), armorMat); foot.position.y = -2.0; foot.position.z = 0.1; leg.add(foot); return leg; }; const leftLeg = createLeg(true); soldierGroup.add(leftLeg); soldierGroup.userData.leftLeg = leftLeg; const rightLeg = createLeg(false); soldierGroup.add(rightLeg); soldierGroup.userData.rightLeg = rightLeg; const createArm = (isLeft) => { const arm = new THREE.Group(); const side = isLeft ? 1 : -1; arm.position.set(side * -0.5, 1.8, 0); const shoulder = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8), armorMat); arm.add(shoulder); const bicep = GameData._createCapsuleMesh(0.18, 0.6, underSuitMat); bicep.position.y = -0.4; arm.add(bicep); const forearm = new THREE.Group(); forearm.position.y = -0.7; arm.add(forearm); const forearmCore = GameData._createCapsuleMesh(0.16, 0.6, underSuitMat); forearmCore.position.y = -0.4; forearm.add(forearmCore); const forearmPlate = new THREE.Mesh(new THREE.BoxGeometry(0.35,0.7,0.35), armorMat); forearmPlate.position.y = -0.4; forearm.add(forearmPlate); const hand = new THREE.Group(); hand.position.y = -0.9; forearm.add(hand); const handPalm = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.25, 0.1), underSuitMat); hand.add(handPalm); const handThumb = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.15, 0.1), underSuitMat); handThumb.position.set(side * -0.1, 0, 0); hand.add(handThumb); arm.userData.forearm = forearm; return arm; }; const leftArm = createArm(true); torsoGroup.add(leftArm); soldierGroup.userData.leftArm = leftArm; const rightArm = createArm(false); torsoGroup.add(rightArm); soldierGroup.userData.rightArm = rightArm; const rifle = new THREE.Group(); soldierGroup.userData.rifle = rifle; const rifleBody = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.2, 1.2), armorMat); rifle.add(rifleBody); const rifleBarrel = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.5, 8), armorMat); rifleBarrel.rotation.x = Math.PI / 2; rifleBarrel.position.z = 0.85; rifleBody.add(rifleBarrel); soldierGroup.userData.rifleBarrel = rifleBarrel; const rifleGrip = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.05, 0.4, 6), underSuitMat); rifleGrip.position.set(0, -0.2, -0.2); rifleGrip.rotation.x = Math.PI/4; rifleBody.add(rifleGrip); const rifleForeGrip = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.2, 0.1), underSuitMat); rifleForeGrip.position.set(0, -0.15, 0.5); rifleBody.add(rifleForeGrip); const rifleMag = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.3, 0.4), emissiveMat); rifleMag.position.set(0,-0.15, 0.2); rifleBody.add(rifleMag); rightArm.userData.forearm.children[2].add(rifle); rifle.position.set(0, 0.1, 0.1); rifle.rotation.y = Math.PI/2; soldierGroup.traverse(child => { if (child.isMesh) { child.castShadow = true; child.receiveShadow = true; } }); return soldierGroup;
        },
        animations: {
            _holdRifle: (alien) => { const { torso, head, leftArm, rightArm } = alien.userData; torso.rotation.set(0,0,0); head.rotation.set(0,0,0); leftArm.position.z = 0; leftArm.rotation.set(0,0,0); leftArm.userData.forearm.rotation.set(0,0,0); rightArm.position.z = 0; rightArm.rotation.set(0,0,0); rightArm.userData.forearm.rotation.set(0,0,0); rightArm.rotation.x = -Math.PI / 1.8; rightArm.rotation.z = -Math.PI / 12; rightArm.userData.forearm.rotation.y = -Math.PI / 8; rightArm.userData.forearm.rotation.z = -Math.PI / 2; leftArm.position.z = 0.1; leftArm.rotation.x = -Math.PI / 2.5; leftArm.rotation.y = Math.PI / 6; leftArm.rotation.z = Math.PI / 8; leftArm.userData.forearm.rotation.y = Math.PI / 5; leftArm.userData.forearm.rotation.z = Math.PI / 2; },
            idle: (alien) => { GameData.enemies.cyborg.animations._holdRifle(alien); const { leftLeg, rightLeg } = alien.userData; leftLeg.rotation.set(0,0,0); rightLeg.rotation.set(0,0,0); alien.position.y = 1.4; },
            walk: (alien, time) => { GameData.enemies.cyborg.animations._holdRifle(alien); const { leftLeg, rightLeg } = alien.userData; const walkSpeed = 5; const walkAmplitude = 0.5; const bobAmplitude = 0.04; leftLeg.rotation.x = Math.sin(time * walkSpeed) * walkAmplitude; rightLeg.rotation.x = -Math.sin(time * walkSpeed) * walkAmplitude; alien.position.y = 1.4 + (Math.abs(Math.sin(time * walkSpeed)) * bobAmplitude); },
            shoot: (alien, progress) => { const portArmsPose = { rArmX: -Math.PI / 1.8, lArmX: -Math.PI / 2.5, headX: 0 }; const aimPose = { rArmX: -Math.PI / 2.2, lArmX: -Math.PI / 3, headX: Math.PI / 16 }; const { head, leftArm, rightArm } = alien.userData; const aimProgress = Math.min(1, progress / 0.3); rightArm.rotation.x = THREE.MathUtils.lerp(portArmsPose.rArmX, aimPose.rArmX, aimProgress); leftArm.rotation.x = THREE.MathUtils.lerp(portArmsPose.lArmX, aimPose.lArmX, aimProgress); head.rotation.x = THREE.MathUtils.lerp(portArmsPose.headX, aimPose.headX, aimProgress); if (progress > 0.3 && progress < 0.4 && !alien.userData.hasFiredInThisShot) { rightArm.position.z = -0.05; head.rotation.x += 0.03; alien.userData.hasFiredInThisShot = true; return true; } else if (progress < 0.3 || progress > 0.4) { rightArm.position.z = 0; } if (progress > 0.4) { const returnProgress = (progress - 0.4) / 0.6; rightArm.rotation.x = THREE.MathUtils.lerp(aimPose.rArmX, portArmsPose.rArmX, returnProgress); leftArm.rotation.x = THREE.MathUtils.lerp(aimPose.lArmX, portArmsPose.lArmX, returnProgress); head.rotation.x = THREE.MathUtils.lerp(aimPose.headX + 0.03, portArmsPose.headX, returnProgress); } return false; },
            death: (alien, progress) => { const { torso, leftLeg, rightLeg, leftArm, rightArm } = alien.userData; const p = Math.min(1, progress * progress); alien.position.y = THREE.MathUtils.lerp(1.4, 1.4 - 0.8, p); torso.rotation.x = THREE.MathUtils.lerp(0, -Math.PI / 2.5, p); torso.rotation.z = THREE.MathUtils.lerp(0, Math.PI / 8, p); leftLeg.rotation.x = THREE.MathUtils.lerp(0, -Math.PI/2, p); rightLeg.rotation.x = THREE.MathUtils.lerp(0, -Math.PI/3, p); leftArm.rotation.z = THREE.MathUtils.lerp(0, Math.PI, p); rightArm.rotation.z = THREE.MathUtils.lerp(0, -Math.PI, p); }
        }
    },
    stingray: {
        name: 'Skyray Bomber',
        description: 'A massive, high-altitude bomber that drops powerful explosives.',
        levels: ['desert'],
        spawnWeight: 0.1,
        properties: { health: 15, score: 75, spawnY: () => Math.random() * 20 + 80, sightRange: 300, attackCooldown: 5.0, speed: 15, bombDropRate: 0.5 },
        model: () => {
            const g = new THREE.Group(); const bodyMat = new THREE.MeshStandardMaterial({color: 0x5d5d7a, metalness: 0.9, roughness: 0.3}); const shape = new THREE.Shape(); shape.moveTo(0,-8); shape.quadraticCurveTo(8, -4, 10, 0); shape.quadraticCurveTo(8, 4, 0, 8); shape.quadraticCurveTo(-8, 4, -10, 0); shape.quadraticCurveTo(-8, -4, 0, -8); const extrudeSettings = { depth: 0.5, bevelEnabled: true, bevelThickness: 0.5, bevelSize: 0.5, bevelSegments: 2 }; const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings); const body = new THREE.Mesh(geo, bodyMat); body.rotation.x = Math.PI/2; g.add(body); const eyeMat = new THREE.MeshStandardMaterial({color:0xff2200, emissive:0xff2200}); const eye = new THREE.Mesh(new THREE.SphereGeometry(0.8), eyeMat); eye.position.set(0, 0.5, 6); g.add(eye); g.scale.set(1.5,1.5,1.5); return g;
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
            // FIXED: Set spawnY to a negative value so the tentacle starts underground.
            // This is crucial for the "emerge" animation to be visible.
            spawnY: -20, 
            attackRange: 25, 
            attackDamage: 30, 
            emergeSpeed: 10, 
            hitCooldown: 1.5, 
            attackImpulse: 15,
            // FIXED: Added an initial attackCooldown. Without this, the tentacle's
            // state machine would never start and it would be stuck in the 'idle' state.
            attackCooldown: 5.0 
        },
        model: () => {
            const g = new THREE.Group();
            const mat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.2, metalness: 0.8 });
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
        properties: { health: 4, score: 20, spawnY: 0.2, speed: 6, attackRange: 2.0, attackDamage: 0.5, attackCooldown: 1.5 },
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
                    worm.userData.angle += worm.userData.speed * 0.016; // delta approximation
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
        properties: { health: 6, score: 30, speed: 5, spawnY: 1.0, attackRange: 35, attackCooldown: 2.0, projectileSpeed: 40 },
        model: () => {
            const group = new THREE.Group();
            const mat = new THREE.MeshStandardMaterial({ color: 0xeeccff, metalness: 0.6, roughness: 0.2, emissive: 0xaa88ff, emissiveIntensity: 0.4 });
            const body = new THREE.Mesh(new THREE.IcosahedronGeometry(1.0, 1), mat);
            group.add(body);
            for (let i = 0; i < 8; i++) {
                const spike = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.8, 4), mat);
                const vertex = new THREE.Vector3().fromBufferAttribute(body.geometry.attributes.position, Math.floor(Math.random() * body.geometry.attributes.position.count));
                spike.position.copy(vertex);
                spike.lookAt(0, 0, 0);
                spike.position.multiplyScalar(1.2);
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
        spawnWeight: 0, // Does not spawn naturally
        properties: { health: 1, score: 5, speed: 10, spawnY: 0.5 },
        model: () => {
            const group = new THREE.Group();
            const mat = new THREE.MeshStandardMaterial({ color: 0xeeccff, metalness: 0.6, roughness: 0.2, emissive: 0x9966cc, emissiveIntensity: 0.8 });
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
    }
};

function spawnShardMites(position) {
    const count = 5; // Spawn 5 to 5 mites
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
            alien.castShadow = true;
            alien.userData.type = selectedEnemy.type;
            alien.userData.velocity = new THREE.Vector3((Math.random() - 0.5) * 4, 0, (Math.random() - 0.5) * 4);
            alien.userData.state = 'idle';
            alien.userData.attackCooldown = typeof selectedEnemy.data.properties.attackCooldown === 'function' ? selectedEnemy.data.properties.attackCooldown() : selectedEnemy.data.properties.attackCooldown;
            alien.userData.health = selectedEnemy.data.properties.health;
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

function createAlienDebris(position, color) {
    const n = Math.floor(Math.random() * 6) + 5; const g = new THREE.BoxGeometry(0.2, 0.2, 0.2);
    const m = new THREE.MeshStandardMaterial({ color: color, emissive: color, emissiveIntensity: 2.5 });
    for (let i = 0; i < n; i++) {
        const d = new THREE.Mesh(g, m); d.position.copy(position);
        const v = new THREE.Vector3( (Math.random() - 0.5) * 10, Math.random() * 8 + 4, (Math.random() - 0.5) * 10 );
        alienDebris.push({ mesh: d, velocity: v, lifetime: 2.0 }); scene.add(d);
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
        const distanceToPlayer = alien.position.distanceTo(playerTarget.position);
        
        if(data.attackCooldown > 0) data.attackCooldown -= delta;
        if(data.hitCooldown > 0) data.hitCooldown -= delta;

        // --- NEW: ENEMY vs ENEMY COLLISION ---
        for (let j = i - 1; j >= 0; j--) {
            const otherAlien = aliens[j];
            const dist = alien.position.distanceTo(otherAlien.position);
            const requiredDist = 2.0; // Minimum distance between alien centers
            if (dist < requiredDist) {
                const pushVector = new THREE.Vector3().subVectors(alien.position, otherAlien.position).normalize();
                const pushAmount = (requiredDist - dist) * 0.5;
                alien.position.add(pushVector.clone().multiplyScalar(pushAmount));
                otherAlien.position.sub(pushVector.clone().multiplyScalar(pushAmount));
            }
        }
        
        // Invisibility check
        if (player.carriedObject && player.carriedObject.userData.key === 'glowing_orb') {
            data.state = 'idle'; // Force idle state
            data.velocity.multiplyScalar(0.95); // Slow down
            const deltaPos = data.velocity.clone().multiplyScalar(delta);
            handleEnemyCollision(alien, deltaPos); // Still handle collision
            continue; // Skip all targeting logic
        }

        switch(data.type) {
            case 'shard_roller':
            case 'shard_mite':
                if (distanceToPlayer < 40) {
                    const dir = new THREE.Vector3().subVectors(playerTarget.position, alien.position).normalize();
                    data.velocity.lerp(dir.multiplyScalar(enemyProps.speed), 0.05);
                }
                if (distanceToPlayer < 1.5) {
                    health = Math.max(0, health - 5);
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
            case 'worm_swarm':
                enemyDef.animations.swirl(alien, clock.getElapsedTime());
                alien.lookAt(playerTarget.position.x, alien.position.y, playerTarget.position.z);
                if (distanceToPlayer < enemyProps.attackRange && data.attackCooldown <= 0) {
                    health = Math.max(0, health - enemyProps.attackDamage);
                    wormAttackOverlay.style.opacity = 1;
                    setTimeout(()=> { wormAttackOverlay.style.opacity = 0; }, 200);
                    data.attackCooldown = enemyProps.attackCooldown;
                } else if (distanceToPlayer < 40) {
                    const dir = new THREE.Vector3().subVectors(playerTarget.position, alien.position).normalize();
                    data.velocity.lerp(dir.multiplyScalar(enemyProps.speed), 0.1);
                }
                break;
            case 'tentacle':
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
                // FIXED: This 'continue' is CRITICAL. It stops the generic collision/movement code
                // below from running on the tentacle, which would prevent it from moving through the ground.
                continue;
            case 'stingray':
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
            case 'cyborg':
                if (data.state === 'dying') { data.animationProgress += delta * 0.7; enemyDef.animations.death(alien, data.animationProgress); if (data.animationProgress >= 1) { scene.remove(alien); aliens.splice(i, 1); score += enemyProps.score; } continue; } alien.lookAt(playerTarget.position.x, alien.position.y, playerTarget.position.z); if (distanceToPlayer < enemyProps.attackRange && data.attackCooldown <= 0 && data.state !== 'shooting') { data.state = 'shooting'; data.animationProgress = 0; data.hasFiredInThisShot = false; data.attackCooldown = typeof enemyProps.attackCooldown === 'function' ? enemyProps.attackCooldown() : enemyProps.attackCooldown; } else if (data.state !== 'shooting') { if (distanceToPlayer > enemyProps.sightRange) data.state = 'idle'; else data.state = 'chasing'; } switch(data.state) { case 'idle': enemyDef.animations.idle(alien); break; case 'chasing': enemyDef.animations.walk(alien, clock.getElapsedTime()); const dir = new THREE.Vector3().subVectors(playerTarget.position, alien.position).normalize(); data.velocity.lerp(dir.multiplyScalar(2), 0.1); break; case 'shooting': const didFire = enemyDef.animations.shoot(alien, data.animationProgress); if (didFire) { const startPos = new THREE.Vector3(); alien.userData.rifleBarrel.getWorldPosition(startPos); const fireDir = new THREE.Vector3().subVectors(playerTarget.position, startPos).normalize(); const proj = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 8), new THREE.MeshBasicMaterial({color: 0xff0000, emissive: 0xff0000, emissiveIntensity: 3})); proj.position.copy(startPos); proj.userData.velocity = fireDir.multiplyScalar(enemyProps.projectileSpeed); cyborgProjectiles.push(proj); scene.add(proj); playSound('cyborg_shoot'); } data.animationProgress += delta * 2.0; if (data.animationProgress >= 1) data.state = 'chasing'; break; }
                break;
            case 'ground':
                const enemyDefAnims = GameData.enemies.ground.animations;
                const onGround = alien.position.y <= enemyProps.spawnY + 0.01;
                switch (data.state) {
                    case 'idle': if (distanceToPlayer < enemyProps.sightRange) { data.state = 'chase'; } if (enemyDefAnims) enemyDefAnims.idle(alien, clock.getElapsedTime()); data.velocity.x *= 0.8; data.velocity.z *= 0.8; break;
                    case 'chase': alien.lookAt(playerTarget.position.x, alien.position.y, playerTarget.position.z); const dirToPlayer = new THREE.Vector3().subVectors(playerTarget.position, alien.position).normalize(); data.velocity.lerp(dirToPlayer.multiplyScalar(enemyProps.chaseSpeed), 0.1); if (enemyDefAnims) enemyDefAnims.walk(alien, clock.getElapsedTime()); if (distanceToPlayer < enemyProps.pounceRange && data.attackCooldown <= 0 && onGround) { data.state = 'pounce'; data.pounceTimer = enemyProps.pounceWindUp; data.velocity.set(0, 0, 0); } break;
                    case 'pounce': if (enemyDefAnims) enemyDefAnims.pounce(alien); alien.lookAt(playerTarget.position.x, alien.position.y, playerTarget.position.z); data.pounceTimer -= delta; if (data.pounceTimer <= 0) { const pounceDir = new THREE.Vector3().subVectors(playerTarget.position, alien.position); pounceDir.y = 0; pounceDir.normalize().multiplyScalar(enemyProps.pounceForce); pounceDir.y = enemyProps.pounceLift; data.velocity.copy(pounceDir); data.state = 'leaping'; data.attackCooldown = enemyProps.pounceCooldown; } break;
                    case 'leaping': if (enemyDefAnims) enemyDefAnims.leap(alien); if ((player.state === 'on_foot' || player.state === 'driving_motorcycle') && distanceToPlayer < 1.8) { health = Math.max(0, health - enemyProps.pounceDamage); playSound('player_damage'); data.velocity.multiplyScalar(-0.5); data.state = 'idle'; } if (onGround && data.velocity.y < 0) { data.state = 'idle'; } break;
                }
                data.velocity.y -= GRAVITY * delta;
                break;
            case 'flyer':
                 const hoverPointFlyer = playerTarget.position.clone().add(new THREE.Vector3(0, 10, 0)); const directionToHover = new THREE.Vector3().subVectors(hoverPointFlyer, alien.position).normalize(); data.velocity.lerp(directionToHover.multiplyScalar(5), 0.05); if(distanceToPlayer < enemyProps.sightRange && data.attackCooldown <= 0) { const projectile = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 8), new THREE.MeshBasicMaterial({ color: 0xcc00ff, emissive: 0xcc00ff, emissiveIntensity: 2 })); projectile.position.copy(alien.position); projectile.userData.velocity = new THREE.Vector3().subVectors(playerTarget.position, alien.position).normalize().multiplyScalar(enemyProps.projectileSpeed); alienProjectiles.push(projectile); scene.add(projectile); data.attackCooldown = enemyProps.attackCooldown; }
                alien.lookAt(playerTarget.position);
                break;
        }

        const deltaPos = data.velocity.clone().multiplyScalar(delta);
        handleEnemyCollision(alien, deltaPos);
        
        if((data.type === 'ground' || data.type === 'worm_swarm' || data.type === 'shard_roller' || data.type === 'shard_mite') && alien.position.y < enemyProps.spawnY) {
            alien.position.y = enemyProps.spawnY;
             if (data.state !== 'leaping') {
                 data.velocity.y = 0;
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
                health = Math.max(0, health - 10); playSound('player_damage');
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
            health = Math.max(0, health - 15); playSound('player_damage'); damageFlashElement.style.opacity = 0.5;
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
                 hit = true;
            }
        }
        if (hit) {
            createExplosion(b.position, 10); scene.remove(b); bombs.splice(i, 1);
        }
    }
}
function updateDebris(delta) { for (let i = alienDebris.length - 1; i >= 0; i--) { const p = alienDebris[i]; p.velocity.y -= GRAVITY * 0.5 * delta; p.mesh.position.add(p.velocity.clone().multiplyScalar(delta)); p.lifetime -= delta; if (p.lifetime <= 0) { scene.remove(p.mesh); alienDebris.splice(i, 1); } } }
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
            health = Math.max(0, health - 10); playSound('player_damage');
            createHitScatter(p.position, 0xeeccff);
            scene.remove(p); shardProjectiles.splice(i, 1);
        } else if (p.position.y < -10) {
            scene.remove(p); shardProjectiles.splice(i, 1);
        }
    }
}