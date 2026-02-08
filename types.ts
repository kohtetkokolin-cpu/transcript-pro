
export interface TranscriptionSegment {
  startTime: string;
  endTime: string;
  text: string;
  speaker?: string;
}

export interface TranscriptionResult {
  fullText: string;
  segments: TranscriptionSegment[];
  language: string;
  durationSeconds?: number;
}

export interface SavedTranscription {
  id: string;
  fileName: string;
  timestamp: number;
  result: TranscriptionResult;
}

export interface TimelineSection {
  segmentTitle: string;
  timeRange: string;
  beats: {
    timestamp?: string;
    description: string;
    instruction: string;
  }[];
}

export interface HookOption {
  type: string;
  visual: string;
  textOverlay: string;
  voScript: string;
  logic: string;
}

export interface ProfessionalRecapResult {
  analysis: {
    originalTitle: string;
    duration: string;
    genre: string;
    targetLength: string;
    coreMessage: string;
  };
  hookStrategy: {
    options: HookOption[];
  };
  editTimeline: TimelineSection[];
  audioPlan: {
    musicStrategy: string;
    originalAudioHandling: string;
    voScript: string;
  };
  visualTechniques: {
    graphicReplacements: string[];
    engagementBoosters: string[];
    colorGrading: string;
  };
  retentionHooks: {
    timestamp: string;
    type: string;
    text: string;
    visual: string;
  }[];
  metadataStrategy: {
    titles: string[];
    description: string;
    tags: string[];
    thumbnailText: string[];
  };
  exportSettings: {
    video: string;
    audio: string;
    platformNotes: string;
  };
  copyrightChecklist: string[];
}

export interface ThumbnailDesignSpec {
  concept: string;
  visualComposition: {
    mainFocalPoint: string;
    background: string;
    layout: string;
    depth: string;
  };
  colorPalette: {
    primary: string;
    secondary: string;
    contrastLevel: string;
  };
  typography: {
    mainText: {
      text: string;
      fontStyle: string;
      size: string;
      color: string;
      position: string;
      effect: string;
    };
    subText?: {
      text: string;
      style: string;
      placement: string;
    };
  };
  keyVisualElements: string[];
  emotionalTriggers: {
    primaryEmotion: string;
    visualHooks: string;
  };
  designPrinciples: string[];
  aiImagePrompt: string;
}

export interface ThumbnailPackage {
  landscape: ThumbnailDesignSpec;
  vertical: ThumbnailDesignSpec;
  square: ThumbnailDesignSpec;
}

export type ArchiveType = 
  | 'Story' 
  | 'Recap' 
  | 'Transcript' 
  | 'Audiobook' 
  | 'Translation' 
  | 'Voice' 
  | 'Thumbnail' 
  | 'Content'
  | 'Video';

export type AppView = 
  | 'dashboard' 
  | 'transcribe_file' 
  | 'transcribe_youtube' 
  | 'translate' 
  | 'subtitles' 
  | 'voice' 
  | 'recap' 
  | 'professional_recap'
  | 'content' 
  | 'story' 
  | 'thumbnail' 
  | 'downloader'
  | 'archive'
  | 'video_gen';

export interface ArchiveEntry {
  id: string;         // UUID
  fileId: string;     // e.g., ST-001
  type: ArchiveType;
  title: string;
  content: any;
  language: string;
  toolId: AppView;
  timestamp: number;
  version: number;
  metadata?: {
    sourceUrl?: string;
    sourceText?: string;
    tone?: string;
    wordCount?: number;
    duration?: string;
    story?: string;
    imageUrl?: string;
    voiceId?: string;
    voiceName?: string;
    aspectRatio?: string;
    resolution?: string;
  };
}

export interface VoiceOption {
  id: string;
  name: string;
  gender: 'Male' | 'Female';
  style: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
}
