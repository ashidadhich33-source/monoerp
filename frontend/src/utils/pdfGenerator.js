import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export const generateSalarySlipPDF = async (salaryData, companyData = {}) => {
  try {
    // Create a temporary element to render the salary slip
    const tempDiv = document.createElement('div');
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px';
    tempDiv.style.top = '0';
    tempDiv.style.width = '210mm'; // A4 width
    tempDiv.style.backgroundColor = 'white';
    tempDiv.style.padding = '20px';
    tempDiv.style.fontFamily = 'Arial, sans-serif';
    
    // Generate HTML content for salary slip
    const salarySlipHTML = generateSalarySlipHTML(salaryData, companyData);
    tempDiv.innerHTML = salarySlipHTML;
    
    // Append to body temporarily
    document.body.appendChild(tempDiv);
    
    // Convert to canvas
    const canvas = await html2canvas(tempDiv, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff'
    });
    
    // Remove temporary element
    document.body.removeChild(tempDiv);
    
    // Create PDF
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgWidth = 210;
    const pageHeight = 295;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    
    let position = 0;
    
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
    
    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }
    
    // Generate filename
    const monthYear = salaryData.month_year || new Date().toISOString().slice(0, 7);
    const filename = `salary_slip_${monthYear}.pdf`;
    
    // Download PDF
    pdf.save(filename);
    
    return true;
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
};

