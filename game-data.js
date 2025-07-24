const GameData = {
    // Helper to create a capsule mesh for cyborgs
    _createCapsuleMesh: (radius, length, material) => {
        const group = new THREE.Group();
        const cylinder = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, length), material);
        const sphere1 = new THREE.Mesh(new THREE.SphereGeometry(radius, 16, 8), material);
        sphere1.position.y = length / 2;
        const sphere2 = sphere1.clone();
        sphere2.position.y = -length / 2;
        group.add(cylinder, sphere1, sphere2);
        return group;
    },

    items: {
        jetpack: {
            name: 'Jetpack',
            description: 'Allows for sustained flight. Fuel recharges when on the ground.',
            levels: ['city', 'desert', 'volcanic', 'ice', 'toxic', 'crystal'],
            spawnFrequency: 1,
            respawnTime: 20000,
            model: () => {
                const group = new THREE.Group();
                const whiteMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 });
                const body = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1, 0.8), whiteMaterial);
                group.add(body);
                const thrusterL = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 1.2, 16), whiteMaterial);
                thrusterL.position.x = -0.5;
                const thrusterR = thrusterL.clone();
                thrusterR.position.x = 0.5;
                group.add(thrusterL, thrusterR);
                return group;
            },
            hudIcon: (ctx) => {
                ctx.fillStyle = 'rgb(200, 200, 200)'; ctx.fillRect(10, 5, 30, 40); ctx.fillStyle = 'rgb(180, 180, 180)'; ctx.fillRect(2, 20, 8, 28); ctx.fillRect(40, 20, 8, 28);
            }
        },
        health: {
            name: 'Health Pack',
            description: 'Restores a small amount of health.',
            levels: ['city', 'desert', 'volcanic', 'ice', 'toxic', 'crystal'],
            spawnFrequency: 5,
            respawnTime: 15000,
            properties: { amount: 25 },
            model: () => {
                const group = new THREE.Group(); const redMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 }); const whiteMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xcccccc, emissiveIntensity: 1.0 }); const pack = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.2), whiteMaterial); group.add(pack); const crossH = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.3, 0.22), redMaterial); const crossV = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.1, 0.22), redMaterial); group.add(crossH, crossV); return group;
            },
            hudIcon: (ctx) => {
                ctx.fillStyle = 'rgb(255, 255, 255)'; ctx.fillRect(0, 0, 50, 50); ctx.fillStyle = 'rgb(255, 0, 0)'; ctx.fillRect(10, 20, 30, 10); ctx.fillRect(20, 10, 10, 30);
            }
        },
        fuel_cell: {
            name: 'Fuel Cell',
            description: 'A power source for advanced technology. Required to launch the spacecraft.',
            levels: ['city', 'desert', 'volcanic', 'ice', 'toxic', 'crystal'],
            spawnFrequency: 2,
            respawnTime: 60000,
            model: () => {
                const group = new THREE.Group();
                const capsuleMat = new THREE.MeshStandardMaterial({ color: 0xbbbbbb, metalness: 0.9, roughness: 0.3 });
                const cylinder = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.8, 16), capsuleMat);
                const sphere1 = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 8), capsuleMat);
                sphere1.position.y = 0.4;
                const sphere2 = sphere1.clone();
                sphere2.position.y = -0.4;
                group.add(cylinder, sphere1, sphere2);
                const coreMat = new THREE.MeshStandardMaterial({ color: 0x00ffff, emissive: 0x00ffff, emissiveIntensity: 3.0 });
                const core = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.7, 12), coreMat);
                group.add(core);
                group.scale.setScalar(1.2);
                return group;
            },
            hudIcon: (ctx) => {
                ctx.fillStyle = '#00ff88'; ctx.fillRect(15, 5, 20, 40); ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.fillRect(15, 5, 20, 5); ctx.fillRect(15, 40, 20, 5);
            }
        },
        glowing_orb: {
            name: 'Glowing Orb',
            description: 'A mysterious alien artifact. Enemies seem to ignore whoever carries it.',
            levels: ['volcanic', 'crystal'],
            spawnFrequency: 10,
            respawnTime: 25000,
            model: () => {
                const g = new THREE.Group();
                const m = new THREE.MeshStandardMaterial({color:0x00ffff, emissive:0x00ffff, emissiveIntensity:2, transparent:true, opacity:0.8});
                const s = new THREE.Mesh(new THREE.SphereGeometry(0.4, 16, 12), m);
                g.add(s);
                return g;
            }
        },
        xray_goggles: {
            name: 'X-Ray Goggles',
            description: 'See enemies and key items through walls. Toggle in inventory.',
            levels: ['city', 'desert', 'ice', 'toxic', 'crystal'],
            spawnFrequency: 1,
            respawnTime: 120000,
            properties: { isToggleable: true },
            model: () => {
                const group = new THREE.Group();
                const frameMat = new THREE.MeshStandardMaterial({color: 0x333333, roughness: 0.2});
                const lensMat = new THREE.MeshStandardMaterial({color: 0x111111, metalness: 1.0, roughness: 0.1});

                const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.1, 0.1), frameMat);
                group.add(bridge);

                for(let i=-1; i<=1; i+=2) {
                    const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.1, 32), lensMat);
                    lens.rotation.x = Math.PI / 2;
                    lens.position.x = i * 0.35;
                    group.add(lens);
                    
                    const strap = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.5), frameMat);
                    strap.position.set(i * 0.6, 0, -0.2);
                    group.add(strap);
                }
                group.scale.setScalar(0.8);
                return group;
            }
        },
        ammo_shotgun: {
            name: 'Shotgun Ammo',
            description: 'A box of shells for the shotgun.',
            levels: ['city', 'desert', 'volcanic', 'ice', 'toxic', 'crystal'],
            spawnFrequency: 3,
            respawnTime: 12000,
            properties: { ammoType: 'shotgun', amount: 8 },
            model: () => {
                const g = new THREE.Group(); const box = new THREE.Mesh(new THREE.BoxGeometry(0.4,0.2,0.3), new THREE.MeshStandardMaterial({color:0x442211})); g.add(box); for(let i=-0.1; i<=0.1; i+=0.1) { const s=new THREE.Mesh(new THREE.CylinderGeometry(0.04,0.04,0.25,8), new THREE.MeshStandardMaterial({color:0xcc0000})); s.rotation.x=Math.PI/2; s.position.set(i,0.1,0); g.add(s);} return g;
            }
        },
        ammo_machinegun: {
            name: 'Machinegun Ammo',
            description: 'A magazine of bullets for the machine gun.',
            levels: ['city', 'desert', 'volcanic', 'ice', 'toxic', 'crystal'],
            spawnFrequency: 3,
            respawnTime: 12000,
            properties: { ammoType: 'machinegun', amount: 60 },
            model: () => new THREE.Mesh(new THREE.BoxGeometry(0.5,0.2,0.3), new THREE.MeshStandardMaterial({color:0x333333}))
        },
        ammo_rocket: {
            name: 'Rocket Ammo',
            description: 'A rack of rockets for the rocket launcher.',
            levels: ['city', 'desert', 'volcanic', 'ice', 'toxic', 'crystal'],
            spawnFrequency: 2,
            respawnTime: 12000,
            properties: { ammoType: 'rocket', amount: 5 },
            model: () => {
                const g = new THREE.Group(); const b = new THREE.Mesh(new THREE.CylinderGeometry(0.08,0.08,0.7,12), new THREE.MeshStandardMaterial({color:0x555})); g.add(b); const t = new THREE.Mesh(new THREE.ConeGeometry(0.08,0.2,12), new THREE.MeshStandardMaterial({color:0xcc4444})); t.position.y=0.45; g.add(t); g.rotation.z=Math.PI/2; return g;
            }
        },
        ammo_plasma: {
            name: 'Plasma Ammo',
            description: 'A charged battery for the plasma gun.',
            levels: ['city', 'desert', 'volcanic', 'ice', 'toxic', 'crystal'],
            spawnFrequency: 3,
            respawnTime: 12000,
            properties: { ammoType: 'plasma', amount: 30 },
            model: () => new THREE.Mesh(new THREE.CylinderGeometry(0.15,0.15,0.4,16), new THREE.MeshStandardMaterial({color:0xff00ff, emissive:0xff00ff, emissiveIntensity:1, transparent:true, opacity:0.7}))
        },
        ammo_grenade: {
            name: 'Grenade Ammo',
            description: 'A pack of grenades for the grenade launcher.',
            levels: ['city', 'desert', 'volcanic', 'ice', 'toxic', 'crystal'],
            spawnFrequency: 2,
            respawnTime: 12000,
            properties: { ammoType: 'grenade', amount: 3 },
            model: () => {
                const g = new THREE.Group(); for(let i=0; i<3; i++) { const gr=new THREE.Mesh(new THREE.SphereGeometry(0.1,12,8), new THREE.MeshStandardMaterial({color:0xde651e})); gr.position.set((i-1)*0.2,0,0); g.add(gr);} return g;
            }
        },
        ammo_sniper: {
            name: 'Sniper Ammo',
            description: 'High-caliber rounds for the sniper rifle.',
            levels: ['city', 'desert', 'ice'],
            spawnFrequency: 2,
            respawnTime: 20000,
            properties: { ammoType: 'sniper', amount: 5 },
            model: () => {
                 const g = new THREE.Group(); 
                 const b = new THREE.Mesh(new THREE.CylinderGeometry(0.05,0.05,0.5,8), new THREE.MeshStandardMaterial({color:0x777766})); 
                 g.add(b); 
                 const t = new THREE.Mesh(new THREE.ConeGeometry(0.05,0.15,8), new THREE.MeshStandardMaterial({color:0x999977})); 
                 t.position.y = 0.325; 
                 g.add(t); 
                 g.rotation.z = Math.PI / 2;
                 return g;
            }
        },
        ammo_blackhole: {
            name: 'Singularity Canister',
            description: 'A contained singularity for the Black Hole Gun.',
            levels: ['crystal'],
            spawnFrequency: 1,
            respawnTime: 60000,
            properties: { ammoType: 'blackhole', amount: 1 },
            model: () => {
                const g = new THREE.Group();
                const containerMat = new THREE.MeshStandardMaterial({color: 0xcccccc, transparent: true, opacity: 0.4, roughness: 0.1});
                const container = new THREE.Mesh(new THREE.SphereGeometry(0.3, 16, 12), containerMat);
                g.add(container);
                const core = new THREE.Mesh(new THREE.IcosahedronGeometry(0.15, 1), new THREE.MeshBasicMaterial({color:0x000000}));
                g.add(core);
                return g;
            }
        }
    },
    vehicles: {
        motorcycle: {
            name: 'Hoverbike',
            description: 'A fast and agile hoverbike for quickly traversing open terrain.',
            levels: ['desert'],
            properties: { speed: 200, turnSpeed: 3, hoverHeight: 0.8, damping: 0.95, jumpForce: 15.0 },
            model: () => {
                const g = new THREE.Group();
                const bodyMat = new THREE.MeshStandardMaterial({color:0xdd4444, metalness:0.8, roughness:0.4});
                const darkMat = new THREE.MeshStandardMaterial({color:0x222222});
                
                const body = GameData._createCapsuleMesh(0.5, 3.0, bodyMat);
                body.rotation.x = Math.PI / 2;
                body.position.y = 0.5;
                g.add(body);

                const seat = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.3, 1.5), darkMat);
                seat.position.set(0, 0.8, -0.5);
                g.add(seat);

                const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.2, 8), darkMat);
                handle.rotation.z = Math.PI/2;
                handle.position.set(0, 1.0, 1.5);
                g.add(handle);
                
                const thruster = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.4, 0.8, 12), darkMat);
                thruster.position.set(0, 0.5, -2.0);
                g.add(thruster);

                return g;
            }
        }
    }
};