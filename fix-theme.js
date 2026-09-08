const fs = require('fs');
const glob = require('glob'); // Not available? We can use recursive readdir

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = dir + '/' + file;
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(walk(file));
    } else { 
      if (file.endsWith('.jsx')) results.push(file);
    }
  });
  return results;
}

const files = walk('/Users/rashijaiswal/Documents/GitHub/LabourChowck/frontend/src/panels/vendor');
files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let newContent = content
    .replace(/bm-orange/g, 'brand')
    .replace(/bm-terracotta/g, 'brand-bright')
    .replace(/from-\[#7a280e\] to-\[#c45c26\]/g, 'from-slate-900 via-slate-800 to-slate-950')
    .replace(/from-\[#c45c26\] to-\[#7a280e\]/g, 'from-brand to-brand-bright')
    .replace(/bg-\[#7a280e\]/g, 'bg-brand')
    .replace(/bg-\[#c45c26\]/g, 'bg-brand-bright')
    .replace(/text-\[#7a280e\]/g, 'text-brand')
    .replace(/text-\[#c45c26\]/g, 'text-brand-bright')
    .replace(/border-\[#7a280e\]/g, 'border-brand')
    .replace(/border-\[#c45c26\]/g, 'border-brand-bright')
    .replace(/shadow-orange-500\/40/g, 'shadow-brand/40')
    .replace(/bg-orange-500\/20/g, 'bg-brand/20')
    .replace(/buildmart-gradient-soft/g, 'bg-slate-50')
    .replace(/bg-orange-50/g, 'bg-emerald-50')
    .replace(/text-orange-100/g, 'text-emerald-100')
    .replace(/text-orange-200/g, 'text-emerald-200')
    .replace(/text-orange-50/g, 'text-emerald-50')
    .replace(/shadow-\[0_8px_30px_rgb\(196,92,38,0\.3\)\]/g, 'shadow-brand/30')
    .replace(/shadow-\[0_8px_30px_rgb\(196,92,38,0\.5\)\]/g, 'shadow-brand/50')
    .replace(/from-amber-400 to-orange-500/g, 'from-brand-bright to-brand')
    .replace(/bg-indigo-500\/20/g, 'bg-emerald-500/20')
    .replace(/color: '#7a280e'/g, "color: '#10b981'");
    
  if (content !== newContent) {
    fs.writeFileSync(file, newContent, 'utf8');
    console.log('Updated ' + file);
  }
});
