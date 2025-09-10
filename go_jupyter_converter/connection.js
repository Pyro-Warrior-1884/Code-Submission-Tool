const admin = require('firebase-admin');
const fs = require('fs').promises;
const { exec } = require('child_process');
const path = require('path');
const os = require('os');
const util = require('util');

const execAsync = util.promisify(exec);
const thresholdAccuracy = 80;

const serviceAccount = require('./serviceAccount.json'); 

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function processNotebook(rawJsonString, originalFileName) {
  const decodedDir = path.join(os.homedir(), 'decoded_notebooks');
  const outputDir = path.join(os.homedir(), 'output');

  const decodedPath = path.join(decodedDir, originalFileName);
  const outputName = originalFileName.replace(/\.ipynb$/, '_output.txt');
  const outputPath = path.join(outputDir, outputName);

  await fs.mkdir(decodedDir, { recursive: true });
  await fs.mkdir(outputDir, { recursive: true });
  await fs.writeFile(decodedPath, rawJsonString, 'utf-8');

  const batPath = path.resolve(__dirname, 'run_go_compiler.bat');
  const command = `"${batPath}" "${decodedPath}"`;

  let stdout;
  try {
    const { stdout: rawOutput } = await execAsync(command);
    stdout = rawOutput;
  } catch (err) {
    console.error("❌ Error running compiler:", err);
    return { status: "Failure", accuracy: 0 };
  }

  let accuracy = 0;
  try {
    const parsed = JSON.parse(stdout.trim().split("\n").pop());
    accuracy = parsed.accuracy || 0;
    if (accuracy < 1 && accuracy > 0){
      accuracy = accuracy*100;
    }
  } catch (err) {
    console.error("❌ Failed to parse accuracy:", err);
    return { status: "Failure", accuracy: 0 };
  }

  return {
    status: accuracy >= thresholdAccuracy ? "Success" : "Failure",
    accuracy
  };
}

async function listenAndCompile() {
  while (true) {
    const snapshot = await db.collection("submissions")
      .where("status", "==", "Pending")
      .get();

    const pending = snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .sort((a, b) => {
        const parse = str => new Date(str.split('-').reverse().join('-'));
        return parse(a.timestamp) - parse(b.timestamp);
      });

    for (const item of pending) {
      const docRef = db.collection("submissions").doc(item.id);

      try {
        const { status, accuracy } = await processNotebook(
          item.code,                          
          `${item.name}.ipynb`              
        );

        await docRef.update({
          status,
          accuracy
        });

        console.log(`✅ Processed: ${item.name} | Status: ${status} | Accuracy: ${accuracy}`);
      } catch (err) {
        console.error(`❌ Failed Processing ${item.name}:`, err);
      }
    }

    await new Promise(resolve => setTimeout(resolve, 3000)); // Wait 3s before next check
  }
}

listenAndCompile();
