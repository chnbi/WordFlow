const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs').promises;
const archiver = require('archiver');
const Project = require('../models/Project');
const Translation = require('../models/Translation');
const Glossary = require('../models/Glossary');

class ExportService {
  async generateExcelExport(projectId) {
    try {
      // Fetch project and translations
      const project = await Project.findById(projectId);
      if (!project) {
        throw new Error('Project not found');
      }

      const translations = await Translation.find({
        projectId,
        status: 'approved'
      }).sort({ page: 1, section: 1 });

      const glossary = await Glossary.find({
        version: project.glossaryVersion,
        isActive: true
      }).sort({ category: 1, en: 1 });

      // Create workbook
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'Translation Wrapper';
      workbook.created = new Date();

      // Sheet 1: Content Translations
      await this.createTranslationsSheet(workbook, translations);

      // Sheet 2: Metadata
      await this.createMetadataSheet(workbook, project, translations);

      // Sheet 3: Glossary Reference
      await this.createGlossarySheet(workbook, glossary);

      // Sheet 4: Instructions
      await this.createInstructionsSheet(workbook);

      // Save file
      const filename = `translations_${project.name.replace(/\s+/g, '_')}_${Date.now()}.xlsx`;
      const filepath = path.join(process.cwd(), 'exports', filename);

      await workbook.xlsx.writeFile(filepath);

      const stats = await fs.stat(filepath);

      return {
        filename,
        filepath,
        size: stats.size,
        itemCount: translations.length
      };
    } catch (error) {
      console.error('Excel Export Error:', error);
      throw error;
    }
  }

