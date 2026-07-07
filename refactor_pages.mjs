import fs from 'fs';
import path from 'path';

const routes = [
  'users',
  'kyc',
  'campaigns',
  'moderation',
  'finance',
  'support',
  'settings',
  'settings/admins',
  'settings/security-logs',
  'settings/bans'
];

const basePath = './src/app/admin';

for (const route of routes) {
  const filePath = path.join(basePath, route, 'page.tsx');
  if (!fs.existsSync(filePath)) {
    console.log(`Skipping ${filePath}, does not exist.`);
    continue;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');

  // Fix imports
  if (!content.includes('import { CommandHeader }')) {
    content = content.replace(/(import .* from ['"]@\/app\/components\/ui\/core['"];?)/, 
      `import { CommandHeader } from "@/app/components/shared/CommandHeader";
import { DataSurface } from "@/app/components/shared/DataSurface";
import { StatusPill } from "@/app/components/shared/StatusPill";
import { GlassPanel } from "@/app/components/shared/GlassPanel";
$1`);
  }
  
  // Replace PageHeader with CommandHeader
  content = content.replace(/<PageHeader/g, '<CommandHeader');
  content = content.replace(/<\/PageHeader>/g, '</CommandHeader>');
  content = content.replace(/subtitle=/g, 'description=');
  
  // Replace StatusBadge with StatusPill
  content = content.replace(/<StatusBadge/g, '<StatusPill');
  content = content.replace(/status=\{([^}]+)\}/g, (match) => {
    // wait, if there's status={...} inside StatusBadge/StatusPill we replace with label={...}
    // But other components might use status={...}
    return match;
  });

  // A safer regex for StatusBadge status to label
  content = content.replace(/(<StatusPill[^>]*?)status=({[^}]+}|"[^"]+")/g, '$1label=$2');
  
  // Replace section-spacing
  content = content.replace(/className="section-spacing"/g, 'className="space-y-5"');
  
  // Wrap DataTable in DataSurface if not already wrapped
  // Note: we'll wrap it by finding <DataTable ... /> and replacing
  // Since DataTable can have multiple lines, we'll use a regex
  // But regex for multi-line component is tricky. Let's do it manually if it fails.
  if (!content.includes('<DataSurface>\n          <DataTable')) {
      content = content.replace(/(<DataTable[\s\S]*?\/>)/g, '<DataSurface>\n          $1\n        </DataSurface>');
  }

  // Same for any large grids that should be GlassPanels, but prompt just says "Main content uses glass panels." 
  // Let's replace some surface classes with GlassPanel if they exist.
  // Actually, just changing section-spacing and DataSurface is mostly what's needed.

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Updated ${filePath}`);
}
