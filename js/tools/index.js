import { TOOLS } from './registry.js';
import { initCaseConverter } from './case.js';
import { initCounterTool } from './counter.js';
import { initDateTimeTool } from './datetime.js';
import { initEncoderTool } from './encode.js';
import { initHashGenerator } from './hash.js';
import { initJsonFormatter } from './json.js';
import { initPasswordTool } from './password.js';
import { initQrGenerator } from './qr.js';
import { initRandomGenerator } from './random.js';
import { initSpeedTest } from './speed.js';
import { initTimerTool } from './timer.js';
import { initTimezoneConverter } from './timezone.js';
import { initUnitConverter } from './converter.js';
import { initUuidGenerator } from './uuid.js';

export { TOOLS };

export function initToolModules() {
  initPasswordTool();
  initHashGenerator();
  initCaseConverter();
  initCounterTool();
  initJsonFormatter();
  initEncoderTool();
  initQrGenerator();
  initSpeedTest();
  initTimezoneConverter();
  initDateTimeTool();
  initTimerTool();
  initRandomGenerator();
  initUuidGenerator();
  initUnitConverter();
}
