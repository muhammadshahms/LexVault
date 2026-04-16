const fs = require('fs');

let css = fs.readFileSync('src/public/css/style.css', 'utf8');

// 1. Replace Inter font with Roboto
css = css.replace(/family=Inter[^\&]+\&?/g, 'family=Roboto:wght@400;500;700&');
css = css.replace(/--font-sans: 'Inter', /g, "--font-sans: 'Roboto', ");

// 2. Replace the root variables segment entirely to enforce M3 tokens
const newRoot = `:root {
  /* M3 Primary (Deep Purple) */
  --brand-primary: #6750A4;
  --brand-primary-hover: #4F378B;
  --brand-primary-light: #EADDFF;
  --brand-primary-dark: #21005D;

  /* Semantic Colors / M3 Tertiaries & Secondaries */
  --teal: #006874;
  --teal-light: #97F0FF;
  --teal-dark: #001F24;
  --coral: #984061;
  --coral-light: #FFD9E2;
  --coral-dark: #3E001D;
  --amber: #8B5000;
  --amber-light: #FFDCBE;
  --amber-dark: #2A1700;
  --blue: #0061A4;
  --blue-light: #D1E4FF;
  --blue-dark: #001D36;

  /* Status Colors */
  --success: #146C2E;
  --success-bg: #C4FfcB;
  --warning: #8B5000;
  --warning-bg: #FFDCBE;
  --danger: #B3261E;
  --danger-bg: #F9DEDC;
  --info: #0061A4;
  --info-bg: #D1E4FF;

  /* Neutral Palette / M3 Surfaces & Outlines */
  --gray-50: #FEF7FF;    /* Surface */
  --gray-100: #F7F2FA;   /* Surface Container Low */
  --gray-200: #E7E0EC;   /* Surface Variant */
  --gray-300: #CAC4D0;   /* Outline Variant */
  --gray-400: #79747E;   /* Outline */
  --gray-500: #49454F;   /* On Surface Variant */
  --gray-600: #49454F;
  --gray-700: #1D1B20;   /* On Surface */
  --gray-800: #1D1B20;
  --gray-900: #1D1B20;
  --gray-950: #1D1B20;

  /* Layout */
  --sidebar-width: 280px;
  --navbar-height: 64px;
  
  /* M3 Shape Families */
  --border-radius-sm: 8px;    /* Corners */
  --border-radius-md: 12px;
  --border-radius-lg: 16px;   /* Cards */
  --border-radius-xl: 24px;   /* Elevated Cards */
  --border-radius-full: 9999px; /* Pills (Buttons/Links) */

  /* M3 Elevations */
  --shadow-xs: none;
  --shadow-sm: 0 1px 2px 0 rgba(0,0,0,0.3), 0 1px 3px 1px rgba(0,0,0,0.15);
  --shadow-md: 0 1px 2px 0 rgba(0,0,0,0.3), 0 2px 6px 2px rgba(0,0,0,0.15);
  --shadow-lg: 0 4px 8px 3px rgba(0,0,0,0.15), 0 1px 3px 0 rgba(0,0,0,0.3);
  --shadow-xl: 0 4px 8px 3px rgba(0,0,0,0.15), 0 1px 3px 0 rgba(0,0,0,0.3);

  /* Typography */
  --font-sans: 'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', monospace;

  /* Transitions */
  --transition-fast: 150ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-base: 200ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-slow: 300ms cubic-bezier(0.4, 0, 0.2, 1);
}`;

css = css.replace(/:root\s*\{[\s\S]*?\}\s*\/\* ── Reset/g, newRoot + '\n\n/* ── Reset');

// 3. Remove all linear-gradient elements
css = css.replace(/background:\s*linear-gradient[^;]+;/g, 'background: var(--brand-primary);');

// Fix sidebar background specifically (M3 uses Surface Container Low, no gradient!)
css = css.replace(/\.sidebar\s*\{[^}]+\}/g, (match) => {
  return match.replace(/background: [^;]+;/, 'background: var(--gray-100);\n  border-right: none;');
});
css = css.replace(/\.sidebar-brand-icon\s*\{[^}]+\}/g, (match) => {
  return match.replace(/background: [^;]+;/, 'background: var(--brand-primary-light);\n  color: var(--brand-primary-dark);\n  box-shadow: none;');
});

// Sidebar active links fix padding/margins to match M3 pills
css = css.replace(/\.sidebar-link\s*\{[^}]+\}/g, (match) => {
  return match.replace(/border-radius: var\(--border-radius-md\);/, 'border-radius: var(--border-radius-full);')
              .replace(/margin-bottom: 2px;/, 'margin-bottom: 4px; padding-left: 20px;');
});
css = css.replace(/\.sidebar-link\.active\s*\{[^}]+\}/g, (match) => {
  return match.replace(/background: [^;]+;/, 'background: var(--brand-primary-light);')
              .replace(/color: #fff;/, 'color: var(--brand-primary-dark);');
});
css = css.replace(/\.sidebar-link\.active::before\s*\{[^}]+\}/g, '.sidebar-link.active::before { display: none; }'); // Remove vertical line since it's now a pill

// Update Buttons to Pill Shape (M3)
css = css.replace(/\.btn\s*\{[^}]+\}/g, (match) => {
  return match.replace(/border-radius: var\(--border-radius-md\);/, 'border-radius: var(--border-radius-full);\n  text-transform: none;\n  letter-spacing: 0.1px;');
});

// Update card inputs and buttons box shadows to none or M3 standard
css = css.replace(/box-shadow: 0 1px 3px rgba\(83, 74, 183, 0\.3\);/g, 'box-shadow: none;');
css = css.replace(/box-shadow: 0 4px 12px rgba\(83, 74, 183, 0\.35\);/g, 'box-shadow: var(--shadow-sm);');

// Turn inputs into M3 outlined text fields
css = css.replace(/\.form-input,\n\.form-select,\n\.form-textarea\s*\{[^}]+\}/g, (match) => {
  return match.replace(/border-radius: var\(--border-radius-md\);/, 'border-radius: var(--border-radius-sm);')
              .replace(/background: #fff;/, 'background: var(--gray-50);');
});
css = css.replace(/\.form-input:focus,\n\.form-select:focus,\n\.form-textarea:focus\s*\{[^}]+\}/g, (match) => {
  return match.replace(/box-shadow: [^;]+;/, 'box-shadow: inset 0 0 0 1px var(--brand-primary);'); // M3 has 2px solid border, simulated via inset shadow
});

// Make Stat Cards elevated M3
css = css.replace(/\.stat-card\s*\{[^}]+\}/g, (match) => {
  return match.replace(/border: 1px solid var\(--gray-200\);/, 'border: none;\n  background: var(--gray-100);\n  border-radius: var(--border-radius-lg);');
});
css = css.replace(/\.stat-card::after\s*\{[^}]+\}/g, '.stat-card::after { display: none; }'); // Remove old bottom borders

fs.writeFileSync('src/public/css/style.css', css, 'utf8');
console.log('M3 token replacements applied correctly!');
