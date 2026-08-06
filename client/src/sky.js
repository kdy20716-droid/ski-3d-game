import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.165.0/build/three.module.js';
import { STAGES } from './stages.js';

export const createSky = () => {
  const skyMaterial = new THREE.ShaderMaterial({
    uniforms: {
      uSun:    { value: new THREE.Vector3().copy(STAGES[0].sunDir) },
      uTime:   { value: 0 },
      uSkyCol: { value: new THREE.Vector3(...STAGES[0].skyCol) },
      uStage:  { value: 0.0 },
    },
    vertexShader: /* glsl */`
      varying vec3 vDir;
      void main() {
        vDir = (modelMatrix * vec4(position, 0.0)).xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */`
      uniform vec3  uSun;
      uniform float uTime;
      uniform vec3  uSkyCol;
      uniform float uStage;
      varying vec3  vDir;

      // ─── 해시 / 노이즈 유틸 ─────────────────────────────────────────
      float hash(vec3 p) {
        p = fract(p * vec3(443.897, 441.423, 437.195));
        p += dot(p, p.yzx + 19.19);
        return fract((p.x + p.y) * p.z);
      }

      // 부드러운 3D 값 노이즈 (삼선형 보간)
      float valueNoise(vec3 p) {
        vec3 i = floor(p);
        vec3 f = fract(p);
        vec3 u = f * f * (3.0 - 2.0 * f); // hermite smoothstep

        return mix(
          mix(mix(hash(i + vec3(0,0,0)), hash(i + vec3(1,0,0)), u.x),
              mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), u.x), u.y),
          mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), u.x),
              mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), u.x), u.y),
          u.z
        );
      }

      // fBm (fractal Brownian Motion) — 옥타브를 쌓아 사실적 구름 텍스처 생성
      float fbm(vec3 p) {
        float val  = 0.0;
        float amp  = 0.5;
        float freq = 1.0;
        for (int i = 0; i < 6; i++) {
          val  += amp * valueNoise(p * freq);
          freq *= 2.1;
          amp  *= 0.48;
        }
        return val;
      }

      // ─── 구름 밀도 함수 ─────────────────────────────────────────────
      // dir: 정규화된 하늘 방향벡터, t: d.y (수직 성분)
      float cloudDensity(vec3 dir, float t) {
        // 구름은 지평선 바로 위(t≈0.05) ~ 높은 하늘(t≈0.65) 사이에만 존재
        float vMask = smoothstep(0.04, 0.15, t) * smoothstep(0.75, 0.35, t);
        if (vMask < 0.001) return 0.0;

        // 구름 평면 UV: XZ 방향을 구름 레이어에 투영 + 시간에 따라 천천히 이동
        float scale = 2.5;
        vec3 cp = vec3(dir.x / (t + 0.04), 0.0, dir.z / (t + 0.04)) * scale;
        cp.x += uTime * 0.018; // 구름 이동 (동→서)
        cp.z += uTime * 0.007;

        // 두 레이어의 fBm을 합산해 대형 뭉게구름 + 세부 질감 표현
        float big    = fbm(cp * 0.50 + vec3(3.1, 0.0, 1.7));
        float detail = fbm(cp * 1.35 + vec3(0.0, 0.0, 8.3));
        float raw = big * 0.72 + detail * 0.28;

        // 스테이지 진행에 따라 임계값 상승 → 구름이 서서히 줄어듦
        // stage 0 : threshold 0.36 (구름 가득)
        // stage 4 : threshold 0.54 (절반 정도)
        // stage 5+: threshold 0.72+ (거의 없음, fade-out과 함께 소멸)
        float threshold = mix(0.36, 0.72, smoothstep(0.0, 5.0, uStage));
        float edge      = mix(0.20, 0.12, smoothstep(0.0, 5.0, uStage)); // 경계 부드러움
        float cloud = smoothstep(threshold, threshold + edge, raw);

        return cloud * vMask;
      }

      void main() {
        vec3 d = normalize(vDir);
        float t = d.y;

        // ─── 하늘 그라디언트 ───────────────────────────────────────────
        vec3 cHoriz = uSkyCol * 1.35;
        vec3 cMid   = uSkyCol * 0.75;
        vec3 cTop   = uSkyCol * 0.35 + vec3(0.01, 0.01, 0.05);

        vec3 sky = t > 0.2
          ? mix(cMid, cTop, smoothstep(0.2, 0.95, t))
          : mix(cHoriz, cMid, smoothstep(-0.15, 0.2, t));

        // ─── 오로라 (스테이지 7+) ──────────────────────────────────────
        if (uStage >= 7.0) {
          float au = sin(d.x * 4.5 + uTime * 0.6) * cos(d.z * 3.5);
          sky += vec3(0.06, 0.28, 0.22)
               * smoothstep(0.1, 0.65, t)
               * max(0.0, au)
               * smoothstep(7.0, 9.0, uStage);
        }

        // ─── 태양 디스크 + 코로나 ──────────────────────────────────────
        float sd     = dot(d, uSun);
        float disk   = smoothstep(0.9992, 1.0, sd);
        float corona = pow(max(0.0, sd), 24.0) * 0.55;
        vec3 sunColor = uStage >= 7.0
          ? vec3(0.7, 0.88, 1.0) * 3.0
          : vec3(1.0, 0.88, 0.5) * 4.5;
        sky += sunColor * (disk + corona * 0.5);

        // ─── 별 (밤/저녁 스테이지) ────────────────────────────────────
        float starMask = smoothstep(0.1, 0.6, t)
                       * (uStage >= 6.5 ? 1.0 : (uStage < 1.5 ? 0.35 : 0.05));
        vec3 sp = floor(d * 280.0);
        float sh = hash(sp);
        float bright = smoothstep(0.98, 1.0, sh) * starMask;
        sky += vec3(0.95, 0.95, 1.0) * bright * (0.8 + 0.2 * sin(uTime * 3.0 + sh * 30.0));

        // ─── 사실적 구름 합성 ─────────────────────────────────────────
        // stage 0~1: 구름 가득 (흐린 맑은 날 느낌)
        // stage 2~4: 점점 맑아짐 (threshold 상승으로 구름 줄어듦)
        // stage 5  : 황혼 — 구름 거의 사라지며 노을빛으로 물듦
        // stage 6+ : 붉은 석양/초저녁 — 구름 완전히 사라짐
        float cloudVisible = 1.0 - smoothstep(5.0, 6.2, uStage);

        if (cloudVisible > 0.001 && t > 0.03) {
          float density = cloudDensity(d, t);

          if (density > 0.001) {
            // 구름 색상: 태양 방향에 따라 밝은 흰색~따뜻한 크림
            float sunUp = max(0.0, uSun.y);
            vec3 cloudLit    = mix(vec3(1.0, 0.88, 0.72), vec3(1.0, 0.97, 0.93), sunUp);
            vec3 cloudShadow = mix(vec3(0.50, 0.38, 0.48), vec3(0.70, 0.74, 0.84), sunUp);

            // 태양 쪽 방향이면 더 밝게 (실루엣 조명)
            float sunFace = dot(normalize(vec3(d.x, 0.0, d.z)), normalize(vec3(uSun.x, 0.0, uSun.z)));
            sunFace = smoothstep(-0.3, 0.8, sunFace);

            vec3 cloudCol = mix(cloudShadow, cloudLit, sunFace);

            // 새벽(stage 0~1): 구름이 살짝 붉고 따뜻한 여명 색감
            float dawnTint = smoothstep(1.5, 0.0, uStage);
            cloudCol = mix(cloudCol, vec3(1.0, 0.75, 0.65), dawnTint * 0.30);

            // 황혼(stage 4~5): 구름이 노을빛으로 물듦
            float duskTint = smoothstep(3.5, 5.2, uStage);
            vec3 duskCol   = uSkyCol * 1.9;
            cloudCol = mix(cloudCol, duskCol, duskTint * 0.60);

            // 지평선 가까운 구름: 노을빛 반사
            float horizGlow = (1.0 - smoothstep(0.04, 0.28, t)) * duskTint;
            cloudCol = mix(cloudCol, uSkyCol * 2.4, horizGlow * 0.45);

            // 최종 합성: 초반엔 살짝 더 불투명(0.95), 이후 줄어들며 fade
            float earlyBoost = mix(0.95, 0.88, smoothstep(0.0, 3.0, uStage));
            float alpha = density * cloudVisible * earlyBoost;
            sky = mix(sky, cloudCol, alpha);
          }
        }

        gl_FragColor = vec4(sky, 1.0);
      }
    `,
    side: THREE.BackSide,
    depthWrite: false,
  });

  const skyMesh = new THREE.Mesh(new THREE.SphereGeometry(3000, 32, 16), skyMaterial);
  return { skyMesh, skyMaterial };
};
