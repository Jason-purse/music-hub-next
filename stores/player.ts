'use client';
import { create } from 'zustand';
import { Song } from '@/lib/github-db';

interface PlayerState {
  currentSong: Song | null;
  queue: Song[];
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  audio: HTMLAudioElement | null;
  play: (song: Song, queue?: Song[]) => Promise<void>;
  togglePlay: () => void;
  prev: () => void;
  next: () => void;
  seek: (pct: number) => void;
  setVolume: (v: number) => void;
  setCurrentTime: (t: number) => void;
  setDuration: (d: number) => void;
  setIsPlaying: (v: boolean) => void;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  currentSong: null,
  queue: [],
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  volume: 0.8,
  audio: null,

  play: async (song, queue = []) => {
    const state = get();
    let audio = state.audio;

    if (!audio && typeof window !== 'undefined') {
      audio = new Audio();
      audio.volume = state.volume;
      audio.addEventListener('timeupdate', () => set({ currentTime: audio!.currentTime }));
      audio.addEventListener('loadedmetadata', () => set({ duration: audio!.duration }));
      audio.addEventListener('ended', () => get().next());
      audio.addEventListener('play', () => set({ isPlaying: true }));
      audio.addEventListener('pause', () => set({ isPlaying: false }));
    }

    if (!audio) return;

    // 获取 token
    let token = '';
    try {
      const r = await fetch(`/api/audio/token/${song.id}`);
      const d = await r.json();
      token = d.token || '';
    } catch {}

    audio.src = `/api/audio/${song.id}${token ? `?token=${token}` : ''}`;
    audio.load();
    await audio.play();

    set({ currentSong: song, queue: queue.length ? queue : [song], audio, isPlaying: true });

    // 增加播放计数
    fetch(`/api/songs/${song.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'play' }) }).catch(() => {});
  },

  togglePlay: () => {
    const { audio, isPlaying } = get();
    if (!audio) return;
    if (isPlaying) audio.pause(); else audio.play();
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

  seek: (pct) => {
    const { audio, duration } = get();
    if (audio) audio.currentTime = (pct / 100) * duration;
  },

  setVolume: (v) => {
    const { audio } = get();
    if (audio) audio.volume = v;
    set({ volume: v });
  },

  setCurrentTime: (t) => set({ currentTime: t }),
  setDuration: (d) => set({ duration: d }),
  setIsPlaying: (v) => set({ isPlaying: v }),
}));
