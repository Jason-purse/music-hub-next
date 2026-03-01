import fs from 'fs';
import path from 'path';

const CONFIG_PATH = path.join(process.cwd(), 'config', 'admin.json');

function loadDisclaimer() {
  try { return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8')).disclaimer; }
  catch { return { enabled: true, text: '本站所有音乐内容仅供个人学习、欣赏使用，不作任何商业用途。\n音乐版权归原唱片公司及艺术家所有。\n如您是版权方且认为本站内容侵犯了您的权益，请联系我们，我们将在 24 小时内删除相关内容。', contactEmail: '' }; }
}

export default async function DisclaimerPage() {
  const d = loadDisclaimer();
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">免责声明</h1>
      <div className="bg-white dark:bg-[#1e1e1e] rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm dark:shadow-none p-6">
        <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed text-sm">{d.text}</p>
        {d.contactEmail && (
          <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
            版权投诉邮箱：<a href={`mailto:${d.contactEmail}`} className="text-indigo-500 hover:underline">{d.contactEmail}</a>
          </p>
        )}
      </div>
      <a href="/" className="inline-flex items-center gap-1 text-sm text-indigo-500 hover:underline">← 返回首页</a>
    </div>
  );
}
