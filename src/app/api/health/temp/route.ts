import { NextResponse } from "next/server";
import { exec } from "child_process";
import fs from "fs";
import path from "path";

export async function GET() {
  try {
    return new Promise<Response>((resolve) => {
      console.log("Running prisma db push via health/temp API route...");
      exec("npx prisma db push", (error, stdout, stderr) => {
        const logData = {
          success: !error,
          error: error ? error.message : null,
          stdout,
          stderr,
        };
        try {
          fs.writeFileSync(path.join(process.cwd(), "prisma-push-log.json"), JSON.stringify(logData, null, 2));
        } catch (writeErr: any) {
          console.error("Failed to write log file:", writeErr);
        }
        resolve(NextResponse.json(logData));
      });
    });
  } catch (err: any) {
    return NextResponse.json({
      success: false,
      error: "Outer catch: " + err.message,
    });
  }
}
