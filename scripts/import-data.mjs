import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import mysql from "mysql2/promise";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, "../data");

// ================= PARSER CSV =================
function parseCSV(content: string) {
  const lines = content.split("\n");
  const headers = lines[0]
    .split(",")
    .map((h) => h.trim().replace(/^"|"$/g, ""));

  const records: any[] = [];

  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;

    const values: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let j = 0; j < lines[i].length; j++) {
      const char = lines[i][j];

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

    const record: any = {};
    headers.forEach((header, idx) => {
      record[header] = values[idx] ?? "";
    });

    records.push(record);
  }

  return records;
}

// ================= IMPORTAÇÃO =================
async function importMedications() {
  let connection;

  try {
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      throw new Error("DATABASE_URL environment variable not set");
    }

    const urlMatch = dbUrl.match(
      /mysql:\/\/([^:]+):([^@]+)@([^/:]+):?(\d*)\/(.+)/
    );

    if (!urlMatch) {
      throw new Error("Invalid DATABASE_URL format");
    }

    const [, user, password, host, port, database] = urlMatch;

    connection = await mysql.createConnection({
      host,
      user,
      password,
      database,
      port: port ? parseInt(port) : 3306,
      ssl: { rejectUnauthorized: false },
    });

    console.log("✓ Connected to database");

    const csvPath = path.join(dataDir, "StatusBulasANVISA.csv");
    console.log(`📂 Reading file: ${csvPath}`);

    const fileContent = fs.readFileSync(csvPath, "utf8");
    const medications = parseCSV(fileContent);

    console.log(`📊 Found ${medications.length} records`);

    await connection.execute("DELETE FROM medications");
    console.log("✓ Cleared existing medications");

    const batchSize = 100;

    for (let i = 0; i < medications.length; i += batchSize) {
      const batch = medications.slice(i, i + batchSize);

      for (const med of batch) {
        const registrationNumber = med.numeroRegistro || "";
        const name = med.nomeProduto || "";
        const holder = med.razaoSocial || "";

        // CSV: data = atualização
        const updateDate = med.data
          ? new Date(med.data).toISOString().split("T")[0]
          : null;

        // CSV: dataAtualizacao = inclusão na plataforma
        const inclusionDate = med.dataAtualizacao
          ? new Date(med.dataAtualizacao).toISOString().split("T")[0]
          : null;

        const query = `
          INSERT INTO medications
          (
            registrationNumber,
            name,
            holder,
            category,
            status,
            lastUpdate,
            dataAtualizacao
          )
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `;

        await connection.execute(query, [
          registrationNumber,
          name,
          holder,
          "medicamento",
          "ativo",
          inclusionDate, // inclusão na plataforma (CSV dataAtualizacao)
          updateDate,    // atualização do registro (CSV data)
        ]);
      }

      console.log(
        `✓ Inserted ${Math.min(i + batchSize, medications.length)}/${medications.length}`
      );
    }

    console.log("✅ Import completed successfully");
  } catch (error: any) {
    console.error("❌ Error importing data:", error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

importMedications();
