/* ==========================================================================
   Pawly / Widgetable 3D Clay Heart Engine (Three.js WebGL)
   Tactile Spring Physics • Touch Squish & Stretch • 3D Burst Particles
   ========================================================================== */

import * as THREE from './three.module.js';

export class MissYou3DScene {
  constructor(container, options = {}) {
    this.container = typeof container === 'string' ? document.querySelector(container) : container;
    this.options = Object.assign({
      hero: false,
      color: 0xFF4D79,
      highlightColor: 0xFFAEC0,
      scaleMultiplier: options.hero ? 1.2 : 0.95
    }, options);

    if (!this.container) return;

    this.width = this.container.clientWidth || (this.options.hero ? 220 : 130);
    this.height = this.container.clientHeight || (this.options.hero ? 200 : 120);

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(40, this.width / this.height, 0.1, 100);
    this.camera.position.set(0, 0, 6.2);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

    this.container.innerHTML = '';
    this.container.appendChild(this.renderer.domElement);

    // Spring Physics States (X, Y, Z)
    this.scale = { x: 1, y: 1, z: 1 };
    this.targetScale = { x: 1, y: 1, z: 1 };
    this.velocity = { x: 0, y: 0, z: 0 };
    this.stiffness = 0.22;
    this.damping = 0.72;

    // Pointer Interaction LookAt
    this.pointer = { x: 0, y: 0 };
    this.targetRotation = { x: 0, y: 0 };

    this.clock = new THREE.Clock();
    this.burstParticles = [];
    this.syncGlow = false;

    this.setupLighting();
    this.createHeartModel();
    this.bindEvents();
    this.animate();
  }

  setupLighting() {
    const ambient = new THREE.AmbientLight(0xFFF7F2, 1.3);
    this.scene.add(ambient);

    // Warm Sun Directional Light
    const sunLight = new THREE.DirectionalLight(0xFFFFFF, 1.25);
    sunLight.position.set(3, 4, 5);
    this.scene.add(sunLight);

    // Soft Rim Light for Claymorphic 3D Depth
    this.rimLight = new THREE.PointLight(0xFF94AF, 1.2, 12);
    this.rimLight.position.set(-3, -2, 3);
    this.scene.add(this.rimLight);

    // Front soft fill
    const fillLight = new THREE.DirectionalLight(0xFFE3EB, 0.6);
    fillLight.position.set(0, -3, 4);
    this.scene.add(fillLight);
  }

  createHeartModel() {
    this.heartGroup = new THREE.Group();

    // Sculpted 3D Puffy Clay Heart Geometry
    const shape = new THREE.Shape();
    const x = 0, y = 0;
    shape.moveTo(x, y + 0.85);
    shape.bezierCurveTo(x + 0.38, y + 1.45, x + 1.32, y + 1.45, x + 1.32, y + 0.72);
    shape.bezierCurveTo(x + 1.32, y + 0.12, x + 0.72, y - 0.52, x, y - 1.25);
    shape.bezierCurveTo(x - 0.72, y - 0.52, x - 1.32, y + 0.12, x - 1.32, y + 0.72);
    shape.bezierCurveTo(x - 1.32, y + 1.45, x - 0.38, y + 1.45, x, y + 0.85);

    const extrudeSettings = {
      depth: 0.38,
      bevelEnabled: true,
      bevelSegments: 9,
      steps: 3,
      bevelSize: 0.32,
      bevelThickness: 0.32
    };

    const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    geometry.center();

    // PBR Soft Matte Clay Material
    this.heartMaterial = new THREE.MeshStandardMaterial({
      color: this.options.color,
      roughness: 0.28,
      metalness: 0.08
    });

    this.heartMesh = new THREE.Mesh(geometry, this.heartMaterial);
    this.heartGroup.add(this.heartMesh);

    // Subtle Soft Ground Radial Shadow
    const shadowGeo = new THREE.PlaneGeometry(2.4, 0.8);
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(64, 32, 0, 64, 32, 56);
    grad.addColorStop(0, 'rgba(255, 101, 132, 0.28)');
    grad.addColorStop(0.6, 'rgba(255, 101, 132, 0.10)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 128, 64);

    const shadowTex = new THREE.CanvasTexture(canvas);
    const shadowMat = new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      depthWrite: false
    });
    this.shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    this.shadowMesh.position.set(0, -1.6, -0.2);
    this.shadowMesh.rotation.x = -0.15;
    this.heartGroup.add(this.shadowMesh);

