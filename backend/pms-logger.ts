import { promises as fs } from 'fs';
import { join } from 'path';

/**
 * PMS Interface Logger
 * Creates timestamped log files for PMS interface calls
 */
export async function logPmsInterface(data: {
  date?: any;
  customer?: any;
  insurance?: any;
  schedule?: any;
  [key: string]: any;
}): Promise<string> {
  try {
    const now = new Date();
    const timestamp = now.toISOString().replace(/[:.]/g, '-').replace('T', '_').split('Z')[0];
    const logFileName = `${timestamp}.log`;
    const logsDir = join(process.cwd(), 'logs', 'pms-if');

    // Ensure logs directory exists
    await fs.mkdir(logsDir, { recursive: true });

    const logFilePath = join(logsDir, logFileName);

    // Format log content
    const logContent = {
      timestamp: now.toISOString(),
      receivedAt: now.toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' }),
      data: {
        date: data.date || null,
        customer: data.customer || null,
        insurance: data.insurance || null,
        schedule: data.schedule || null,
        ...Object.keys(data).reduce((acc, key) => {
          if (!['date', 'customer', 'insurance', 'schedule'].includes(key)) {
            acc[key] = data[key];
          }
          return acc;
        }, {} as Record<string, any>)
      }
    };

    // Write log file
    await fs.writeFile(
      logFilePath,
      JSON.stringify(logContent, null, 2),
      'utf-8'
    );

    console.log(`[PMS-IF] Log created: ${logFileName}`);

    return logFileName;
  } catch (error) {
    console.error('[PMS-IF] Failed to create log file:', error);
    throw new Error('Failed to create log file');
  }
}

/**
 * Get list of PMS interface log files
 */
export async function getPmsLogs(limit = 100): Promise<string[]> {
  try {
    const logsDir = join(process.cwd(), 'logs', 'pms-if');

    // Check if directory exists
    try {
      await fs.access(logsDir);
    } catch {
      return [];
    }

    const files = await fs.readdir(logsDir);
    const logFiles = files
      .filter(f => f.endsWith('.log'))
      .sort()
      .reverse()
      .slice(0, limit);

    return logFiles;
  } catch (error) {
    console.error('[PMS-IF] Failed to get log files:', error);
    return [];
  }
}

/**
 * Read a specific log file
 */
export async function readPmsLog(filename: string): Promise<any> {
  try {
    const logsDir = join(process.cwd(), 'logs', 'pms-if');
    const logFilePath = join(logsDir, filename);

    const content = await fs.readFile(logFilePath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error(`[PMS-IF] Failed to read log file ${filename}:`, error);
    throw new Error('Failed to read log file');
  }
}
