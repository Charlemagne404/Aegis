import { QR_VERSION_TABLE } from './constants.js';
import { clamp } from './shared.js';

export function createQrMatrix(text) {
  const bytes = [...new TextEncoder().encode(text)];
  const version = selectQrVersion(bytes.length);

  if (version < 1) {
    throw new Error('Text is too long.');
  }

  const dataCodewords = createQrDataCodewords(bytes, version);
  const finalCodewords = addQrErrorCorrection(dataCodewords, version);
  const dataBits = finalCodewords.flatMap((codeword) =>
    Array.from({ length: 8 }, (_, index) => getQrBit(codeword, 7 - index)),
  );
  const baseMatrix = createQrBaseMatrix(version);

  placeQrDataBits(baseMatrix, dataBits);

  let bestMatrix = null;
  let bestPenalty = Number.POSITIVE_INFINITY;

  for (let mask = 0; mask < 8; mask += 1) {
    const candidate = cloneQrMatrix(baseMatrix);
    applyQrMask(candidate, mask);
    drawQrFormatBits(candidate, mask);

    const penalty = scoreQrMatrix(candidate.modules);
    if (penalty < bestPenalty) {
      bestPenalty = penalty;
      bestMatrix = candidate.modules;
    }
  }

  return bestMatrix;
}

function selectQrVersion(byteLength) {
  return QR_VERSION_TABLE.findIndex((entry, version) => {
    if (!entry) return false;
    const countBits = version < 10 ? 8 : 16;
    const requiredBits = 4 + countBits + (byteLength * 8);
    const capacityBits = entry.blocks.reduce((sum, blockLength) => sum + blockLength, 0) * 8;
    return requiredBits <= capacityBits;
  });
}

function createQrDataCodewords(bytes, version) {
  const metadata = QR_VERSION_TABLE[version];
  const capacityBits = metadata.blocks.reduce((sum, blockLength) => sum + blockLength, 0) * 8;
  const bits = [];

  appendQrBits(bits, 0x4, 4);
  appendQrBits(bits, bytes.length, version < 10 ? 8 : 16);
  bytes.forEach((byte) => appendQrBits(bits, byte, 8));

  if (bits.length > capacityBits) {
    throw new Error('Text is too long.');
  }

  appendQrBits(bits, 0, Math.min(4, capacityBits - bits.length));
  while (bits.length % 8 !== 0) appendQrBits(bits, 0, 1);

  const codewords = [];
  for (let index = 0; index < bits.length; index += 8) {
    codewords.push(bits.slice(index, index + 8).reduce((value, bit) => (value << 1) | Number(bit), 0));
  }

  const padBytes = [0xec, 0x11];
  let padIndex = 0;
  while (codewords.length < capacityBits / 8) {
    codewords.push(padBytes[padIndex % 2]);
    padIndex += 1;
  }

  return codewords;
}

function appendQrBits(bits, value, length) {
  for (let index = length - 1; index >= 0; index -= 1) {
    bits.push(((value >>> index) & 1) === 1);
  }
}

function addQrErrorCorrection(dataCodewords, version) {
  const metadata = QR_VERSION_TABLE[version];
  const blocks = [];
  let offset = 0;

  metadata.blocks.forEach((blockLength) => {
    const dataBlock = dataCodewords.slice(offset, offset + blockLength);
    blocks.push({
      data: dataBlock,
      error: computeReedSolomonRemainder(dataBlock, metadata.ecCodewords),
    });
    offset += blockLength;
  });

  const result = [];
  const longestDataBlock = Math.max(...blocks.map((block) => block.data.length));

  for (let index = 0; index < longestDataBlock; index += 1) {
    blocks.forEach((block) => {
      if (index < block.data.length) result.push(block.data[index]);
    });
  }

  for (let index = 0; index < metadata.ecCodewords; index += 1) {
    blocks.forEach((block) => result.push(block.error[index]));
  }

  return result;
}