    const baseScale = this.options.scaleMultiplier || 1;
    this.heartGroup.scale.set(baseScale, baseScale, baseScale);
    this.scene.add(this.heartGroup);
  }

  // Dokunsal Tıklama / Pompalanma Yay Fiziği (Tactile Spring Squish)
  triggerTapPulse(intensity = 1.0) {
    // Derin dikey ezilme ve yatay genleşme
    const squishY = Math.max(0.55, 0.72 - (intensity - 1) * 0.05);
    const bulgeXZ = Math.min(1.45, 1.28 + (intensity - 1) * 0.05);

    this.scale.y = squishY;
    this.scale.x = bulgeXZ;
    this.scale.z = bulgeXZ;

    // Anlık yay hız ivmesi ver
    this.velocity.y = -0.35 * intensity;
    this.velocity.x = 0.25 * intensity;
    this.velocity.z = 0.25 * intensity;

    // 3D Uçuşan Minik Kalp Parçacıkları Püskürt
    this.spawnBurstParticles(Math.min(12, Math.floor(4 * intensity)));
  }

  // 3D Parçacık Yağmuru / Püskürmesi
  spawnBurstParticles(count = 5) {
    const geo = new THREE.SphereGeometry(0.12, 8, 8);
    for (let i = 0; i < count; i++) {
      const mat = new THREE.MeshStandardMaterial({
        color: Math.random() > 0.4 ? 0xFF6584 : 0xFFB6C1,
        roughness: 0.3,
        transparent: true,
        opacity: 0.95
      });
      const p = new THREE.Mesh(geo, mat);
      p.position.set(
        (Math.random() - 0.5) * 0.8,
        (Math.random() - 0.3) * 0.5,
        (Math.random() - 0.5) * 0.6
      );
      const vel = new THREE.Vector3(
        (Math.random() - 0.5) * 2.8,
        1.8 + Math.random() * 2.5,
        (Math.random() - 0.5) * 2.0
      );
      this.burstParticles.push({ mesh: p, vel, life: 1.0, rotSpeed: (Math.random() - 0.5) * 5 });
      this.scene.add(p);
    }
  }

  // Çift Kalp Senkronizasyon Parıltısı
  setHeartSync(active = true) {
    this.syncGlow = active;
    if (active) {
      this.heartMaterial.color.setHex(0xFF3366);
      this.rimLight.color.setHex(0xFFD700); // Altın ışıma
      this.rimLight.intensity = 2.4;
    } else {
      this.heartMaterial.color.setHex(this.options.color);
      this.rimLight.color.setHex(0xFF94AF);
      this.rimLight.intensity = 1.2;
    }
  }

  bindEvents() {
    const dom = this.renderer.domElement;

    // Mouse / Touch Pointer Takibi
    const handleMove = (clientX, clientY) => {
      const rect = dom.getBoundingClientRect();
      const x = ((clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((clientY - rect.top) / rect.height) * 2 - 1);
      this.targetRotation.y = x * 0.45;
      this.targetRotation.x = -y * 0.35;
    };

    dom.addEventListener('mousemove', (e) => handleMove(e.clientX, e.clientY));
    dom.addEventListener('touchmove', (e) => {
      if (e.touches && e.touches[0]) handleMove(e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: true });

    dom.addEventListener('mouseleave', () => {
      this.targetRotation.x = 0;
      this.targetRotation.y = 0;
    });

    // Pencere yeniden boyutlanması
    window.addEventListener('resize', () => {
      if (!this.container || !this.renderer) return;
      const w = this.container.clientWidth;
      const h = this.container.clientHeight;
      if (w > 0 && h > 0) {
        this.camera.aspect = w / h;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(w, h);
      }
    });
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    const delta = Math.min(this.clock.getDelta(), 0.1);
    const time = this.clock.getElapsedTime();

    if (this.heartGroup) {
      // 1. Doğal Nefes Alma & Nabız Salınımı (Idle Heartbeat Wave)
      const heartbeatBeat = Math.sin(time * 3.2);
      const idlePulse = 1.0 + Math.max(0, heartbeatBeat) * (this.syncGlow ? 0.08 : 0.045);

      // 2. Yay Fiziği Hesaplaması (Damped Spring Physics)
      const k = this.stiffness;
      const d = this.damping;

      const ax = (this.targetScale.x * idlePulse - this.scale.x) * k;
      this.velocity.x = (this.velocity.x + ax) * d;
      this.scale.x += this.velocity.x;

      const ay = (this.targetScale.y * idlePulse - this.scale.y) * k;
      this.velocity.y = (this.velocity.y + ay) * d;
      this.scale.y += this.velocity.y;

      const az = (this.targetScale.z * idlePulse - this.scale.z) * k;
      this.velocity.z = (this.velocity.z + az) * d;
      this.scale.z += this.velocity.z;

      const baseScale = this.options.scaleMultiplier || 1;
      this.heartGroup.scale.set(
        this.scale.x * baseScale,
        this.scale.y * baseScale,
        this.scale.z * baseScale
      );

      // 3. Pürüzsüz Baş/İmleç Eğim Takibi
      this.heartGroup.rotation.y += (this.targetRotation.y - this.heartGroup.rotation.y) * 0.1;
      this.heartGroup.rotation.x += (this.targetRotation.x - this.heartGroup.rotation.x) * 0.1;

      // Senkron ışıldama efekti
      if (this.syncGlow) {
        this.heartGroup.rotation.z = Math.sin(time * 4) * 0.05;
      }
    }

    // 4. Parçacık Fizik Döngüsü (Update Burst Particles)
    for (let i = this.burstParticles.length - 1; i >= 0; i--) {
      const p = this.burstParticles[i];
      p.life -= delta * 1.5;
      if (p.life <= 0) {
        this.scene.remove(p.mesh);
        p.mesh.geometry.dispose();
        p.mesh.material.dispose();
        this.burstParticles.splice(i, 1);
        continue;
      }

      p.mesh.position.addScaledVector(p.vel, delta);
      p.vel.y -= 3.5 * delta; // Yerçekimi
      p.mesh.rotation.x += p.rotSpeed * delta;
      p.mesh.rotation.y += p.rotSpeed * delta;
      p.mesh.scale.setScalar(p.life * 1.2);
      p.mesh.material.opacity = p.life;
    }

    this.renderer.render(this.scene, this.camera);
  }
}

// Global window köprüsü
window.MissYou3DScene = MissYou3DScene;
