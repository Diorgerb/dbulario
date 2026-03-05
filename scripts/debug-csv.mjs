import fs from "fs";
import path from "path";

const csvPath = "/home/ubuntu/dbulario-pro/data/StatusBulasANVISA.csv";
const content = fs.readFileSync(csvPath, "utf8");
const lines = content.split("\n");

console.log("Total lines:", lines.length);
console.log("\nHeader line:");
console.log(lines[0]);

console.log("\nFirst 3 data lines:");
for (let i = 1; i <= 3; i++) {
  console.log(`Line ${i}:`, lines[i].substring(0, 100));
}

// Parse header
const headers = lines[0].split(",").map((h) => h.trim());
console.log("\nHeaders:", headers);
console.log("Total headers:", headers.length);

// Parse first data line
const firstLine = lines[1];
const values = [];
let current = "";
let inQuotes = false;

for (let j = 0; j < firstLine.length; j++) {
  const char = firstLine[j];
  if (char === '"') {
    inQuotes = !inQuotes;
  } else if (char === "," && !inQuotes) {
    values.push(current.trim().replace(/^"|"$/g, ""));
    current = "";
  } else {
    current += char;
  }
}
values.push(current.trim().replace(/^"|"$/g, ""));

console.log("\nFirst line values:", values.length);
headers.forEach((header, idx) => {
  console.log(`${header}: ${values[idx]?.substring(0, 50) || "EMPTY"}`);
});
