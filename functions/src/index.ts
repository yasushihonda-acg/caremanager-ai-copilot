import * as admin from 'firebase-admin';

admin.initializeApp();

// Vertex AI関連のCloud Functions
export {
  analyzeAssessment,
  refineCareGoal,
  generateCarePlanDraft,
  generateCarePlanV2, // 拡張版（第2表完全対応）
} from './vertexAi';

// デモデータリセット
export { resetDemoData } from './resetDemo';