  async createTranslationsSheet(workbook, translations) {
    const sheet = workbook.addWorksheet('Content Translations');

    // Define columns
    sheet.columns = [
      { header: 'ID', key: 'id', width: 12 },
      { header: 'Page', key: 'page', width: 15 },
      { header: 'Section', key: 'section', width: 15 },
      { header: 'Element Type', key: 'elementType', width: 15 },
      { header: 'Element Name', key: 'elementName', width: 20 },
      { header: 'English (EN)', key: 'en', width: 35 },
      { header: 'Malay (BM)', key: 'bm', width: 35 },
      { header: 'Chinese (ZH)', key: 'zh', width: 35 },
      { header: 'Status', key: 'status', width: 12 },
      { header: 'Notes', key: 'notes', width: 25 }
    ];

    // Style header row
    sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    sheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' }
    };
    sheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };
    sheet.getRow(1).height = 25;

    // Add data rows
    translations.forEach((item, index) => {
      const row = sheet.addRow({
        id: item._id.toString().substring(0, 8),
        page: item.page,
        section: item.section,
        elementType: item.elementType,
        elementName: item.elementName || '-',
        en: item.content.en,
        bm: item.content.bm,
        zh: item.content.zh,
        status: item.status,
        notes: item.notes || (item.glossaryTerms?.length > 0 ? `Glossary: ${item.glossaryTerms.join(', ')}` : '')
      });

      // Alternate row colors
      if (index % 2 === 1) {
        row.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF8F9FA' }
        };
      }

      // Color-code status
      const statusCell = row.getCell('status');
      if (item.status === 'approved') {
        statusCell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFC6EFCE' }
        };
        statusCell.font = { color: { argb: 'FF006100' }, bold: true };
      }

      // Wrap text
      row.eachCell(cell => {
        cell.alignment = { wrapText: true, vertical: 'top' };
      });
    });

    // Freeze header row
    sheet.views = [{ state: 'frozen', ySplit: 1 }];

    // Auto-filter
    sheet.autoFilter = {
      from: 'A1',
      to: `J${translations.length + 1}`
    };
  }

  async createMetadataSheet(workbook, project, translations) {
    const sheet = workbook.addWorksheet('Metadata');

    sheet.columns = [
      { header: 'Property', key: 'property', width: 25 },
      { header: 'Value', key: 'value', width: 50 }
    ];

    sheet.getRow(1).font = { bold: true };

    const approvedCount = translations.filter(t => t.status === 'approved').length;

    sheet.addRows([
      { property: 'Export Date', value: new Date().toISOString() },
      { property: 'Project Name', value: project.name },
      { property: 'Project Description', value: project.description || 'N/A' },
      { property: 'Created By', value: project.createdBy },
      { property: 'Total Items', value: translations.length },
      { property: 'Approved Items', value: approvedCount },
      { property: 'Languages', value: 'EN → BM, ZH' },
      { property: 'Glossary Version', value: project.glossaryVersion }
    ]);

    // Style
    sheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1) {
        row.getCell(1).font = { bold: true };
      }
    });
  }

  async createGlossarySheet(workbook, glossary) {
    const sheet = workbook.addWorksheet('Glossary Reference');

    sheet.columns = [
      { header: 'English', key: 'en', width: 25 },
      { header: 'Malay (BM)', key: 'bm', width: 25 },
      { header: 'Chinese (ZH)', key: 'zh', width: 25 },
      { header: 'Category', key: 'category', width: 15 },
      { header: 'Notes', key: 'notes', width: 35 }
    ];

    sheet.getRow(1).font = { bold: true };
    sheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFFFC000' }
    };

    glossary.forEach(term => {
      const row = sheet.addRow({
        en: term.en,
        bm: term.bm,
        zh: term.zh,
        category: term.category,
        notes: term.doNotTranslate ? 'DO NOT TRANSLATE - Keep as-is' : (term.notes || '')
      });

      // Highlight do-not-translate terms
      if (term.doNotTranslate) {
        row.eachCell(cell => {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFFF2CC' }
          };
        });
      }
    });

    sheet.views = [{ state: 'frozen', ySplit: 1 }];
  }

  async createInstructionsSheet(workbook) {
    const sheet = workbook.addWorksheet('Instructions');

    sheet.mergeCells('A1:D1');
    sheet.getCell('A1').value = 'How to Import Translations into WPML';
    sheet.getCell('A1').font = { size: 16, bold: true, color: { argb: 'FF0066CC' } };
    sheet.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' };
    sheet.getRow(1).height = 30;

    const instructions = `
STEP-BY-STEP IMPORT GUIDE:

1. Open WordPress Admin Panel
   - Navigate to your WordPress site admin dashboard
   - Login with your administrator credentials

2. Access WPML String Translation
   - Go to WPML → String Translation in the sidebar
   - This is where you'll input the translations

3. Import Process
   - Use the "Content Translations" sheet as your source
   - For each row in the sheet:
     a. Locate the corresponding page and element in WPML
     b. Copy the BM translation from column G
     c. Paste into the Malay language field in WPML
     d. Copy the ZH translation from column H
     e. Paste into the Chinese language field in WPML
     f. Click "Save" or "Complete Translation"

4. Verify Translations
   - Preview your website in each language
   - Check that glossary terms appear correctly
   - Verify formatting and punctuation

5. Quality Check
   - Review the "Glossary Reference" sheet
   - Ensure brand terms (like "Yes", "5G") are consistent
   - Check that special characters display correctly (especially Chinese)

TIPS:
- Process translations page by page for better organization
- Use the Excel filter to focus on one page at a time
- Double-check Chinese characters paste correctly
- Test on mobile and desktop views

NEED HELP?
Contact: weyxuan.chin@ytlcomms.my
    `.trim();

    sheet.getCell('A3').value = instructions;
    sheet.getCell('A3').alignment = { wrapText: true, vertical: 'top' };
    sheet.mergeCells('A3:D50');

    sheet.getColumn('A').width = 100;
  }

  async generateJSONExport(projectId) {
    try {
      const project = await Project.findById(projectId);
      if (!project) {
        throw new Error('Project not found');
      }

      const translations = await Translation.find({
        projectId,
        status: 'approved'
      });

      const glossary = await Glossary.find({
        version: project.glossaryVersion,
        isActive: true
      });

      const jsonData = {
        metadata: {
          exportDate: new Date().toISOString(),
          projectId: project._id,
          projectName: project.name,
          description: project.description,
          createdBy: project.createdBy,
          glossaryVersion: project.glossaryVersion,
          languages: ['en', 'bm', 'zh']
        },
        translations: translations.map(t => ({
          id: t._id,
          page: t.page,
          section: t.section,
          elementType: t.elementType,
          elementName: t.elementName,
          content: t.content,
          status: t.status,
          glossaryTerms: t.glossaryTerms,
          sourceType: t.sourceType,
          reviewer: t.reviewer,
          reviewedAt: t.reviewedAt
        })),
        glossary: glossary.map(g => ({
          en: g.en,
          bm: g.bm,
          zh: g.zh,
          category: g.category,
          doNotTranslate: g.doNotTranslate,
          notes: g.notes
        }))
      };

      const filename = `translations_${project.name.replace(/\s+/g, '_')}_${Date.now()}.json`;
      const filepath = path.join(process.cwd(), 'exports', filename);

      await fs.writeFile(filepath, JSON.stringify(jsonData, null, 2), 'utf-8');

      const stats = await fs.stat(filepath);

      return {
        filename,
        filepath,
        size: stats.size,
        itemCount: translations.length
      };
    } catch (error) {
      console.error('JSON Export Error:', error);
      throw error;
    }
  }

  async generateExportPackage(projectId, options = {}) {
    try {
      const files = {};

      // Generate Excel (always included)
      files.excel = await this.generateExcelExport(projectId);

      // Generate JSON if requested
      if (options.includeJSON) {
        files.json = await this.generateJSONExport(projectId);
      }

      // Create ZIP package
      if (options.createZip) {
        const project = await Project.findById(projectId);
        const zipFilename = `export_package_${project.name.replace(/\s+/g, '_')}_${Date.now()}.zip`;
        const zipPath = path.join(process.cwd(), 'exports', zipFilename);

        await this.createZipArchive(zipPath, files);

        const stats = await fs.stat(zipPath);

        files.zip = {
          filename: zipFilename,
          filepath: zipPath,
          size: stats.size
        };
      }

      return files;
    } catch (error) {
      console.error('Export Package Error:', error);
      throw error;
    }
  }

  async createZipArchive(zipPath, files) {
    return new Promise((resolve, reject) => {
      const output = require('fs').createWriteStream(zipPath);
      const archive = archiver('zip', { zlib: { level: 9 } });

      output.on('close', () => resolve());
      archive.on('error', err => reject(err));

      archive.pipe(output);

      // Add Excel file
      if (files.excel) {
        archive.file(files.excel.filepath, { name: files.excel.filename });
      }

      // Add JSON file if exists
      if (files.json) {
        archive.file(files.json.filepath, { name: files.json.filename });
      }

      // Add README
      const readme = this.generateREADME();
      archive.append(readme, { name: 'README.txt' });

      archive.finalize();
    });
  }

  generateREADME() {
    return `
TRANSLATION EXPORT PACKAGE
==========================

Generated by: Translation Wrapper
Export Date: ${new Date().toISOString()}

FILES INCLUDED:
--------------
1. translations_*.xlsx - Main translation file for WPML import
2. translations_*.json - Structured data (optional, for automation)
3. README.txt - This file

IMPORT INSTRUCTIONS:
-------------------
Please refer to the "Instructions" sheet in the Excel file for
detailed step-by-step guidance on importing into WPML.

FILE STRUCTURE:
--------------
Excel file contains 4 sheets:
- Content Translations: All approved translations
- Metadata: Project information and statistics
- Glossary Reference: Brand terminology reference
- Instructions: Detailed import guide

SUPPORT:
--------
For questions or issues, contact:
Email: weyxuan.chin@ytlcomms.my

Translation Wrapper v1.0
YTL Communications Sdn. Bhd.
    `.trim();
  }
}

module.exports = new ExportService();
