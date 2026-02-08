
import { ArchiveEntry, ArchiveType, AppView } from "../types";

const STORAGE_KEY = 'transcript_pro_global_archive';
const COUNTER_KEY = 'transcript_pro_archive_counters';

interface Counters {
  [key: string]: number;
}

const TYPE_PREFIX: Record<ArchiveType, string> = {
  Story: 'ST',
  Recap: 'VR',
  Transcript: 'TR',
  Audiobook: 'AR',
  Translation: 'TL',
  Voice: 'VO',
  Thumbnail: 'TN',
  Content: 'CT',
  Video: 'VD'
};

export class ArchiveService {
  private static getArchive(): ArchiveEntry[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error("Failed to parse archive data", e);
      return [];
    }
  }

  private static getCounters(): Counters {
    try {
      const data = localStorage.getItem(COUNTER_KEY);
      // Ensure all types are represented in initial state
      return data ? JSON.parse(data) : { ST: 0, VR: 0, TR: 0, AR: 0, TL: 0, VO: 0, TN: 0, CT: 0, VD: 0 };
    } catch (e) {
      return { ST: 0, VR: 0, TR: 0, AR: 0, TL: 0, VO: 0, TN: 0, CT: 0, VD: 0 };
    }
  }

  private static saveArchive(archive: ArchiveEntry[]) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(archive));
  }

  private static saveCounters(counters: Counters) {
    localStorage.setItem(COUNTER_KEY, JSON.stringify(counters));
  }

  private static generateFileId(type: ArchiveType): string {
    const prefix = TYPE_PREFIX[type] || 'XX';
    const counters = this.getCounters();
    counters[prefix] = (counters[prefix] || 0) + 1;
    this.saveCounters(counters);
    return `${prefix}-${String(counters[prefix]).padStart(3, '0')}`;
  }

  static saveAsset(params: {
    type: ArchiveType;
    title: string;
    content: any;
    language: string;
    toolId: AppView;
    metadata?: any;
  }): ArchiveEntry {
    const archive = this.getArchive();
    
    // Check for existing title to increment version
    const previousVersions = archive.filter(a => a.title === params.title && a.type === params.type);
    const version = previousVersions.length + 1;

    const entry: ArchiveEntry = {
      id: crypto.randomUUID(),
      fileId: this.generateFileId(params.type),
      type: params.type,
      title: params.title,
      content: params.content,
      language: params.language,
      toolId: params.toolId,
      timestamp: Date.now(),
      version,
      metadata: params.metadata
    };

    archive.unshift(entry);
    this.saveArchive(archive.slice(0, 500)); // Increased limit
    return entry;
  }

  static listAll(): ArchiveEntry[] {
    return this.getArchive();
  }

  static deleteAsset(id: string) {
    const archive = this.getArchive().filter(a => a.id !== id);
    this.saveArchive(archive);
  }

  static clearAll() {
    this.saveArchive([]);
    this.saveCounters({ ST: 0, VR: 0, TR: 0, AR: 0, TL: 0, VO: 0, TN: 0, CT: 0, VD: 0 });
  }
}
