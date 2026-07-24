$nodeScript = @"
const XLSX = require('xlsx');
const path = require('path');

// Check template file
const filePath = 'd:/Nazam/Power BI/NextJS/template-import-sementrack.xlsx';
const wb = XLSX.readFile(filePath);

console.log('=== FILE: template-import-sementrack.xlsx ===');
console.log('Sheet names:', wb.SheetNames);
console.log('');

for (const name of wb.SheetNames) {
  const ws = wb.Sheets[name];
  const data = XLSX.utils.sheet_to_json(ws, { defval: null, header: 1 });
  if (data.length > 0) {
    console.log(`--- Sheet: "${name}" (${data.length} rows) ---`);
    // Print first 3 rows
    for (let i = 0; i < Math.min(3, data.length); i++) {
      console.log(`  Row ${i}:`, JSON.stringify(data[i]));
    }
    // Print column headers
    if (data[0]) {
      console.log('  Columns:', data[0].map((h, i) => `[${i}] "${h}"`).join(', '));
    }
    console.log('');
  } else {
    console.log(`--- Sheet: "${name}" (empty) ---`);
  }
}

// Also check tmp file
const tmpPath = 'd:/Nazam/Power BI/NextJS/.tmp-import-test.xlsx';
try {
  const wb2 = XLSX.readFile(tmpPath);
  console.log('=== FILE: .tmp-import-test.xlsx ===');
  console.log('Sheet names:', wb2.SheetNames);
} catch(e) {
  console.log('Cannot read .tmp-import-test.xlsx:', e.message);
}
"@;

$nodeScript | node -e $input

