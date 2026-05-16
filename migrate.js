const fs = require('fs');

function htmlToJsx(html) {
  return html
    .replace(/class=/g, 'className=')
    .replace(/for=/g, 'htmlFor=')
    .replace(/<!--/g, '{/*')
    .replace(/-->/g, '*/}')
    .replace(/<br>/g, '<br />')
    .replace(/<hr>/g, '<hr />')
    .replace(/<img([^>]+?)>/g, (match, p1) => {
      if (p1.endsWith('/')) return match;
      return `<img${p1} />`;
    })
    .replace(/<input([^>]+?)>/g, (match, p1) => {
      if (p1.endsWith('/')) return match;
      return `<input${p1} />`;
    })
    .replace(/style="([^"]*)"/g, (match, p1) => {
       const styleObj = p1.split(';').filter(s => s.trim()).reduce((acc, rule) => {
         const [key, ...val] = rule.split(':');
         if (!key || !val.length) return acc;
         const camelKey = key.trim().replace(/-([a-z])/g, g => g[1].toUpperCase());
         acc[camelKey] = val.join(':').trim();
         return acc;
       }, {});
       return 'style={{' + Object.entries(styleObj).map(([k, v]) => `${k}: '${v.replace(/'/g, "\\'")}'`).join(', ') + '}}';
    })
    // Also SVG self closing tags if any that might be problematic, but usually fine
    // Specifically handle the SVG path that might not be closed if it's <path ... >
    .replace(/<path([^>]+?)>/g, (match, p1) => {
       if (p1.endsWith('/')) return match;
       return `<path${p1} />`;
    })
    .replace(/<circle([^>]+?)>/g, (match, p1) => {
       if (p1.endsWith('/')) return match;
       return `<circle${p1} />`;
    })
    .replace(/<rect([^>]+?)>/g, (match, p1) => {
       if (p1.endsWith('/')) return match;
       return `<rect${p1} />`;
    });
}

const indexHtml = fs.readFileSync('../index.html', 'utf8');
const glitterHtml = fs.readFileSync('../glitter_rose.html', 'utf8');

function extractBody(html) {
  const start = html.indexOf('<body>');
  const end = html.indexOf('<script>'); // End before scripts
  if (start > -1 && end > -1) {
    return html.substring(start + 6, end);
  }
  return '';
}

function extractScript(html) {
  const start = html.lastIndexOf('<script>');
  const end = html.lastIndexOf('</script>');
  if (start > -1 && end > -1) {
    return html.substring(start + 8, end);
  }
  return '';
}

const indexBodyJsx = htmlToJsx(extractBody(indexHtml));
const indexScript = extractScript(indexHtml);

const indexPageCode = `'use client';
import { useEffect } from 'react';
import Link from 'next/link';

export default function Home() {
  useEffect(() => {
    ${indexScript.replace(/document\.querySelectorAll\('a'\)/g, "document.querySelectorAll('#none')").replace(/google\.script\.run/g, 'undefined')}
  }, []);

  return (
    <>
      ${indexBodyJsx.replace(/href="glitter_rose\.html"/g, 'href="/glitter_rose"').replace(/<a /g, '<Link ').replace(/<\/a>/g, '</Link>')}
    </>
  );
}
`;
fs.writeFileSync('src/app/page.tsx', indexPageCode);

const glitterBodyJsx = htmlToJsx(extractBody(glitterHtml));
const glitterScript = extractScript(glitterHtml);

if (!fs.existsSync('src/app/glitter_rose')) {
  fs.mkdirSync('src/app/glitter_rose', { recursive: true });
}

const glitterPageCode = `'use client';
import { useEffect } from 'react';
import Link from 'next/link';

export default function GlitterRose() {
  useEffect(() => {
    ${glitterScript.replace(/document\.querySelectorAll\('a'\)/g, "document.querySelectorAll('#none')").replace(/google\.script\.run/g, 'undefined')}
  }, []);

  return (
    <>
      ${glitterBodyJsx.replace(/href="index\.html"/g, 'href="/"').replace(/<a /g, '<Link ').replace(/<\/a>/g, '</Link>')}
    </>
  );
}
`;
fs.writeFileSync('src/app/glitter_rose/page.tsx', glitterPageCode);

// Layout fix
const layoutCode = `import type { Metadata } from "next";
import { Cormorant_Garamond, Noto_Sans_Thai, Italiana } from "next/font/google";
import "./globals.css";

const cormorant = Cormorant_Garamond({ 
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
  variable: '--font-cormorant'
});

const notoSansThai = Noto_Sans_Thai({ 
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: '--font-noto'
});

const italiana = Italiana({ 
  subsets: ["latin"],
  weight: ["400"],
  variable: '--font-italiana'
});

export const metadata: Metadata = {
  title: "Bear has flower",
  description: "ร้านดอกไม้ Bear has flower ออกแบบช่อดอกไม้ กุหลาบกลิตเตอร์ ดอกไม้ลวดกำมะหยี่",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <body className={\`\${cormorant.variable} \${notoSansThai.variable} \${italiana.variable}\`}>
        {children}
      </body>
    </html>
  );
}
`;
fs.writeFileSync('src/app/layout.tsx', layoutCode);

console.log('Pages generated.');
