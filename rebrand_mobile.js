const fs = require('fs');
const path = require('path');

function replaceInDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      replaceInDir(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      // Hex colors
      content = content.replace(/#ff6b35/gi, '#10b981');
      content = content.replace(/#ff6b3533/gi, '#10b98133');
      
      // Emojis
      content = content.replace(/🔥/g, '🌱');
      
      // Leftover texts
      content = content.replace(/STREAKFIT/g, 'VITATRIBE');
      content = content.replace(/STREAK<Text style={{color: '#10b981'}}>FIT/g, "VITA<Text style={{color: '#10b981'}}>TRIBE");
      content = content.replace(/FIT<Text style={{color: '#10b981'}}>BRIDGE/g, "VITA<Text style={{color: '#10b981'}}>TRIBE");
      
      fs.writeFileSync(fullPath, content, 'utf8');
    }
  }
}

replaceInDir(path.join(__dirname, 'app'));
console.log('Mobile rebranding completed successfully.');
