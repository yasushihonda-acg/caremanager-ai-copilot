import * as admin from 'firebase-admin';

admin.initializeApp();

// Vertex AI関連のCloud Functions
export { analyzeAssessment, refineCareGoal, generateCarePlanDraft } from './vertexAi';