const generateSalarySlipHTML = (salaryData, companyData) => {
  const currentDate = new Date().toLocaleDateString();
  const monthYear = salaryData.month_year || new Date().toISOString().slice(0, 7);
  
  return `
    <div style="max-width: 800px; margin: 0 auto; font-family: Arial, sans-serif; color: #333;">
      <!-- Header -->
      <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #2563eb; padding-bottom: 20px;">
        <h1 style="color: #2563eb; margin: 0; font-size: 28px; font-weight: bold;">
          ${companyData.name || 'Company Name'}
        </h1>
        <p style="margin: 5px 0; color: #666; font-size: 14px;">
          ${companyData.address || 'Company Address'}
        </p>
        <p style="margin: 5px 0; color: #666; font-size: 14px;">
          Phone: ${companyData.phone || 'N/A'} | Email: ${companyData.email || 'N/A'}
        </p>
        <h2 style="color: #1f2937; margin: 20px 0 10px 0; font-size: 24px;">
          SALARY SLIP
        </h2>
        <p style="margin: 0; color: #666; font-size: 16px;">
          For the month of ${formatMonthYear(monthYear)}
        </p>
      </div>

      <!-- Employee Details -->
      <div style="margin-bottom: 25px;">
        <h3 style="color: #1f2937; margin: 0 0 15px 0; font-size: 18px; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px;">
          Employee Details
        </h3>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
          <div>
            <p style="margin: 5px 0;"><strong>Employee Name:</strong> ${salaryData.staff_name || 'N/A'}</p>
            <p style="margin: 5px 0;"><strong>Employee ID:</strong> ${salaryData.employee_code || 'N/A'}</p>
            <p style="margin: 5px 0;"><strong>Department:</strong> ${salaryData.department || 'N/A'}</p>
          </div>
          <div>
            <p style="margin: 5px 0;"><strong>Designation:</strong> ${salaryData.designation || 'N/A'}</p>
            <p style="margin: 5px 0;"><strong>Pay Period:</strong> ${formatMonthYear(monthYear)}</p>
            <p style="margin: 5px 0;"><strong>Payment Date:</strong> ${currentDate}</p>
          </div>
        </div>
      </div>

      <!-- Salary Details -->
      <div style="margin-bottom: 25px;">
        <h3 style="color: #1f2937; margin: 0 0 15px 0; font-size: 18px; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px;">
          Salary Details
        </h3>
        
        <!-- Earnings -->
        <div style="margin-bottom: 20px;">
          <h4 style="color: #059669; margin: 0 0 10px 0; font-size: 16px;">Earnings</h4>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px;">
            <tr style="background-color: #f9fafb;">
              <td style="padding: 8px; border: 1px solid #e5e7eb; font-weight: bold;">Basic Salary</td>
              <td style="padding: 8px; border: 1px solid #e5e7eb; text-align: right; font-weight: bold;">₹${formatNumber(salaryData.basic_salary || 0)}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #e5e7eb;">House Rent Allowance</td>
              <td style="padding: 8px; border: 1px solid #e5e7eb; text-align: right;">₹${formatNumber(salaryData.hra || 0)}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #e5e7eb;">Transport Allowance</td>
              <td style="padding: 8px; border: 1px solid #e5e7eb; text-align: right;">₹${formatNumber(salaryData.transport_allowance || 0)}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #e5e7eb;">Medical Allowance</td>
              <td style="padding: 8px; border: 1px solid #e5e7eb; text-align: right;">₹${formatNumber(salaryData.medical_allowance || 0)}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #e5e7eb;">Overtime</td>
              <td style="padding: 8px; border: 1px solid #e5e7eb; text-align: right;">₹${formatNumber(salaryData.overtime || 0)}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #e5e7eb;">Incentives</td>
              <td style="padding: 8px; border: 1px solid #e5e7eb; text-align: right;">₹${formatNumber(salaryData.incentives || 0)}</td>
            </tr>
            <tr style="background-color: #f0fdf4; border-top: 2px solid #059669;">
              <td style="padding: 8px; border: 1px solid #e5e7eb; font-weight: bold;">Total Earnings</td>
              <td style="padding: 8px; border: 1px solid #e5e7eb; text-align: right; font-weight: bold; color: #059669;">₹${formatNumber(salaryData.total_earnings || 0)}</td>
            </tr>
          </table>
        </div>

        <!-- Deductions -->
        <div style="margin-bottom: 20px;">
          <h4 style="color: #dc2626; margin: 0 0 10px 0; font-size: 16px;">Deductions</h4>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px;">
            <tr style="background-color: #f9fafb;">
              <td style="padding: 8px; border: 1px solid #e5e7eb; font-weight: bold;">Provident Fund</td>
              <td style="padding: 8px; border: 1px solid #e5e7eb; text-align: right; font-weight: bold;">₹${formatNumber(salaryData.pf || 0)}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #e5e7eb;">Professional Tax</td>
              <td style="padding: 8px; border: 1px solid #e5e7eb; text-align: right;">₹${formatNumber(salaryData.professional_tax || 0)}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #e5e7eb;">Income Tax (TDS)</td>
              <td style="padding: 8px; border: 1px solid #e5e7eb; text-align: right;">₹${formatNumber(salaryData.tds || 0)}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #e5e7eb;">Advance Deduction</td>
              <td style="padding: 8px; border: 1px solid #e5e7eb; text-align: right;">₹${formatNumber(salaryData.advance_deduction || 0)}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #e5e7eb;">Other Deductions</td>
              <td style="padding: 8px; border: 1px solid #e5e7eb; text-align: right;">₹${formatNumber(salaryData.other_deductions || 0)}</td>
            </tr>
            <tr style="background-color: #fef2f2; border-top: 2px solid #dc2626;">
              <td style="padding: 8px; border: 1px solid #e5e7eb; font-weight: bold;">Total Deductions</td>
              <td style="padding: 8px; border: 1px solid #e5e7eb; text-align: right; font-weight: bold; color: #dc2626;">₹${formatNumber(salaryData.total_deductions || 0)}</td>
            </tr>
          </table>
        </div>

        <!-- Net Salary -->
        <div style="background-color: #f8fafc; border: 2px solid #2563eb; border-radius: 8px; padding: 20px; text-align: center;">
          <h3 style="color: #2563eb; margin: 0 0 10px 0; font-size: 20px;">Net Salary</h3>
          <p style="font-size: 32px; font-weight: bold; color: #1f2937; margin: 0;">
            ₹${formatNumber(salaryData.net_salary || 0)}
          </p>
        </div>
      </div>

      <!-- Footer -->
      <div style="margin-top: 40px; border-top: 1px solid #e5e7eb; padding-top: 20px; text-align: center; color: #666; font-size: 12px;">
        <p style="margin: 5px 0;">This is a computer-generated salary slip and does not require a signature.</p>
        <p style="margin: 5px 0;">Generated on: ${currentDate}</p>
        <p style="margin: 5px 0;">For any queries, please contact HR Department.</p>
      </div>
    </div>
  `;
};

const formatNumber = (num) => {
  return new Intl.NumberFormat('en-IN').format(num || 0);
};

const formatMonthYear = (monthYear) => {
  if (!monthYear) return 'N/A';
  const [year, month] = monthYear.split('-');
  const date = new Date(year, month - 1);
  return date.toLocaleDateString('en-IN', { year: 'numeric', month: 'long' });
};