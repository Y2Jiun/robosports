import { TennisBall } from '../types/game';

/**
 * Creates the official Double Tennis match balls:
 * Exactly 1 Purple Ball on Left (Team 1) and 1 Purple Ball on Right (Team 2)
 * Total 2 Purple Balls ONLY on the field!
 * 4 Orange Balls on Left + 4 Orange Balls on Right (Total 10 balls)
 */
export const createCourtBalls = (): TennisBall[] => {
  return [
    // Left Court (Team 1): 4 Orange Balls + EXACTLY 1 Purple Ball
    { id: 1, type: 'orange', x: 16, y: 28, vx: 0, vy: 0, side: 'left', inAir: false, isCarriedBy: 'none', isSecuredInVault: false },
    { id: 2, type: 'orange', x: 26, y: 38, vx: 0, vy: 0, side: 'left', inAir: false, isCarriedBy: 'none', isSecuredInVault: false },
    { id: 3, type: 'orange', x: 16, y: 72, vx: 0, vy: 0, side: 'left', inAir: false, isCarriedBy: 'none', isSecuredInVault: false },
    { id: 4, type: 'orange', x: 26, y: 62, vx: 0, vy: 0, side: 'left', inAir: false, isCarriedBy: 'none', isSecuredInVault: false },
    { id: 5, type: 'purple', x: 36, y: 50, vx: 0, vy: 0, side: 'left', inAir: false, isCarriedBy: 'none', isSecuredInVault: false },

    // Right Court (Team 2): 4 Orange Balls + EXACTLY 1 Purple Ball
    { id: 6, type: 'orange', x: 84, y: 28, vx: 0, vy: 0, side: 'right', inAir: false, isCarriedBy: 'none', isSecuredInVault: false },
    { id: 7, type: 'orange', x: 74, y: 38, vx: 0, vy: 0, side: 'right', inAir: false, isCarriedBy: 'none', isSecuredInVault: false },
    { id: 8, type: 'orange', x: 84, y: 72, vx: 0, vy: 0, side: 'right', inAir: false, isCarriedBy: 'none', isSecuredInVault: false },
    { id: 9, type: 'orange', x: 74, y: 62, vx: 0, vy: 0, side: 'right', inAir: false, isCarriedBy: 'none', isSecuredInVault: false },
    { id: 10, type: 'purple', x: 64, y: 50, vx: 0, vy: 0, side: 'right', inAir: false, isCarriedBy: 'none', isSecuredInVault: false },
  ];
};
