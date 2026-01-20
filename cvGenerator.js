// CV Generator Module
// Generates an updated CV with tailored bullet points and auto-downloads it

/**
 * Generate and download an updated CV with tailored bullets
 * @param {string} originalCV - The original CV text
 * @param {Array<string>} tailoredBullets - Array of tailored bullet points
 * @param {Object} jobInfo - Job information (company, role, etc.)
 */
export async function generateAndDownloadCV(originalCV, tailoredBullets, jobInfo = {}) {
    try {
        // Format the updated CV
        const updatedCV = formatCVWithBullets(originalCV, tailoredBullets, jobInfo);

        // Generate filename
        const timestamp = new Date().toISOString().split('T')[0];
        const jobSuffix = jobInfo.company ? `_${sanitizeFilename(jobInfo.company)}` : '';
        const filename = `CV_Updated${jobSuffix}_${timestamp}.txt`;

        // Download the file
        downloadTextFile(updatedCV, filename);

        return { success: true, filename };
    } catch (error) {
        console.error('Error generating CV:', error);
        throw error;
    }
}

/**
 * Format CV with tailored bullets
 */
function formatCVWithBullets(originalCV, tailoredBullets, jobInfo) {
    const divider = '\n' + '='.repeat(80) + '\n';
    const timestamp = new Date().toLocaleString('en-US', {
        dateStyle: 'full',
        timeStyle: 'short'
    });

    let updatedCV = '';

    // Add header section
    updatedCV += divider;
    updatedCV += 'UPDATED CV - TAILORED FOR JOB APPLICATION\n';
    updatedCV += divider;
    updatedCV += `Generated: ${timestamp}\n`;

    if (jobInfo.company) {
        updatedCV += `Company: ${jobInfo.company}\n`;
    }
    if (jobInfo.roleTitle) {
        updatedCV += `Role: ${jobInfo.roleTitle}\n`;
    }
    updatedCV += divider;
    updatedCV += '\n';

    // Add tailored bullets section
    updatedCV += '📌 TAILORED ACHIEVEMENTS & EXPERIENCE\n';
    updatedCV += 'Use these bullet points to highlight relevant experience:\n\n';

    tailoredBullets.forEach((bullet, index) => {
        updatedCV += `${index + 1}. ${bullet}\n\n`;
    });

    updatedCV += divider;
    updatedCV += '\n\n';

    // Add original CV
    updatedCV += '📄 ORIGINAL CV\n';
    updatedCV += divider;
    updatedCV += '\n';
    updatedCV += originalCV;

    return updatedCV;
}

/**
 * Download text content as a file
 */
function downloadTextFile(content, filename) {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';

    document.body.appendChild(link);
    link.click();

    // Cleanup
    setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }, 100);
}

/**
 * Sanitize filename by removing invalid characters
 */
function sanitizeFilename(name) {
    return name
        .replace(/[^a-z0-9_\-]/gi, '_')
        .replace(/_+/g, '_')
        .substring(0, 50);
}

/**
 * Generate CV in Markdown format (alternative format)
 */
export function formatCVAsMarkdown(originalCV, tailoredBullets, jobInfo) {
    const timestamp = new Date().toLocaleDateString('en-US', { dateStyle: 'long' });

    let markdown = '';

    // Header
    markdown += '# Updated CV - Tailored for Job Application\n\n';
    markdown += `**Generated:** ${timestamp}\n\n`;

    if (jobInfo.company || jobInfo.roleTitle) {
        markdown += '## Target Position\n\n';
        if (jobInfo.company) markdown += `- **Company:** ${jobInfo.company}\n`;
        if (jobInfo.roleTitle) markdown += `- **Role:** ${jobInfo.roleTitle}\n`;
        markdown += '\n';
    }

    // Tailored bullets
    markdown += '## 📌 Tailored Achievements & Experience\n\n';
    markdown += '*Use these bullet points to highlight relevant experience:*\n\n';

    tailoredBullets.forEach(bullet => {
        markdown += `- ${bullet}\n`;
    });

    markdown += '\n---\n\n';

    // Original CV
    markdown += '## Original CV\n\n';
    markdown += originalCV;

    return markdown;
}

/**
 * Generate and download CV in Markdown format
 */
export async function generateAndDownloadMarkdownCV(originalCV, tailoredBullets, jobInfo = {}) {
    try {
        const markdownCV = formatCVAsMarkdown(originalCV, tailoredBullets, jobInfo);

        const timestamp = new Date().toISOString().split('T')[0];
        const jobSuffix = jobInfo.company ? `_${sanitizeFilename(jobInfo.company)}` : '';
        const filename = `CV_Updated${jobSuffix}_${timestamp}.md`;

        downloadTextFile(markdownCV, filename);

        return { success: true, filename };
    } catch (error) {
        console.error('Error generating Markdown CV:', error);
        throw error;
    }
}