function createQrBaseMatrix(version) {
  const size = (version * 4) + 17;
  const matrix = {
    version,
    size,
    modules: Array.from({ length: size }, () => Array(size).fill(false)),
    reserved: Array.from({ length: size }, () => Array(size).fill(false)),
  };

  drawQrFinderPattern(matrix, 3, 3);
  drawQrFinderPattern(matrix, size - 4, 3);
  drawQrFinderPattern(matrix, 3, size - 4);
  drawQrAlignmentPatterns(matrix, QR_VERSION_TABLE[version].alignment);
  drawQrTimingPatterns(matrix);
  drawQrFormatBits(matrix, 0);

  if (version >= 7) drawQrVersionBits(matrix);

  setQrFunctionModule(matrix, 8, (4 * version) + 9, true);

  return matrix;
}

function cloneQrMatrix(matrix) {
  return {
    version: matrix.version,
    size: matrix.size,
    modules: matrix.modules.map((row) => row.slice()),
    reserved: matrix.reserved.map((row) => row.slice()),
  };
}

function drawQrFinderPattern(matrix, centerX, centerY) {
  for (let y = -4; y <= 4; y += 1) {
    for (let x = -4; x <= 4; x += 1) {
      const distance = Math.max(Math.abs(x), Math.abs(y));
      const moduleX = centerX + x;
      const moduleY = centerY + y;

      if (moduleX < 0 || moduleY < 0 || moduleX >= matrix.size || moduleY >= matrix.size) continue;
      setQrFunctionModule(matrix, moduleX, moduleY, distance !== 2 && distance !== 4);
    }
  }
}

function drawQrAlignmentPatterns(matrix, positions) {
  positions.forEach((centerY) => {
    positions.forEach((centerX) => {
      if (matrix.reserved[centerY]?.[centerX]) return;

      for (let y = -2; y <= 2; y += 1) {
        for (let x = -2; x <= 2; x += 1) {
          const distance = Math.max(Math.abs(x), Math.abs(y));
          setQrFunctionModule(matrix, centerX + x, centerY + y, distance !== 1);
        }
      }
    });
  });
}

function drawQrTimingPatterns(matrix) {
  for (let index = 8; index < matrix.size - 8; index += 1) {
    const isDark = index % 2 === 0;
    setQrFunctionModule(matrix, index, 6, isDark);
    setQrFunctionModule(matrix, 6, index, isDark);
  }
}

function drawQrFormatBits(matrix, mask) {
  const bits = getQrFormatBits(mask);

  for (let index = 0; index <= 5; index += 1) setQrFunctionModule(matrix, 8, index, getQrBit(bits, index));
  setQrFunctionModule(matrix, 8, 7, getQrBit(bits, 6));
  setQrFunctionModule(matrix, 8, 8, getQrBit(bits, 7));
  setQrFunctionModule(matrix, 7, 8, getQrBit(bits, 8));
  for (let index = 9; index < 15; index += 1) setQrFunctionModule(matrix, 14 - index, 8, getQrBit(bits, index));

  for (let index = 0; index < 8; index += 1) setQrFunctionModule(matrix, matrix.size - 1 - index, 8, getQrBit(bits, index));
  for (let index = 8; index < 15; index += 1) setQrFunctionModule(matrix, 8, matrix.size - 15 + index, getQrBit(bits, index));
  setQrFunctionModule(matrix, 8, matrix.size - 8, true);
}

function drawQrVersionBits(matrix) {
  const bits = getQrVersionBits(matrix.version);

  for (let index = 0; index < 18; index += 1) {
    const bit = getQrBit(bits, index);
    const x = matrix.size - 11 + (index % 3);
    const y = Math.floor(index / 3);
    setQrFunctionModule(matrix, x, y, bit);
    setQrFunctionModule(matrix, y, x, bit);
  }
}

function setQrFunctionModule(matrix, x, y, isDark) {
  if (x < 0 || y < 0 || x >= matrix.size || y >= matrix.size) return;

  matrix.modules[y][x] = Boolean(isDark);
  matrix.reserved[y][x] = true;
}

