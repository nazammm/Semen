import XLSX from "xlsx";

const files = [
  "d:/Nazam/Power BI/NextJS/template-import-sementrack.xlsx",
  "d:/Nazam/Power BI/NextJS/.tmp-import-test.xlsx",
];

for (const filePath of files) {
  console.log(`\n======== FILE: ${filePath.split("/").pop()} ========`);
  try {
    const wb = XLSX.readFile(filePath);
    console.log("Sheet names:", wb.SheetNames);
    for (const name of wb.SheetNames) {
      const ws = wb.Sheets[name];
      const data = XLSX.utils.sheet_to_json(ws, { defval: null, header: 1 });
      console.log(`\n--- Sheet: "${name}" (${data.length} rows) ---`);
      if (data.length > 0) {
        const headers = data[0];
        console.log("Headers:", headers.map((h, i) => `[${i}] "${h}"`).join(", "));
        if (data.length > 1) {
          console.log("Row 1:", JSON.stringify(data[1]));
        }
        if (data.length > 2) {
          console.log("Row 2:", JSON.stringify(data[2]));
        }
      }
    }
  } catch (e) {
    console.log("ERROR:", e.message);
  }
}

