// Test pdf-parse module
const fs = require('fs');

async function testPdfParse() {
    try {
        console.log('Loading pdf-parse...');
        const pdfParse = require('pdf-parse');
        console.log('Type of pdfParse:', typeof pdfParse);
        console.log('pdfParse:', pdfParse);
        
        // Create a minimal PDF buffer for testing
        const testBuffer = Buffer.from('%PDF-1.4\ntest');
        
        console.log('Calling pdfParse...');
        const result = await pdfParse(testBuffer);
        console.log('Success! Result:', result);
    } catch (error) {
        console.error('Error:', error.message);
        console.error('Stack:', error.stack);
    }
}

testPdfParse();
