'use client';
import { Song } from '@/lib/github-db';
import { create } from 'zustand';

interface PlayerState {
  currentSong: Song | null;
  queue: Song[];
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;

  play: (song: Song, queue?: Song[]) => Promise<void>;
  togglePlay: () => void;
  prev: () => void;
  next: () => void;
  seek: (time: number) => void;   // 秒数，不是百分比
  setVolume: (v: number) => void;
}

// ── 单例 Audio（只在浏览器中存在）────────────────────────────────────────────
let _audio: HTMLAudioElement | null = null;

function getAudio(): HTMLAudioElement | null {
  if (typeof window === 'undefined') return null;
  if (!_audio) {
    _audio = new Audio();
    _audio.preload = 'auto';
  }
  return _audio;
}

export const usePlayerStore = create<PlayerState>((set, get) => {
  // 初始化 audio 事件（只绑定一次）
  if (typeof window !== 'undefined') {
    const audio = getAudio()!;
    audio.addEventListener('timeupdate',      () => set({ currentTime: audio.currentTime }));
    audio.addEventListener('loadedmetadata',  () => set({ duration: audio.duration }));
    audio.addEventListener('play',            () => set({ isPlaying: true }));
    audio.addEventListener('pause',           () => set({ isPlaying: false }));
    audio.addEventListener('ended',           () => get().next());
    audio.volume = 0.8;
  }

  return {
    currentSong: null,
    queue: [],
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 0.8,

    play: async (song, queue = []) => {
      const audio = getAudio();
      if (!audio) return;

      // 获取 token
      let token = '';
      try {
        const r = await fetch(`/api/audio/token/${song.id}`);
        token = (await r.json()).token || '';
      } catch {}

      const src = `/api/audio/${song.id}${token ? `?token=${token}` : ''}`;

      // 只有换歌时才重新 load，避免 seek 时重复播放
      if (!audio.src.includes(`/api/audio/${song.id}`)) {
        audio.src = src;
        audio.load();
      }

      set({
        currentSong: song,
        queue: queue.length ? queue : [song],
        currentTime: 0,
        duration: 0,
      });

      try { await audio.play(); } catch {}

      // 异步上报播放次数
      fetch(`/api/songs/${song.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'play' }),
      }).catch(() => {});
    },

    togglePlay: () => {
      const audio = getAudio();
      if (!audio) return;
      if (audio.paused) audio.play().catch(() => {});
      else audio.pause();
    },

    prev: () => {
      const { queue, currentSong, play } = get();
      const idx = queue.findIndex(s => s.id === currentSong?.id);
      if (idx > 0) play(queue[idx - 1], queue);
    },

    next: () => {
      const { queue, currentSong, play } = get();
      const idx = queue.findIndex(s => s.id === currentSong?.id);
      if (idx < queue.length - 1) play(queue[idx + 1], queue);
    },

    seek: (time: number) => {
      const audio = getAudio();
      if (audio) audio.currentTime = time;
    },

    setVolume: (v: number) => {
      const audio = getAudio();
      if (audio) audio.volume = v;
      set({ volume: v });
    },
  };
});
