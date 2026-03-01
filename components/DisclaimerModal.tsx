'use client';
import { useState, useEffect } from 'react';

export default function DisclaimerModal() {
  const [show, setShow] = useState(false);
  const [text, setText] = useState('本站所有音乐内容仅供个人学习、欣赏使用，不作任何商业用途。');

  useEffect(() => {
    if (localStorage.getItem('disclaimerAccepted')) return;
    fetch('/api/disclaimer').then(r => r.json()).then(d => {
      if (d.enabled && d.showOnFirstVisit) { setText(d.text || text); setTimeout(() => setShow(true), 800); }
    }).catch(() => { setTimeout(() => setShow(true), 800); });
  }, []);

  const accept = () => { localStorage.setItem('disclaimerAccepted', '1'); setShow(false); };

  if (!show) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-fade-in">
        <h2 className="text-lg font-bold mb-3">免责声明</h2>
        <p className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">{text}</p>
        <div className="flex gap-3 mt-5">
          <button onClick={accept}
            className="flex-1 bg-indigo-500 hover:bg-indigo-600 text-white py-2 rounded-lg text-sm font-medium transition">
            我已了解，继续使用
          </button>
          <a href="/disclaimer" className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 transition flex items-center">
            查看详情
          </a>
        </div>
      </div>
    </div>
  );
}
