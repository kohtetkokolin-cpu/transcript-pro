
import React from 'react';

export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'ja', name: 'Japanese' },
  { code: 'th', name: 'Thai' },
  { code: 'my', name: 'Burmese' },
];

export const AI_VOICES = [
  { 
    id: 'Charon', 
    name: 'Recap Master', 
    style: 'Narrator', 
    description: 'The definitive voice for recap channels. Calm, confident storytelling with perfect dramatic emphasis at key moments.' 
  },
  { 
    id: 'Kore', 
    name: 'Dhamma Speaker (Burmese)', 
    style: 'Dhamma / Monk-style', 
    description: 'Calm, peaceful, and respectful Burmese Dhamma-style voice. Optimized for moral stories, teachings, and peaceful narration.' 
  },
  { 
    id: 'Kore', 
    name: 'Myanmar Narrator (Burmese)', 
    style: 'Burmese Storyteller', 
    description: 'A professional, calm, and natural Myanmar male narrator. Optimized for storytelling, audiobooks, and recaps in native Burmese.' 
  },
  { 
    id: 'Zephyr', 
    name: 'Cinema Narrator', 
    style: 'Audiobook', 
    description: 'Calm, engaging narrator specialized in audiobook-style movie recaps and long-form narration. Perfect for deep focus sessions.' 
  },
  { 
    id: 'Kore', 
    name: 'Corporate Pro', 
    style: 'Professional', 
    description: 'Deep, measured, and authoritative. Perfect for B2B presentations, training modules, and formal pitches.' 
  },
  { 
    id: 'Puck', 
    name: 'Social Star', 
    style: 'High Energy', 
    description: 'Vibrant and punchy. Optimized for high-engagement social media clips, vlogs, and trend-focused content.' 
  },
  { 
    id: 'Charon', 
    name: 'The Storyteller', 
    style: 'Narrative', 
    description: 'Warm, rhythmic, and expressive. Ideal for long-form audiobooks, documentaries, and cinematic storytelling.' 
  },
  { 
    id: 'Zephyr', 
    name: 'Zen Assistant', 
    style: 'Calm', 
    description: 'Soft and soothing with a gentle pace. Best for wellness apps, guided meditations, and sleep stories.' 
  },
  { 
    id: 'Fenrir', 
    name: 'News Anchor', 
    style: 'Broadcast', 
    description: 'Strict, clear, and non-emotive. Emulates the authoritative pacing of a primetime television news report.' 
  },
  { 
    id: 'Puck', 
    name: 'Child Voice', 
    style: 'Playful', 
    description: 'Bright, high-pitched, and innocent. Designed for children’s educational content, bedtime stories, and animations.' 
  },
  { 
    id: 'Kore', 
    name: 'Podcast Host', 
    style: 'Conversational', 
    description: 'Natural, friendly, and relatable. A steady delivery that feels like a real human dialogue in an audio show.' 
  },
  { 
    id: 'Charon', 
    name: 'Noir Detective', 
    style: 'Atmospheric', 
    description: 'Gravelly, cynical, and mysterious. Perfect for true crime, hardboiled mysteries, and suspenseful noir scripts.' 
  },
  { 
    id: 'Fenrir', 
    name: 'Action Trailer', 
    style: 'Dramatic', 
    description: 'Deeply resonant and intense. The classic "movie trailer" voice for epic reveals and high-stakes cinematic promos.' 
  },
  { 
    id: 'Zephyr', 
    name: 'Ethereal Guide', 
    style: 'Sci-Fi', 
    description: 'Cold, breathy, and slightly detached. Ideal for futuristic AI interfaces, space-themed narratives, and sci-fi lore.' 
  },
  { 
    id: 'Puck', 
    name: 'Tech Analyst', 
    style: 'Analytical', 
    description: 'Modern, crisp, and fast-paced. Specifically tuned for hardware unboxings, software tutorials, and tech reviews.' 
  },
  { 
    id: 'Charon', 
    name: 'Vintage Radio', 
    style: 'Nostalgic', 
    description: 'Mid-heavy and warm. Mimics the cozy, slightly crackled aesthetic of golden-age 1940s radio broadcasts.' 
  },
  { 
    id: 'Fenrir', 
    name: 'Motivational Coach', 
    style: 'Inspirational', 
    description: 'Driving and powerful. Designed to push audiences with a booming, high-confidence delivery for fitness and growth content.' 
  },
  { 
    id: 'Zephyr', 
    name: 'Luxury Brand', 
    style: 'Premium', 
    description: 'Elegantly soft and sophisticated. Best for high-end fashion, jewelry, and luxury automotive marketing.' 
  },
  { 
    id: 'Kore', 
    name: 'Educational Professor', 
    style: 'Academic', 
    description: 'Structured, clear, and encouraging. A trustworthy voice for online courses, lectures, and academic tutorials.' 
  },
  { 
    id: 'Zephyr', 
    name: 'ASMR Whisperer', 
    style: 'Intimate', 
    description: 'Extremely soft and breathy. Uses a close-mic effect for relaxing ASMR and deeply personal narratives.' 
  }
];

export const ICONS = {
  Studio: (props: any) => (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
    </svg>
  ),
  Pencil: (props: any) => (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
    </svg>
  ),
  Download: (props: any) => (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
  ),
  Image: (props: any) => (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  Link: (props: any) => (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.82a4 4 0 015.656 0l4 4a4 4 0 01-5.656 5.656l-1.1-1.1" />
    </svg>
  ),
  Sparkles: (props: any) => (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-7.714 2.143L11 21l-2.286-6.857L1 12l7.714-2.143L11 3z" />
    </svg>
  ),
  List: (props: any) => (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
    </svg>
  )
};