function placeQrDataBits(matrix, dataBits) {
  let bitIndex = 0;
  let upward = true;

  for (let right = matrix.size - 1; right >= 1; right -= 2) {
    if (right === 6) right -= 1;

    for (let vertical = 0; vertical < matrix.size; vertical += 1) {
      const y = upward ? matrix.size - 1 - vertical : vertical;

      for (let columnOffset = 0; columnOffset < 2; columnOffset += 1) {
        const x = right - columnOffset;
        if (matrix.reserved[y][x]) continue;

        matrix.modules[y][x] = bitIndex < dataBits.length ? dataBits[bitIndex] : false;
        bitIndex += 1;
      }
    }

    upward = !upward;
  }
}

function applyQrMask(matrix, mask) {
  for (let y = 0; y < matrix.size; y += 1) {
    for (let x = 0; x < matrix.size; x += 1) {
      if (!matrix.reserved[y][x] && qrMaskApplies(mask, x, y)) {
        matrix.modules[y][x] = !matrix.modules[y][x];
      }
    }
  }
}

function qrMaskApplies(mask, x, y) {
  if (mask === 0) return (x + y) % 2 === 0;
  if (mask === 1) return y % 2 === 0;
  if (mask === 2) return x % 3 === 0;
  if (mask === 3) return (x + y) % 3 === 0;
  if (mask === 4) return (Math.floor(y / 2) + Math.floor(x / 3)) % 2 === 0;
  if (mask === 5) return ((x * y) % 2) + ((x * y) % 3) === 0;
  if (mask === 6) return (((x * y) % 2) + ((x * y) % 3)) % 2 === 0;
  return (((x + y) % 2) + ((x * y) % 3)) % 2 === 0;
}

function scoreQrMatrix(modules) {
  const size = modules.length;
  let penalty = 0;
  let darkCount = 0;

  const scoreLine = (line) => {
    let linePenalty = 0;
    let runColor = line[0];
    let runLength = 1;

    for (let index = 1; index < line.length; index += 1) {
      if (line[index] === runColor) {
        runLength += 1;
        continue;
      }

      if (runLength >= 5) linePenalty += 3 + (runLength - 5);
      runColor = line[index];
      runLength = 1;
    }

    if (runLength >= 5) linePenalty += 3 + (runLength - 5);

    for (let index = 0; index <= line.length - 7; index += 1) {
      const hasPattern =
        line[index] &&
        !line[index + 1] &&
        line[index + 2] &&
        line[index + 3] &&
        line[index + 4] &&
        !line[index + 5] &&
        line[index + 6];
      const hasQuietBefore = index >= 4 && line.slice(index - 4, index).every((module) => !module);
      const hasQuietAfter = index + 11 <= line.length && line.slice(index + 7, index + 11).every((module) => !module);

      if (hasPattern && (hasQuietBefore || hasQuietAfter)) linePenalty += 40;
    }

    return linePenalty;
  };

  for (let y = 0; y < size; y += 1) {
    penalty += scoreLine(modules[y]);
    for (let x = 0; x < size; x += 1) {
      if (modules[y][x]) darkCount += 1;
    }
  }

  for (let x = 0; x < size; x += 1) {
    penalty += scoreLine(modules.map((row) => row[x]));
  }

  for (let y = 0; y < size - 1; y += 1) {
    for (let x = 0; x < size - 1; x += 1) {
      const color = modules[y][x];
      if (modules[y][x + 1] === color && modules[y + 1][x] === color && modules[y + 1][x + 1] === color) {
        penalty += 3;
      }
    }
  }

  penalty += Math.floor(Math.abs(((darkCount * 100) / (size * size)) - 50) / 5) * 10;
  return penalty;
}

