import { marked } from 'marked';

const renderer = new marked.Renderer();

renderer.heading = (text, level) => {
  const sizes = {
    1: 'text-2xl',
    2: 'text-xl',
    3: 'text-lg',
    4: 'text-base',
    5: 'text-sm',
    6: 'text-xs'
  };
  return `<h${level} class="font-semibold ${sizes[level]} mb-2">${text}</h${level}>`;
};

renderer.paragraph = (text) => {
  return `<p class="mb-4 leading-relaxed">${text}</p>`;
};

renderer.list = (body, ordered) => {
  const type = ordered ? 'ol' : 'ul';
  return `<${type} class="mb-4 pl-5 space-y-1 list-disc">${body}</${type}>`;
};

renderer.listitem = (text) => {
  return `<li class="text-base">${text}</li>`;
};

renderer.code = (code, language) => {
  return `<pre class="bg-muted p-4 rounded-md overflow-x-auto"><code class="text-sm">${code}</code></pre>`;
};

export const cleanText = (text: string): string => {
  return text
    .replace(/\[\d+:\d+\s*[^\]]*\]/g, '')
    .replace(/\[\d+\]/g, '')
    .replace(/【\d+†source】/g, '')
    .replace(/\(\d+\)/g, '')
    .replace(/\s+/g, ' ')
    .trim();
};

export const formatText = (text: string): string => {
  marked.setOptions({
    renderer,
    breaks: true,
    gfm: true
  });

  const cleanedText = cleanText(text);
  return marked(cleanedText);
};