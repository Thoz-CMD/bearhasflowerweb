const fs = require('fs');

const indexHtml = fs.readFileSync('../index.html', 'utf8');
const glitterHtml = fs.readFileSync('../glitter_rose.html', 'utf8');

function extractBodyRaw(html) {
  const start = html.indexOf('<body>');
  const end = html.indexOf('<script>'); // End before scripts
  if (start > -1 && end > -1) {
    let body = html.substring(start + 6, end);
    // Fix links for Next.js routing
    body = body.replace(/href="glitter_rose\.html"/g, 'href="/glitter_rose"');
    body = body.replace(/href="index\.html"/g, 'href="/"');
    // Escape backticks and dollars for template literal
    body = body.replace(/`/g, '\\`').replace(/\$/g, '\\$');
    return body;
  }
  return '';
}

function extractScriptRaw(html) {
  const start = html.lastIndexOf('<script>');
  const end = html.lastIndexOf('</script>');
  if (start > -1 && end > -1) {
    let script = html.substring(start + 8, end);
    // Remove GAS gasGoToPage references and replace with standard window.location
    script = script.replace(/google\.script\.run[\s\S]*?withFailureHandler[^\)]+\)/g, 'undefined');
    script = script.replace(/typeof google !== 'undefined'[\s\S]*?\} else \{([\s\S]*?)\}/g, '$1');
    script = script.replace(/document\.querySelectorAll\('a'\)/g, "document.querySelectorAll('#none')");
    // Escape backticks and dollars for template literal
    script = script.replace(/`/g, '\\`').replace(/\$/g, '\\$');
    return script;
  }
  return '';
}

const indexBody = extractBodyRaw(indexHtml);
const indexScript = extractScriptRaw(indexHtml);

const indexPageCode = `'use client';
import { useEffect } from 'react';

export default function Home() {
  useEffect(() => {
    const script = document.createElement('script');
    script.innerHTML = \`${indexScript}\`;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return <div dangerouslySetInnerHTML={{ __html: \`${indexBody}\` }} />;
}
`;
fs.writeFileSync('src/app/page.tsx', indexPageCode);


const glitterBody = extractBodyRaw(glitterHtml);
const glitterScript = extractScriptRaw(glitterHtml);

const glitterPageCode = `'use client';
import { useEffect } from 'react';

export default function GlitterRose() {
  useEffect(() => {
    const script = document.createElement('script');
    script.innerHTML = \`${glitterScript}\`;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return <div dangerouslySetInnerHTML={{ __html: \`${glitterBody}\` }} />;
}
`;
fs.writeFileSync('src/app/glitter_rose/page.tsx', glitterPageCode);

console.log('Dangerously set HTML injected.');
