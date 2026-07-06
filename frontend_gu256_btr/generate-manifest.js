const fs = require('fs');
const path = require('path');

const sequenceDir = path.join(__dirname, 'hero-sequence');

function generateManifest() {
  try {
    if (!fs.existsSync(sequenceDir)) {
      console.error(`Error: Directory not found at ${sequenceDir}`);
      return;
    }

    const files = fs.readdirSync(sequenceDir);
    const webpFiles = files
      .filter(file => file.toLowerCase().endsWith('.webp'))
      .sort((a, b) => {
        // Sort alphabetically/numerically since they are named frame_000_delay...
        return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
      });

    const manifest = {
      frames: webpFiles
    };

    fs.writeFileSync(
      path.join(sequenceDir, 'manifest.json'),
      JSON.stringify(manifest, null, 2),
      'utf-8'
    );

    console.log(`Successfully generated manifest.json with ${webpFiles.length} frames.`);
  } catch (err) {
    console.error('Error generating manifest:', err);
  }
}

generateManifest();
