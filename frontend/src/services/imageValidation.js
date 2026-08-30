/**
 * NetraScan Client-Side Retinal Fundus Anatomical & Chromaticity Gatekeeper
 * Evaluates whether an uploaded image is an authentic retinal fundus photograph
 * BEFORE sending any heavy preprocessing or AI inference requests.
 */

export const validateFundusClientSide = async (file) => {
  if (!file) {
    return {
      isValid: false,
      reason: "No image file provided.",
      recommendation: "Please select an image file to upload.",
    };
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          const width = 256;
          const height = 256;
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d", { willReadFrequently: true });
          if (!ctx) {
            // If canvas context fails, defer to backend validation
            resolve({ isValid: true });
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);
          const imgData = ctx.getImageData(0, 0, width, height);
          const data = imgData.data;

          // 1. Check 4 corners for ophthalmic camera aperture / circular field of view
          const cornerW = Math.max(5, Math.floor(width * 0.08));
          const cornerH = Math.max(5, Math.floor(height * 0.08));
          let cornerTotal = 0;
          let cornerDarkCount = 0;
          let cornerWhiteCount = 0;

          const checkCornerPixel = (x, y) => {
            const idx = (y * width + x) * 4;
            const r = data[idx];
            const g = data[idx + 1];
            const b = data[idx + 2];
            const maxVal = Math.max(r, g, b);
            const minVal = Math.min(r, g, b);
            cornerTotal++;
            if (maxVal < 45) cornerDarkCount++;
            if (minVal > 220) cornerWhiteCount++;
          };

          for (let y = 0; y < cornerH; y++) {
            for (let x = 0; x < cornerW; x++) {
              checkCornerPixel(x, y); // Top-left
              checkCornerPixel(width - 1 - x, y); // Top-right
              checkCornerPixel(x, height - 1 - y); // Bottom-left
              checkCornerPixel(width - 1 - x, height - 1 - y); // Bottom-right
            }
          }

          const cornerDarkFraction = cornerDarkCount / cornerTotal;
          const cornerWhiteFraction = cornerWhiteCount / cornerTotal;
          const hasApertureBorder = cornerDarkFraction >= 0.45 || cornerWhiteFraction >= 0.45;

          // 2. Segment illuminated retinal tissue
          let tissueCount = 0;
          let sumR = 0, sumG = 0, sumB = 0;
          let sumSat = 0;
          let retinalHueCount = 0;
          let retinalChromaCount = 0;
          let blueColdCount = 0;
          let greenPlantCount = 0;
          let sumColorVariance = 0;

          for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];

            // Exclude dark borders (< 22) and white canvas (> 235 with low sat)
            const isDark = r < 22 && g < 22 && b < 22;
            const maxC = Math.max(r, g, b);
            const minC = Math.min(r, g, b);
            const delta = maxC - minC;
            const sat = maxC > 0 ? (delta / maxC) * 255 : 0;
            const isWhite = r > 235 && g > 235 && b > 235 && sat < 30;

            if (!isDark && !isWhite) {
              tissueCount++;
              sumR += r;
              sumG += g;
              sumB += b;
              sumSat += sat;

              // Hue calculation [0..360]
              let hue = 0;
              if (delta > 0) {
                if (maxC === r) {
                  hue = ((g - b) / delta) % 6;
                } else if (maxC === g) {
                  hue = (b - r) / delta + 2;
                } else {
                  hue = (r - g) / delta + 4;
                }
                hue = Math.round(hue * 60);
                if (hue < 0) hue += 360;
              }

              // Retinal hue band in degrees: [0..45] or [330..360]
              if (hue <= 45 || hue >= 330) {
                retinalHueCount++;
              }

              // Retinal chroma: R exceeds G and B significantly
              if (r >= g * 1.08 && r >= b * 1.30) {
                retinalChromaCount++;
              }

              // Blue cold dominance (sky, blue shirt, UI)
              if (b > r + 5) {
                blueColdCount++;
              }

              // Green foliage dominance (plants, grass, clothing)
              if (g > r + 15) {
                greenPlantCount++;
              }

              sumColorVariance += Math.abs(r - g) + Math.abs(r - b);
            }
          }

          const totalPixels = width * height;
          const tissueRatio = tissueCount / totalPixels;

          if (tissueRatio < 0.08) {
            resolve({
              isValid: false,
              reason: "Non-fundus image detected: No illuminated retinal field found (mostly empty, black, or document canvas).",
              recommendation: "Please upload a valid retinal fundus photograph. Human photos, animals, documents, screenshots, and other non-retinal images are not accepted for screening.",
            });
            return;
          }

          const meanR = sumR / tissueCount;
          const meanG = sumG / tissueCount;
          const meanB = sumB / tissueCount;
          const totalIntensity = meanR + meanG + meanB + 1e-5;
          const rRatio = meanR / totalIntensity;
          const gRatio = meanG / totalIntensity;
          const bRatio = meanB / totalIntensity;

          const rbRatio = meanR / (meanB + 1e-5);
          const rgRatio = meanR / (meanG + 1e-5);
          const meanSat = sumSat / tissueCount;
          const retinalHueFraction = retinalHueCount / tissueCount;
          const retinalChromaFraction = retinalChromaCount / tissueCount;
          const blueColdFraction = blueColdCount / tissueCount;
          const greenPlantFraction = greenPlantCount / tissueCount;
          const meanColorVariance = sumColorVariance / tissueCount;

          console.log("[Client Fundus Gate]", {
            hasApertureBorder,
            cornerDarkFraction: cornerDarkFraction.toFixed(2),
            meanSat: meanSat.toFixed(1),
            rgRatio: rgRatio.toFixed(2),
            rbRatio: rbRatio.toFixed(2),
            retinalChromaFraction: retinalChromaFraction.toFixed(2),
            retinalHueFraction: retinalHueFraction.toFixed(2),
            blueColdFraction: blueColdFraction.toFixed(2),
          });

          // 1. Monochromatic / Document Check
          if (meanColorVariance < 5.0 || meanSat < 15.0) {
            resolve({
              isValid: false,
              reason: "Non-fundus image detected: uploaded image lacks retinal chromaticity (document, screenshot, or grayscale scan).",
              recommendation: "Please upload a valid retinal fundus photograph. Human photos, animals, documents, screenshots, and other non-retinal images are not accepted for screening.",
            });
            return;
          }

          // 2. Blue / Cold Channel Rejection (Sky, blue clothing, outdoor scenes)
          if (bRatio > 0.35 || blueColdFraction > 0.20) {
            resolve({
              isValid: false,
              reason: "Non-fundus image detected: color spectrum does not match retinal fundus illumination (excessive blue/cyan components).",
              recommendation: "Please upload a valid retinal fundus photograph. Human photos, animals, documents, screenshots, and other non-retinal images are not accepted for screening.",
            });
            return;
          }

          // 3. Green Foliage Rejection (Grass, plants, outdoor objects)
          if (greenPlantFraction > 0.20 || gRatio > 0.42) {
            resolve({
              isValid: false,
              reason: "Non-fundus image detected: green-dominant spectrum typical of foliage, clothing, or non-medical objects.",
              recommendation: "Please upload a valid retinal fundus photograph. Human photos, animals, documents, screenshots, and other non-retinal images are not accepted for screening.",
            });
            return;
          }

          // 4. Human Portrait / Face / Selfie / Natural Scene Detection
          if (!hasApertureBorder) {
            if (meanSat < 75.0 || rgRatio < 1.28 || retinalChromaFraction < 0.40) {
              resolve({
                isValid: false,
                reason: "Non-fundus image detected: uploaded image does not contain retinal fundus characteristics (human portrait, selfie, or non-medical photo).",
                recommendation: "Please upload a valid retinal fundus photograph. Human photos, animals, documents, screenshots, and other non-retinal images are not accepted for screening.",
              });
              return;
            }
          } else {
            if (meanSat < 35.0 || rgRatio < 1.15 || retinalChromaFraction < 0.20) {
              resolve({
                isValid: false,
                reason: "Non-fundus image detected: image lacks characteristic retinal tissue chromaticity.",
                recommendation: "Please upload a valid retinal fundus photograph. Human photos, animals, documents, screenshots, and other non-retinal images are not accepted for screening.",
              });
              return;
            }
          }

          // 5. Lack of Choroidal Warmth
          if (rbRatio < 1.50) {
            resolve({
              isValid: false,
              reason: "Non-fundus image detected: lack of characteristic retinal choroidal red-channel dominance.",
              recommendation: "Please upload a valid retinal fundus photograph. Human photos, animals, documents, screenshots, and other non-retinal images are not accepted for screening.",
            });
            return;
          }

          // 6. Retinal Hue Band Rejection
          if (retinalHueFraction < 0.45) {
            resolve({
              isValid: false,
              reason: "Non-fundus image detected: color hue distribution falls outside the ophthalmic retinal spectrum.",
              recommendation: "Please upload a valid retinal fundus photograph. Human photos, animals, documents, screenshots, and other non-retinal images are not accepted for screening.",
            });
            return;
          }

          resolve({ isValid: true });
        } catch (err) {
          console.warn("[Client Fundus Gate Warning]:", err);
          // On any canvas parse error, fallback to backend validation
          resolve({ isValid: true });
        }
      };
      img.onerror = () => {
        resolve({
          isValid: false,
          reason: "Unable to read image file data.",
          recommendation: "Please select a standard JPEG or PNG image.",
        });
      };
      img.src = e.target.result;
    };
    reader.onerror = () => {
      resolve({
        isValid: false,
        reason: "Failed to load image from local storage.",
        recommendation: "Please select an image file to upload.",
      });
    };
    reader.readAsDataURL(file);
  });
};
