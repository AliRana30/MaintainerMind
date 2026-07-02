import { NextResponse } from "next/server";
import { exec } from "child_process";

export async function GET() {
  return new Promise<Response>((resolve) => {
    console.log("Spawning npx prisma db push from API route...");
    exec("npx prisma db push", (error, stdout, stderr) => {
      if (error) {
        console.error("Prisma push failed:", error);
        resolve(
          NextResponse.json({
            success: false,
            error: error.message,
            stdout,
            stderr,
          })
        );
      } else {
        console.log("Prisma push succeeded:", stdout);
        resolve(NextResponse.json({ success: true, stdout, stderr }));
      }
    });
  });
}
