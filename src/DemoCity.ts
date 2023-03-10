import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module';
import { gsap, Power1 } from 'gsap';

export default class DemoCity {
	private renderer!: THREE.WebGLRenderer;
	private scene!: THREE.Scene;
	private camera!: THREE.PerspectiveCamera;
	private stats!: any;
	private city!: THREE.Object3D;
	private smoke!: THREE.Object3D;
	private town!: THREE.Object3D;
	private mouse!: THREE.Vector2;
	private createCarPos = true;
	private uSpeed = 0.001;
	private ambientLight!: THREE.AmbientLight;
	private lightFront!: THREE.SpotLight;

	constructor() {
		this.initScene();
		this.initStats();
		this.initListeners();
	}

	addFog() {
		const fogColor = new THREE.Color('#36EBF2');
		this.scene.background = new THREE.Color(fogColor);
		this.scene.fog = new THREE.Fog(fogColor, 10, 16);
	}

	getRandomColor() {
		const colors = [0x000000, 0x000000];
		const randomIndex: number = Math.floor(Math.random() * colors.length);
		return colors[randomIndex];
	}

	mathRandom(num = 8) {
		return -Math.random() * num + Math.random() * num;
	}

	addCity() {
		this.city = new THREE.Object3D();
		this.smoke = new THREE.Object3D();
		this.town = new THREE.Object3D();

		const segments = 2;
		for (let i = 1; i < 100; i++) {
			const geometry = new THREE.BoxGeometry(1, 1, 1, segments, segments, segments);
			const material = new THREE.MeshStandardMaterial({
				color: this.getRandomColor(),
				wireframe: false,
				roughness: 0.1, // set the roughness to 0.1 (smooth)
				side: THREE.DoubleSide,
			});
			const wmaterial = new THREE.MeshLambertMaterial({
				color: 0xffffff,
				wireframe: true,
				transparent: true,
				opacity: 0.03,
				side: THREE.DoubleSide,
			});

			const cube = new THREE.Mesh(geometry, material);
			const floor = new THREE.Mesh(geometry, material);
			const wfloor = new THREE.Mesh(geometry, wmaterial);

			cube.add(wfloor);
			cube.castShadow = true;
			cube.receiveShadow = true;
			cube.rotation.y = 0.1 + Math.abs(this.mathRandom(8));

			floor.scale.y = 0.05; //+mathRandom(0.5);
			cube.scale.y = 0.1 + Math.abs(this.mathRandom(8));

			const cubeWidth = 0.9;
			cube.scale.x = cube.scale.z = cubeWidth + this.mathRandom(1 - cubeWidth);

			cube.position.x = Math.round(this.mathRandom());
			cube.position.z = Math.round(this.mathRandom());

			floor.position.set(cube.position.x, 0 /*floor.scale.y / 2*/, cube.position.z);

			this.town.add(floor);
			this.town.add(cube);
		}
	}

	addParticles() {
		const gmaterial = new THREE.MeshToonMaterial({ color: new THREE.Color('OrangeRed'), side: THREE.DoubleSide });
		const gparticule = new THREE.CircleGeometry(0.01, 3);
		const aparticule = 5;
		for (let h = 1; h < 300; h++) {
			const particule = new THREE.Mesh(gparticule, gmaterial);
			particule.position.set(this.mathRandom(aparticule), this.mathRandom(aparticule), this.mathRandom(aparticule));
			particule.rotation.set(this.mathRandom(), this.mathRandom(), this.mathRandom());
			this.smoke.add(particule);
		}
	}

	addPlane() {
		const pmaterial = new THREE.MeshStandardMaterial({
			color: new THREE.Color('black'),
			side: THREE.DoubleSide,
			roughness: 10,
			metalness: 0.6,
			opacity: 0.9,
			transparent: true,
		});
		const pgeometry = new THREE.PlaneGeometry(60, 60);
		const pelement = new THREE.Mesh(pgeometry, pmaterial);
		pelement.rotation.x = (-90 * Math.PI) / 180;
		pelement.position.y = -0.001;
		pelement.receiveShadow = true;

		this.city.add(pelement);
	}
	addControls() {
		this.mouse = new THREE.Vector2();

		const onMouseMove = (event: any) => {
			event.preventDefault();
			this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
			this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
		};

		const onDocumentTouch = (event: any) => {
			if (event.touches.length == 1) {
				event.preventDefault();
				this.mouse.x = event.touches[0].pageX - window.innerWidth / 2;
				this.mouse.y = event.touches[0].pageY - window.innerHeight / 2;
			}
		};

		window.addEventListener('mousemove', onMouseMove, false);
		window.addEventListener('touchstart', onDocumentTouch, false);
		window.addEventListener('touchmove', onDocumentTouch, false);
	}

