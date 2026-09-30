import { Controller, Get, Res } from "@nestjs/common";
import { Response } from "express";
import { readFileSync } from "fs";
import { join } from "path";

@Controller("")
export class AdminController {
  private html: string;

  constructor() {
    try {
      // Try compiled dist path first, then fallback to src path
      try {
        this.html = readFileSync(join(__dirname, "..", "public", "admin.html"), "utf-8");
      } catch {
        this.html = readFileSync(join(__dirname, "..", "..", "public", "admin.html"), "utf-8");
      }
    } catch (error) {
      this.html = "<h1>Dashboard not found</h1>";
    }
  }

  @Get("admin")
  serveAdmin(@Res() res: Response) {
    res.type("text/html").send(this.html);
  }

  @Get("")
  root(@Res() res: Response) {
    res.type("text/html").send(this.html);
  }
}
