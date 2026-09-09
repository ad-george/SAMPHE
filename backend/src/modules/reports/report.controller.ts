import { Request, Response, NextFunction } from 'express';
import { ReportService } from './report.service';

const service = new ReportService();

export const getReport = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await service.getReport(req.params.sessionId);
    res.json({ success: true, data });
  } catch (error: any) {
    next({ statusCode: 400, message: error.message });
  }
};

export const downloadPDF = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const pdf = await service.generatePDF(req.params.sessionId);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=attendance-report.pdf');
    res.send(pdf);
  } catch (error: any) {
    next({ statusCode: 400, message: error.message });
  }
};

export const downloadExcel = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const excel = await service.generateExcel(req.params.sessionId);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=attendance-report.xlsx');
    res.send(excel);
  } catch (error: any) {
    next({ statusCode: 400, message: error.message });
  }
};