	addLights() {
		this.ambientLight = new THREE.AmbientLight(0xffffff, 4);
		this.lightFront = new THREE.SpotLight(0xffffff, 20, 10);
		this.lightFront.rotation.x = (45 * Math.PI) / 180;
		this.lightFront.rotation.z = (-45 * Math.PI) / 180;
		this.lightFront.position.set(5, 5, 5);
		this.lightFront.castShadow = true;
		this.lightFront.shadow.mapSize.width = 6000;
		this.lightFront.shadow.mapSize.height = 6000;
		this.lightFront.penumbra = 0.1;
		this.smoke.position.y = 2;
		this.scene.add(this.ambientLight);
		this.city.add(this.lightFront);
		this.scene.add(this.city);
		this.city.add(this.smoke);
		this.city.add(this.town);
	}

	addGridHelper() {
		const gridHelper = new THREE.GridHelper(60, 120, 0x000000, 0x000000);
		this.city.add(gridHelper);
	}

	addCarLines() {
		const cScale = 0.1;
		const cPos = 20;
		const cColor = new THREE.Color('#FCF500');
		const cMat = new THREE.MeshToonMaterial({ color: cColor, side: THREE.DoubleSide });
		const cGeo = new THREE.BoxGeometry(1, cScale / 40, cScale / 40);
		const cElem = new THREE.Mesh(cGeo, cMat);
		const cAmp = 3;

		if (this.createCarPos) {
			this.createCarPos = false;
			cElem.position.x = -cPos;
			cElem.position.z = this.mathRandom(cAmp);

			gsap.to(cElem.position, 3, { x: cPos, repeat: -1, yoyo: true, delay: this.mathRandom(3) });
		} else {
			this.createCarPos = true;
			cElem.position.x = this.mathRandom(cAmp);
			cElem.position.z = -cPos;
			cElem.rotation.y = (90 * Math.PI) / 180;

			gsap.to(cElem.position, 5, { z: cPos, repeat: -1, yoyo: true, delay: this.mathRandom(3), ease: Power1.easeInOut });
		}
		cElem.receiveShadow = true;
		cElem.castShadow = true;
		cElem.position.y = Math.abs(this.mathRandom(5));
		this.city.add(cElem);
	}

	initStats() {
		this.stats = new (Stats as any)();
		document.body.appendChild(this.stats.dom);
	}

	initScene() {
		this.renderer = new THREE.WebGLRenderer({ antialias: true });
		this.renderer.setSize(window.innerWidth, window.innerHeight);
		if (window.innerWidth > 800) {
			this.renderer.shadowMap.enabled = true;
			this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
			this.renderer.shadowMap.needsUpdate = true;
		}
		document.body.appendChild(this.renderer.domElement);
		this.camera = new THREE.PerspectiveCamera(20, window.innerWidth / window.innerHeight, 1, 500);
		this.camera.position.set(0, 2, 14);
		this.scene = new THREE.Scene();
		this.addFog();
		this.addCity();
		this.addControls();
		this.addLights();
		this.addGridHelper();
		for (let i = 0; i < 60; i++) {
			this.addCarLines();
		}
		this.addParticles();
		this.addPlane();
		this.animate();
	}

	initListeners() {
		const onWindowResize = () => {
			this.camera.aspect = window.innerWidth / window.innerHeight;
			this.camera.updateProjectionMatrix();
			this.renderer.setSize(window.innerWidth, window.innerHeight);
		};
		window.addEventListener('resize', onWindowResize, false);
	}

	// Loop function
	animate() {
		requestAnimationFrame(() => {
			this.animate();
		});
		this.city.rotation.y -= (this.mouse.x * 8 - this.camera.rotation.y) * this.uSpeed;
		this.city.rotation.x -= (-(this.mouse.y * 2) - this.camera.rotation.x) * this.uSpeed;
		if (this.city.rotation.x < -0.05) this.city.rotation.x = -0.05;
		else if (this.city.rotation.x > 1) this.city.rotation.x = 1;
		this.smoke.rotation.y += 0.01;
		this.smoke.rotation.x += 0.01;
		this.camera.lookAt(this.city.position);
		if (this.stats) this.stats.update();
		this.renderer.render(this.scene, this.camera);
	}
}
