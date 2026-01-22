
export interface ScriptResult {
  ttsContent: string;
  sceneDescriptions: string;
  imagePrompts: string[];
  facebookPost: string;
}

export type AspectRatio = '1:1' | '9:16' | '16:9';

export enum AppStatus {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  GENERATING_IMAGES = 'GENERATING_IMAGES',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}
