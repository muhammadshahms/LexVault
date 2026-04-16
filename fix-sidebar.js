const fs = require('fs');

let css = fs.readFileSync('src/public/css/style.css', 'utf8');

// The file was already restored and apply-m3.js was run. I will just run a secondary pass to fix sidebar text colors:
css = css.replace('color: #fff;', 'color: var(--gray-900);');
css = css.replace('border-bottom: 1px solid rgba(255, 255, 255, 0.06);', 'border-bottom: 1px solid var(--gray-300);');
css = css.replace('color: rgba(255, 255, 255, 0.4);', 'color: var(--gray-500);');
css = css.replace('color: rgba(255, 255, 255, 0.3);', 'color: var(--gray-500);');
css = css.replace('color: rgba(255, 255, 255, 0.55);', 'color: var(--gray-600);');
css = css.replace('background: rgba(255, 255, 255, 0.06);', 'background: var(--gray-200);');
css = css.replace('color: rgba(255, 255, 255, 0.9);', 'color: var(--gray-900);');
css = css.replace('border-top: 1px solid rgba(255, 255, 255, 0.06);', 'border-top: 1px solid var(--gray-300);');
css = css.replace('color: rgba(255, 255, 255, 0.4);', 'color: var(--gray-500);'); // repeated for user role

fs.writeFileSync('src/public/css/style.css', css, 'utf8');
console.log('Sidebar text colors fixed for Light M3 Theme!');
