import { Router } from 'express';
import { logPmsInterface, getPmsLogs, readPmsLog, deletePmsLog } from '../pms-logger';

const router = Router();

/**
 * @openapi
 * /api/pms-if:
 *   post:
 *     tags:
 *       - PMS Interface
 *     summary: PMS Interface Endpoint
 *     description: Receives data from external PMS (Practice Management System) and logs the interface call
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - date
 *               - account
 *               - payload
 *             properties:
 *               date:
 *                 type: object
 *                 description: Date information from PMS
 *                 properties:
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *               account:
 *                 type: object
 *                 description: Account/practice information
 *                 properties:
 *                   name:
 *                     type: string
 *                   key:
 *                     type: string
 *                   accountId:
 *                     type: string
 *               payload:
 *                 type: object
 *                 description: Patient and appointment data
 *                 properties:
 *                   customer:
 *                     type: object
 *                   insurance:
 *                     type: object
 *                   schedule:
 *                     type: object
 *           examples:
 *             full:
 *               summary: Full PMS Interface Request
 *               value:
 *                 date:
 *                   createdAt: "2024-03-09T10:30:00Z"
 *                 account:
 *                   name: "Dtest"
 *                   key: "010-1234-5678"
 *                   accountId: "1234567890"
 *                 payload:
 *                   customer:
 *                     name: "John Doe"
 *                     phone: "010-1234-5678"
 *                     email: "john@example.com"
 *                     dateOfBirth: "1990-01-01"
 *                   insurance:
 *                     company: "ABC Insurance"
 *                     policyNumber: "POL123456"
 *                     groupNumber: "GRP789"
 *                     subscriberName: "John Doe"
 *                   schedule:
 *                     doctorName: "Dr. Smith"
 *                     treatmentType: "Cleaning"
 *                     duration: 30
 *                     room: "Room 101"
 *     responses:
 *       200:
 *         description: Successfully logged PMS interface call
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "PMS interface call logged successfully"
 *                 logFile:
 *                   type: string
 *                   example: "2024-03-09_10-30-45-123.log"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "Failed to log PMS interface call"
 */
router.post('/', async (req, res) => {
  try {
    const { date, account, payload } = req.body;

    // Log the interface call
    const logFileName = await logPmsInterface({ date, account, payload });

    res.status(200).json({
      success: true,
      message: 'PMS interface call logged successfully',
      logFile: logFileName
    });
  } catch (error) {
    console.error('[PMS-IF] Error processing request:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to log PMS interface call'
    });
  }
});

/**
 * @openapi
 * /api/pms-if/logs:
 *   get:
 *     tags:
 *       - PMS Interface
 *     summary: Get PMS interface logs
 *     description: Retrieve list of PMS interface log files
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *         description: Maximum number of log files to return
 *     responses:
 *       200:
 *         description: List of log files
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 logs:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: ["2024-03-09_10-30-45-123.log", "2024-03-09_09-15-30-456.log"]
 */
router.get('/history', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 100;
    const logFiles = await getPmsLogs(limit);

    const records = await Promise.all(
      logFiles.map(async (filename) => {
        try {
          const log = await readPmsLog(filename);
          return {
            id: filename.replace('.log', ''),
            accountId: log.data?.account?.accountId ?? null,
            status: 'received',
            payload: JSON.stringify(log.data),
            createdAt: log.timestamp,
          };
        } catch {
          return null;
        }
      })
    );

    res.status(200).json({
      success: true,
      data: records.filter(Boolean),
    });
  } catch (error) {
    console.error('[PMS-IF] Error getting history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve history',
    });
  }
});

router.get('/logs', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 100;
    const logs = await getPmsLogs(limit);

    res.status(200).json({
      success: true,
      logs
    });
  } catch (error) {
    console.error('[PMS-IF] Error getting logs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve logs'
    });
  }
});

/**
 * @openapi
 * /api/pms-if/logs/{filename}:
 *   get:
 *     tags:
 *       - PMS Interface
 *     summary: Get specific PMS interface log
 *     description: Retrieve content of a specific log file
 *     parameters:
 *       - in: path
 *         name: filename
 *         required: true
 *         schema:
 *           type: string
 *         description: Log file name
 *         example: "2024-03-09_10-30-45-123.log"
 *     responses:
 *       200:
 *         description: Log file content
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 log:
 *                   type: object
 *       404:
 *         description: Log file not found
 *       500:
 *         description: Internal server error
 */
router.get('/logs/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    const log = await readPmsLog(filename);

    res.status(200).json({
      success: true,
      log
    });
  } catch (error) {
    console.error(`[PMS-IF] Error reading log ${req.params.filename}:`, error);
    res.status(404).json({
      success: false,
      error: 'Log file not found'
    });
  }
});

router.delete('/logs/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    await deletePmsLog(filename);
    res.status(200).json({ success: true });
  } catch (error: any) {
    const notFound = error?.code === 'ENOENT' || error?.message === 'Invalid filename';
    res.status(notFound ? 404 : 500).json({
      success: false,
      error: notFound ? 'Log file not found' : 'Failed to delete log file',
    });
  }
});

export default router;
