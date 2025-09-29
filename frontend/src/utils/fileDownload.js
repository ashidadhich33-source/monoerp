/**
 * Utility functions for handling file downloads
 */

/**
 * Download a blob as a file
 * @param {Blob} blob - The blob to download
 * @param {string} filename - The filename for the download
 */
export const downloadBlob = (blob, filename) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

/**
 * Download CSV data
 * @param {Blob} csvBlob - The CSV blob
 * @param {string} filename - The filename (optional)
 */
export const downloadCSV = (csvBlob, filename = 'export.csv') => {
  downloadBlob(csvBlob, filename);
};

/**
 * Download PDF data
 * @param {Blob} pdfBlob - The PDF blob
 * @param {string} filename - The filename (optional)
 */
export const downloadPDF = (pdfBlob, filename = 'export.pdf') => {
  downloadBlob(pdfBlob, filename);
};

/**
 * Format date for filename
 * @param {Date} date - The date to format
 * @returns {string} Formatted date string
 */
export const formatDateForFilename = (date = new Date()) => {
  return date.toISOString().slice(0, 19).replace(/:/g, '-');
};

/**
 * Generate filename with timestamp
 * @param {string} prefix - The filename prefix
 * @param {string} extension - The file extension
 * @returns {string} Generated filename
 */
export const generateFilename = (prefix, extension) => {
  const timestamp = formatDateForFilename();
  return `${prefix}_${timestamp}.${extension}`;
};