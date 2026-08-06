export const CFG = {
  TW: 650,             // Terrain Width
  TD: 2000,            // Chunk Length per Block
  SW: 90,              // Width Subdivisions
  SD: 200,             // Depth Subdivisions
  BASE_SPD: 24,        // Base Skiing Speed
  MAX_SPD: 95.0,       // 원래의 시원시원한 기본 최고 속도 (복구)
  STAGE_SPEED_INC: 5.0,// 스테이지 통과 시 최고 속도 미세 상향
  BOOSTER_SPEED_ADD: 35.0,// 부스트 발동 시 속도 추가
  ACCEL: 4.8,          // Acceleration
  TURN: 65.0,          // 좌우 회전력 (더 빠르고 민첩하게 반응하도록 상향)
  TURN_FAST: 95.0,     // Shift 고속 회전력 (즉각적인 고속 드리프트)
  TURN_FRIC: 0.88,     // 마찰 저항 (좌우 밀림을 줄여 착 감기는 정밀 조종감)
  CAM_H: 7.5,          // Camera Height Offset
  CAM_D: 17,           // Camera Distance Offset
  CAM_LAG: 0.14,       // Camera Smooth Lag
  TREES: 850,          // Tree Count
  ITEMS: 60,           // Diamond Count
  SNOW_PARTICLES: 5000,// Continuous Snowfall Particle Count
  MAX_LATERAL_X: 150,  // Boundary Limits
};
