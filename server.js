const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 5000;
const HOST = '0.0.0.0';

function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function markdownToHtml(md) {
  let html = escapeHtml(md);
  
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');
  
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
  
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
  
  html = html.replace(/^\| (.+) \|$/gm, (match, content) => {
    const cells = content.split(' | ').map(cell => `<td>${cell.trim()}</td>`).join('');
    return `<tr>${cells}</tr>`;
  });
  
  html = html.replace(/^\|[-| ]+\|$/gm, '');
  
  html = html.replace(/```(\w+)?\n([\s\S]+?)```/g, '<pre><code>$2</code></pre>');
  
  html = html.replace(/^- (.+)$/gm, '<li>$1</li>');
  
  const lines = html.split('\n');
  const processed = [];
  let inList = false;
  
  for (const line of lines) {
    if (line.startsWith('<li>')) {
      if (!inList) {
        processed.push('<ul>');
        inList = true;
      }
      processed.push(line);
    } else {
      if (inList) {
        processed.push('</ul>');
        inList = false;
      }
      if (line.trim() && !line.startsWith('<')) {
        processed.push(`<p>${line}</p>`);
      } else {
        processed.push(line);
      }
    }
  }
  if (inList) processed.push('</ul>');
  
  return processed.join('\n');
}

function loadPlugins() {
  const marketplacePath = '.claude-plugin/marketplace.json';
  try {
    const data = fs.readFileSync(marketplacePath, 'utf-8');
    const marketplace = JSON.parse(data);
    return marketplace.plugins || [];
  } catch (e) {
    return [];
  }
}

function generatePluginCards(plugins) {
  return plugins.map(p => `
    <div class="plugin-card">
      <h3>${escapeHtml(p.name)}</h3>
      <span class="category">${escapeHtml(p.category || 'general')}</span>
      <p>${escapeHtml(p.description)}</p>
      <div class="meta">
        <span>v${escapeHtml(p.version)}</span>
        <span>${escapeHtml(p.author?.name || 'Unknown')}</span>
      </div>
      <div class="keywords">${(p.keywords || []).map(k => `<span class="keyword">${escapeHtml(k)}</span>`).join('')}</div>
    </div>
  `).join('');
}

function getHtmlPage() {
  const readme = fs.existsSync('README.md') ? fs.readFileSync('README.md', 'utf-8') : '# Claude Marketplace';
  const plugins = loadPlugins();
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Claude Marketplace - mberto-compound</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: #333;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
    }
    .container { max-width: 1200px; margin: 0 auto; padding: 2rem; }
    header {
      text-align: center;
      padding: 3rem 0;
      color: white;
    }
    header h1 { font-size: 2.5rem; margin-bottom: 0.5rem; }
    header p { opacity: 0.9; font-size: 1.1rem; }
    
    .content-box {
      background: white;
      border-radius: 16px;
      padding: 2rem;
      margin-bottom: 2rem;
      box-shadow: 0 10px 40px rgba(0,0,0,0.1);
    }
    
    h2 { color: #667eea; margin: 1.5rem 0 1rem; border-bottom: 2px solid #eee; padding-bottom: 0.5rem; }
    h3 { color: #444; margin: 1rem 0 0.5rem; }
    
    code {
      background: #f5f5f5;
      padding: 0.2rem 0.5rem;
      border-radius: 4px;
      font-family: 'Fira Code', monospace;
      font-size: 0.9em;
    }
    pre {
      background: #2d2d2d;
      color: #f8f8f2;
      padding: 1rem;
      border-radius: 8px;
      overflow-x: auto;
      margin: 1rem 0;
    }
    pre code { background: none; color: inherit; padding: 0; }
    
    ul { margin: 0.5rem 0 0.5rem 1.5rem; }
    li { margin: 0.3rem 0; }
    
    a { color: #667eea; }
    
    table { width: 100%; border-collapse: collapse; margin: 1rem 0; }
    td, th { padding: 0.75rem; border: 1px solid #eee; text-align: left; }
    tr:nth-child(even) { background: #f9f9f9; }
    
    .plugins-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 1.5rem;
      margin-top: 1rem;
    }
    
    .plugin-card {
      background: #fff;
      border: 1px solid #e0e0e0;
      border-radius: 12px;
      padding: 1.5rem;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .plugin-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 24px rgba(0,0,0,0.12);
    }
    .plugin-card h3 { margin: 0 0 0.5rem; color: #333; }
    .plugin-card .category {
      display: inline-block;
      background: linear-gradient(135deg, #667eea, #764ba2);
      color: white;
      padding: 0.2rem 0.6rem;
      border-radius: 20px;
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .plugin-card p { color: #666; margin: 0.75rem 0; font-size: 0.95rem; }
    .plugin-card .meta { font-size: 0.85rem; color: #888; margin-bottom: 0.5rem; }
    .plugin-card .meta span { margin-right: 1rem; }
    .plugin-card .keywords { display: flex; flex-wrap: wrap; gap: 0.4rem; }
    .plugin-card .keyword {
      background: #f0f0f0;
      padding: 0.15rem 0.5rem;
      border-radius: 12px;
      font-size: 0.75rem;
      color: #666;
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>Claude Marketplace</h1>
      <p>Personal collection of Claude Code plugins, commands, agents, and skills</p>
    </header>
    
    <div class="content-box">
      <h2>Available Plugins (${plugins.length})</h2>
      <div class="plugins-grid">
        ${generatePluginCards(plugins)}
      </div>
    </div>
    
    <div class="content-box">
      <h2>Documentation</h2>
      ${markdownToHtml(readme)}
    </div>
  </div>
</body>
</html>`;
}

const server = http.createServer((req, res) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Content-Type', 'text/html');
  res.writeHead(200);
  res.end(getHtmlPage());
});

server.listen(PORT, HOST, () => {
  console.log(`Claude Marketplace documentation server running at http://${HOST}:${PORT}`);
});
