const { createCanvas, loadImage } = require('canvas');
const fs = require('fs');
const path = require('path');

/**
 * Generates a personalized image by adding centered text to a template.
 *
 * This function loads a base image, calculates the correct position to avoid
 * overlapping with logos, and adds the provided text with a larger font.
 * The final image is then saved to the output directory.
 */
async function generatePersonalizedImage() {
  try {
    // --- Configuration ---
    // Ensure you have the template image at this path
    const templatePath = path.join(__dirname, '../assets/investment-footer.jpg');
    const outputDir = path.join(__dirname, '../output');
    const yourText = 'Abu Inshah | ARN 123456 | +91 98765 43210';
    const fontSize = 65; // Increased font size for better visibility

    // --- Setup ---
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const template = await loadImage(templatePath);
    const canvas = createCanvas(template.width, template.height);
    const ctx = canvas.getContext('2d');

    // 1) Draw the original template image onto the canvas
    ctx.drawImage(template, 0, 0, canvas.width, canvas.height);

    // 2) Set up a larger, bold font for the text
    ctx.font = `bold ${fontSize}px Sans`;
    ctx.fillStyle = '#000000'; // Black color for the text
    ctx.textBaseline = 'middle'; // Aligns text vertically to the center

    // 3) Measure the text to determine its width for centering
    const metrics = ctx.measureText(yourText);
    const textWidth = metrics.width;
    const textHeight = fontSize; // Approximate height of the text

    // 4) Calculate the position for the text to be centered horizontally
    //    and placed correctly in the footer area vertically.
    const padding = 40; // Horizontal padding for the background box
    const boxWidth = textWidth + padding;
    const boxHeight = textHeight + 20; // Vertical padding for the background box

    // Horizontally center the box in the middle of the canvas
    const boxX = (canvas.width - boxWidth) / 2;
    // Vertically position the box within the white footer area, moved up
    const boxY = canvas.height - boxHeight - 90; // Increased vertical offset to 90

    // 5) The footer is already white, so clearing a rectangle isn't strictly
    //    necessary, but it ensures a clean background for the text.
    ctx.fillStyle = '#FFFFFF'; // White background for the text box
    ctx.fillRect(boxX, boxY, boxWidth, boxHeight);

    // 6) Draw the text inside the centered box
    const textX = boxX + (padding / 2); // Position text with left padding
    const textY = boxY + (boxHeight / 2); // Vertically center text in the box
    ctx.fillStyle = '#000000'; // Set text color back to black
    ctx.fillText(yourText, textX, textY);

    // 7) Save the newly created image to the output directory
    const outPath = path.join(outputDir, `personalized_${Date.now()}.png`);
    fs.writeFileSync(outPath, canvas.toBuffer('image/png'));
    console.log('✅ Personalized image saved successfully:', outPath);
    return outPath;

  } catch (err) {
    // Basic error handling
    console.error('❌ An error occurred while generating the image:', err);
    throw err;
  }
}

module.exports = { generatePersonalizedImage };
