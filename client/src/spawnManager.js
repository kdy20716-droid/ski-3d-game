import { hash } from './terrain.js';

export const createSpawnManager = () => {
  // 사용된 Z 구역 가드 (Z축 상에서 오브젝트 간 최소 거리 보장)
  const occupiedZones = [];

  // 안전 스폰 좌표 검색 (기존 오브젝트와 최소 minDist 이상의 Z 차이 보장)
  const findSafeZ = (preferredZ, minDist = 120) => {
    let targetZ = preferredZ;
    let attempts = 0;
    while (attempts < 20) {
      let isOverlap = false;
      for (const zone of occupiedZones) {
        if (Math.abs(zone.z - targetZ) < minDist) {
          isOverlap = true;
          break;
        }
      }
      if (!isOverlap) {
        occupiedZones.push({ z: targetZ });
        return targetZ;
      }
      targetZ -= (minDist + 30);
      attempts++;
    }
    occupiedZones.push({ z: targetZ });
    return targetZ;
  };

  // 키커 점프대 스폰 Z 좌표 세트 생성 (Z = -150m 시작, 400m 간격)
  const generateKickerRampZs = (count = 6) => {
    const zs = [];
    const baseZs = [-150, -580, -1020, -1480, -1950, -2500];
    for (let i = 0; i < count; i++) {
      const safeZ = findSafeZ(baseZs[i], 150);
      zs.push(safeZ);
    }
    return zs;
  };

  // 원래 다이아몬드 아치 스폰 Z 좌표 세트 생성 (키커 점프대와 절대 겹치지 않는 Z=-380m 시작, 380m 간격)
  const generateArchZs = (count = 8) => {
    const zs = [];
    const baseZs = [-380, -800, -1250, -1700, -2150, -2700, -3200, -3700];
    for (let i = 0; i < count; i++) {
      const safeZ = findSafeZ(baseZs[i], 120);
      zs.push(safeZ);
    }
    return zs;
  };

  // 점프대 착지 구역 및 설치 구역 나무 위치 필터링 (나무와 점프대 겹침 방지)
  const isPositionOverlappingRampOrArch = (x, z, rampList, archList) => {
    if (rampList) {
      for (const ramp of rampList) {
        // 점프대 설치 구역 및 착지 구역 (x ± 25m, z ± 120m 범위)
        if (Math.abs(z - ramp.z) < 120 && Math.abs(x - ramp.x) < 25) {
          return true;
        }
      }
    }
    return false;
  };

  return { generateKickerRampZs, generateArchZs, isPositionOverlappingRampOrArch };
};