export function drawQrCanvas(canvas, modules, options = {}) {
  const context = canvas?.getContext('2d');
  if (!canvas || !context) return;

  const quietZone = clamp(Number(options.quietZone ?? 4), 0, 12);
  const requestedSize = clamp(Number(options.size ?? 768), 256, 2048);
  const cellSize = Math.max(4, Math.floor(requestedSize / (modules.length + (quietZone * 2))));
  const pixelSize = (modules.length + (quietZone * 2)) * cellSize;

  canvas.width = pixelSize;
  canvas.height = pixelSize;
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, pixelSize, pixelSize);
  context.fillStyle = '#101010';

  modules.forEach((row, y) => {
    row.forEach((isDark, x) => {
      if (!isDark) return;
      context.fillRect((x + quietZone) * cellSize, (y + quietZone) * cellSize, cellSize, cellSize);
    });
  });
}

export function createQrSvg(modules, options = {}) {
  const quietZone = clamp(Number(options.quietZone ?? 4), 0, 12);
  const size = clamp(Number(options.size ?? 768), 256, 2048);
  const dimension = modules.length + (quietZone * 2);
  const path = modules.flatMap((row, y) =>
    row.flatMap((isDark, x) => (isDark ? `M${x + quietZone} ${y + quietZone}h1v1h-1z` : [])),
  ).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${dimension} ${dimension}" width="${size}" height="${size}" shape-rendering="crispEdges" aria-hidden="true">
  <rect width="${dimension}" height="${dimension}" fill="#ffffff"/>
  <path d="${path}" fill="#101010"/>
</svg>`;
}

export function drawQrPlaceholder(canvas) {
  const context = canvas?.getContext('2d');
  if (!canvas || !context) return;

  canvas.width = 512;
  canvas.height = 512;
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.strokeStyle = '#d4d7dc';
  context.lineWidth = 12;
  context.strokeRect(64, 64, 384, 384);
}

function getQrFormatBits(mask) {
  const data = mask;
  let remainder = data << 10;
  const generator = 0x537;

  for (let bit = 14; bit >= 10; bit -= 1) {
    if (((remainder >>> bit) & 1) !== 0) {
      remainder ^= generator << (bit - 10);
    }
  }

  return ((data << 10) | (remainder & 0x3ff)) ^ 0x5412;
}

function getQrVersionBits(version) {
  let remainder = version << 12;
  const generator = 0x1f25;

  for (let bit = 17; bit >= 12; bit -= 1) {
    if (((remainder >>> bit) & 1) !== 0) {
      remainder ^= generator << (bit - 12);
    }
  }

  return (version << 12) | (remainder & 0xfff);
}

function getQrBit(value, bit) {
  return ((value >>> bit) & 1) !== 0;
}

function computeReedSolomonRemainder(data, degree) {
  const divisor = computeReedSolomonDivisor(degree);
  const result = Array(degree).fill(0);

  data.forEach((byte) => {
    const factor = byte ^ result.shift();
    result.push(0);

    divisor.forEach((coefficient, index) => {
      result[index] ^= gfMultiply(coefficient, factor);
    });
  });

  return result;
}

function computeReedSolomonDivisor(degree) {
  const result = Array(degree).fill(0);
  result[degree - 1] = 1;
  let root = 1;

  for (let index = 0; index < degree; index += 1) {
    for (let coefficient = 0; coefficient < degree; coefficient += 1) {
      result[coefficient] = gfMultiply(result[coefficient], root);
      if (coefficient + 1 < degree) result[coefficient] ^= result[coefficient + 1];
    }

    root = gfMultiply(root, 0x02);
  }

  return result;
}

function gfMultiply(left, right) {
  if (left === 0 || right === 0) return 0;

  return QR_GF_EXP[QR_GF_LOG[left] + QR_GF_LOG[right]];
}

const QR_GF_EXP = Array(512);
const QR_GF_LOG = Array(256);
let qrGfValue = 1;

for (let exponent = 0; exponent < 255; exponent += 1) {
  QR_GF_EXP[exponent] = qrGfValue;
  QR_GF_LOG[qrGfValue] = exponent;
  qrGfValue <<= 1;
  if ((qrGfValue & 0x100) !== 0) qrGfValue ^= 0x11d;
}

for (let exponent = 255; exponent < QR_GF_EXP.length; exponent += 1) {
  QR_GF_EXP[exponent] = QR_GF_EXP[exponent - 255];
}
