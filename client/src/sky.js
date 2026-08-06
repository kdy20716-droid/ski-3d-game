import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.165.0/build/three.module.js';
import { STAGES } from './stages.js';

export const createSky = () => {
  const skyMaterial = new THREE.ShaderMaterial({
    uniforms: {
      uSun: { value: new THREE.Vector3().copy(STAGES[0].sunDir) },
      uTime: { value: 0 },
      uSkyCol: { value: new THREE.Vector3(...STAGES[0].skyCol) },
      uStage: { value: 0.0 },
    },
    vertexShader: /* glsl */`
      varying vec3 vDir;
      void main() {
        vDir = (modelMatrix * vec4(position, 0.0)).xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */`
      uniform vec3 uSun;
      uniform float uTime;
      uniform vec3 uSkyCol;
      uniform float uStage;
      varying vec3 vDir;

      float hash3(vec3 p) {
        p = fract(p * vec3(443.897, 441.423, 437.195));
        p += dot(p, p.yzx + 19.19);
        return fract((p.x + p.y) * p.z);
      }

      void main() {
        vec3 d = normalize(vDir);
        float t = d.y;

        vec3 cHoriz = uSkyCol * 1.35;
        vec3 cMid   = uSkyCol * 0.75;
        vec3 cTop   = uSkyCol * 0.35 + vec3(0.01, 0.01, 0.05);

        vec3 sky = t > 0.2 ? mix(cMid, cTop, smoothstep(0.2, 0.95, t)) : mix(cHoriz, cMid, smoothstep(-0.15, 0.2, t));

        if (uStage >= 7.0) {
          float au = sin(d.x * 4.5 + uTime * 0.6) * cos(d.z * 3.5);
          sky += vec3(0.06, 0.28, 0.22) * smoothstep(0.1, 0.65, t) * max(0.0, au) * smoothstep(7.0, 9.0, uStage);
        }

        float sd = dot(d, uSun);
        float disk = smoothstep(0.9992, 1.0, sd);
        float corona = pow(max(0.0, sd), 24.0) * 0.55;
        vec3 sunColor = uStage >= 7.0 ? vec3(0.7, 0.88, 1.0) * 3.0 : vec3(1.0, 0.88, 0.5) * 4.5;
        sky += sunColor * (disk + corona * 0.5);

        float starMask = smoothstep(0.1, 0.6, t) * (uStage >= 6.5 ? 1.0 : (uStage < 1.5 ? 0.35 : 0.05));
        vec3 sp = floor(d * 280.0);
        float sh = hash3(sp);
        float bright = smoothstep(0.98, 1.0, sh) * starMask;
        sky += vec3(0.95, 0.95, 1.0) * bright * (0.8 + 0.2 * sin(uTime * 3.0 + sh * 30.0));

        gl_FragColor = vec4(sky, 1.0);
      }
    `,
    side: THREE.BackSide, depthWrite: false,
  });

  const skyMesh = new THREE.Mesh(new THREE.SphereGeometry(3000, 32, 16), skyMaterial);
  return { skyMesh, skyMaterial };
};
