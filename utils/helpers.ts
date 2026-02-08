
import { TranscriptionSegment } from "../types";

export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const base64String = (reader.result as string).split(',')[1];
      resolve(base64String);
    };
    reader.onerror = error => reject(error);
  });
};

/**
 * Extracts a JSON object from a string that might contain markdown code blocks or conversational text.
 */
export const extractJson = (text: string): any => {
  if (!text) return null;
  
  // Clean potential UTF-8 BOM or whitespace
  let cleanedText = text.trim();

  try {
    // 1. Try to find JSON block in markdown
    const markdownMatch = cleanedText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (markdownMatch && markdownMatch[1]) {
      try {
        const parsed = JSON.parse(markdownMatch[1].trim());
        if (parsed) return parsed;
      } catch (e) {
        // Fall through
      }
    }

    // 2. Locate the outermost curly braces or brackets
    const firstBrace = cleanedText.indexOf('{');
    const lastBrace = cleanedText.lastIndexOf('}');
    const firstBracket = cleanedText.indexOf('[');
    const lastBracket = cleanedText.lastIndexOf(']');

    let jsonCandidate = "";
    
    // Determine if we are looking for an object or an array based on which comes first
    if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
      if (lastBrace !== -1 && lastBrace > firstBrace) {
        jsonCandidate = cleanedText.substring(firstBrace, lastBrace + 1);
      }
    } else if (firstBracket !== -1) {
      if (lastBracket !== -1 && lastBracket > firstBracket) {
        jsonCandidate = cleanedText.substring(firstBracket, lastBracket + 1);
      }
    }

    if (jsonCandidate) {
      try {
        // Handle potential escaping issues often found in AI responses
        const sanitized = jsonCandidate.replace(/\\n/g, "\\n")
                                       .replace(/\\'/g, "'");
        return JSON.parse(sanitized);
      } catch (e) {
        // Try parsing original if sanitization failed
        try {
          return JSON.parse(jsonCandidate);
        } catch (innerE) {
          // Fall through
        }
      }
    }

    // 3. Last ditch: try parsing the whole thing
    return JSON.parse(cleanedText);
  } catch (e) {
    const snippet = text.length > 100 ? text.substring(0, 100) + "..." : text;
    console.error("Failed to extract JSON from AI response. Raw text snippet:", snippet);
    return null;
  }
};

export const parseSRT = (data: string): TranscriptionSegment[] => {
  const segments: TranscriptionSegment[] = [];
  const blocks = data.trim().split(/\n\s*\n/);
  
  for (const block of blocks) {
    const lines = block.split('\n').map(l => l.trim());
    if (lines.length >= 3) {
      const timeLineIndex = lines.findIndex(l => l.includes('-->'));
      if (timeLineIndex !== -1) {
        const timeMatch = lines[timeLineIndex].match(/(\d{2}:\d{2}:\d{2}[,. ]\d{3}) --> (\d{2}:\d{2}:\d{2}[,. ]\d{3})/);
        if (timeMatch) {
          const rawText = lines.slice(timeLineIndex + 1).join(' ').trim();
          const speakerMatch = rawText.match(/^\[([^\]]+)\]:\s*(.*)$/) || rawText.match(/^([^:]+):\s*(.*)$/);
          
          if (speakerMatch) {
            segments.push({
              startTime: timeMatch[1].replace(',', '.'),
              endTime: timeMatch[2].replace(',', '.'),
              speaker: speakerMatch[1].trim(),
              text: speakerMatch[2].trim()
            });
          } else {
            segments.push({
              startTime: timeMatch[1].replace(',', '.'),
              endTime: timeMatch[2].replace(',', '.'),
              text: rawText
            });
          }
        }
      }
    }
  }
  return segments;
};

export const generateSRT = (segments: TranscriptionSegment[], includeSpeakers: boolean = false): string => {
  return segments.map((seg, index) => {
    const textPrefix = includeSpeakers && seg.speaker ? `[${seg.speaker}]: ` : '';
    return `${index + 1}\n${seg.startTime.replace('.', ',')} --> ${seg.endTime.replace('.', ',')}\n${textPrefix}${seg.text}\n`;
  }).join('\n');
};

export const pcmToWav = (pcmData: Uint8Array, sampleRate: number = 24000): Blob => {
  const header = new ArrayBuffer(44);
  const view = new DataView(header);
  view.setUint32(0, 0x52494646, false); 
  view.setUint32(4, 36 + pcmData.length, true);
  view.setUint32(8, 0x57415645, false); 
  view.setUint32(12, 0x666d7420, false); 
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  view.setUint32(36, 0x64617461, false); 
  view.setUint32(40, pcmData.length, true);
  return new Blob([header, pcmData], { type: 'audio/wav' });
};

export const downloadFile = (content: string | Blob, fileName: string, contentType: string) => {
  const blob = typeof content === 'string' ? new Blob([content], { type: contentType }) : content;
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
};
