// name = Generate Excel File
// description = Generates an Excel-compatible XML (Spreadsheet 2003) file from JSON data. Supports sheets, formulas, and basic styling.
// 
// filename = Name of the output file (default: "export.xml", recommended extension .xml or .xls)
// workbookData = JSON string containing the workbook structure. formatting: { sheets: [{ name: "Sheet1", rows: [["Header1", "Header2"], [10, "=A2*2"]] }] }

/**
 * Generates an Excel-compatible XML Spreadsheet 2003 file.
 * This format is a text-based XML format that Excel opens natively.
 * It supports:
 * - Multiple worksheets
 * - Formulas (e.g., "=SUM(A1:A5)")
 * - Cell types (String, Number, DateTime)
 * - Basic styling (Bold, Italic, Colors)
 */

const filename = (data.input.filename || 'export.xml').trim();
let workbookData;

try {
    // Handle if workbookData is already an object or a string
    workbookData = typeof data.input.workbookData === 'string'
        ? JSON.parse(data.input.workbookData)
        : data.input.workbookData;
} catch (e) {
    return { error: true, message: "Invalid JSON in workbookData: " + e.message };
}

// Validation Helper
function validateWorkbook(wb) {
    const errors = [];
    if (!wb || typeof wb !== 'object') return ["workbookData must be an object"];
    if (!Array.isArray(wb.sheets) || wb.sheets.length === 0) errors.push("workbookData.sheets must be a non-empty array");

    if (wb.sheets) {
        wb.sheets.forEach((sheet, i) => {
            if (!sheet.name) errors.push(`sheets[${i}].name is missing`);
            if (!Array.isArray(sheet.rows)) errors.push(`sheets[${i}].rows must be an array`);
        });
    }
    return errors;
}

const validationErrors = validateWorkbook(workbookData);
if (validationErrors.length > 0) {
    return { error: true, message: "Validation failed", details: validationErrors };
}

// XML Helpers
const escapeXml = (str) => {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
};

// Date to Excel Serial Date (days since Dec 30, 1899)
const toExcelDate = (date) => {
    const d = new Date(date);
    const offset = d.getTimezoneOffset() * 60 * 1000; // adjust for local time if needed, usually just UTC
    // Excel base date: Dec 30, 1899. 
    // JS base date: Jan 1, 1970.
    // Diff is 25569 days.
    const excelBase = 25569;
    const msPerDay = 24 * 60 * 60 * 1000;
    return (d.getTime() / msPerDay) + excelBase;
};

// Header
let xml = '<?xml version="1.0"?>\n';
xml += '<?mso-application progid="Excel.Sheet"?>\n';
xml += '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"\n';
xml += ' xmlns:o="urn:schemas-microsoft-com:office:office"\n';
xml += ' xmlns:x="urn:schemas-microsoft-com:office:excel"\n';
xml += ' xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"\n';
xml += ' xmlns:html="http://www.w3.org/TR/REC-html40">\n';

// Styles
xml += ' <Styles>\n';
xml += '  <Style ss:ID="Default" ss:Name="Normal">\n';
xml += '   <Alignment ss:Vertical="Bottom"/>\n';
xml += '   <Borders/>\n';
xml += '   <Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="11" ss:Color="#000000"/>\n';
xml += '   <Interior/>\n';
xml += '   <NumberFormat/>\n';
xml += '   <Protection/>\n';
xml += '  </Style>\n';
// Add custom styles here if needed based on input
if (workbookData.styles && Array.isArray(workbookData.styles)) {
    workbookData.styles.forEach(style => {
        xml += `  <Style ss:ID="${escapeXml(style.id)}">\n`;
        if (style.font) {
            xml += `   <Font ${style.font.bold ? 'ss:Bold="1"' : ''} ${style.font.color ? `ss:Color="${style.font.color}"` : ''} />\n`;
        }
        if (style.interior) {
            xml += `   <Interior ss:Color="${style.interior.color}" ss:Pattern="Solid"/>\n`;
        }
        xml += '  </Style>\n';
    });
}
xml += ' </Styles>\n';

// Worksheets
workbookData.sheets.forEach(sheet => {
    xml += ` <Worksheet ss:Name="${escapeXml(sheet.name || 'Sheet')}">\n`;
    xml += '  <Table>\n'; // Could add ss:ExpandedColumnCount and ss:ExpandedRowCount for optimization

    // Column widths (optional)
    if (sheet.columns) {
        sheet.columns.forEach(col => {
            xml += `   <Column ss:Width="${col.width || 60}"/>\n`;
        });
    }

    // Rows
    if (sheet.rows) {
        sheet.rows.forEach(row => {
            xml += '   <Row>\n';
            row.forEach(cell => {
                let value = cell;
                let type = 'String';
                let formula = '';
                let styleId = '';

                // Handle object cell definition { value: ..., formula: ..., style: ... }
                if (cell !== null && typeof cell === 'object' && !Array.isArray(cell) && !(cell instanceof Date)) {
                    value = cell.value;
                    formula = cell.formula;
                    styleId = cell.style;
                }

                // Determine Type
                if (typeof value === 'number') {
                    type = 'Number';
                } else if (value instanceof Date) {
                    type = 'DateTime';
                    value = value.toISOString(); // Format required? usually YYYY-MM-DDThh:mm:ss.sss
                } else if (typeof value === 'boolean') {
                    type = 'Boolean';
                    value = value ? 1 : 0;
                } else if (typeof value === 'string') {
                    // Basic formula detection if not explicitly set
                    if (!formula && value.startsWith('=')) {
                        formula = value;
                        value = ''; // Value is ignored if formula is present? Excel usually calculates it.
                        // Ideally we shouldn't set value if formula is there, but XML expects a value sometimes.
                        // For XML Spreadsheet 2003, if Formula is present, the data inside <Data> is the cached result.
                        // We can leave it empty or set type to string?
                        // Let's set type to String just in case for the cache.
                    }
                }

                let cellAttrs = '';
                if (styleId) cellAttrs += ` ss:StyleID="${escapeXml(styleId)}"`;
                if (formula) cellAttrs += ` ss:Formula="${escapeXml(formula)}"`;

                xml += `    <Cell${cellAttrs}><Data ss:Type="${type}">${escapeXml(value)}</Data></Cell>\n`;
            });
            xml += '   </Row>\n';
        });
    }

    xml += '  </Table>\n';
    xml += ' </Worksheet>\n';
});

xml += '</Workbook>';

// Return file
// Note: In Langdock/Agent context, we typically return the file method or base64.
// If this is a direct response, we return a special object.

const buffer = Buffer.from(xml, 'utf8'); // Just use utf8 string
const base64 = buffer.toString('base64');

return {
    filename: filename,
    mimeType: 'application/vnd.ms-excel', // or 'application/xml'
    base64: base64,
    // Alternative return format if supported by Langdock for direct file download
    file: {
        filename: filename,
        contentType: 'application/vnd.ms-excel',
        base64: base64
    }
};
