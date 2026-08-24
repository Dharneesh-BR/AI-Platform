import fs from "node:fs/promises";
import { Presentation, PresentationFile } from "@oai/artifact-tool";

const OUT = process.env.FINAL_PPTX || "C:/Users/Admin/CascadeProjects/Agentic AI/Magnafic-AI-Stakeholder-PreRead.pptx";
const BUILD = process.env.TMP_DIR || "C:/Users/Admin/CascadeProjects/Agentic AI/stakeholder-deck-build";
const W = 1280;
const H = 720;
const ink = "#000000";
const muted = "#4B5563";
const faint = "#F2F2F2";
const panel = "#EDEDED";
const rule = "#B8BCC4";
const accent = "#3D8DFF";
const accentLight = "#EAF5FB";

async function writeBlob(path, blob) {
  await fs.writeFile(path, new Uint8Array(await blob.arrayBuffer()));
}

function addText(slide, text, x, y, w, h, opts = {}) {
  const shape = slide.shapes.add({
    geometry: "textbox",
    position: { left: x, top: y, width: w, height: h },
    fill: "none",
    line: { style: "solid", fill: "none", width: 0 },
  });
  shape.text = Array.isArray(text) ? text.join("\n") : text;
  shape.text.style = {
    fontSize: opts.size || 22,
    bold: opts.bold || false,
    color: opts.color || ink,
    typeface: "Helvetica Neue",
    alignment: opts.align || "left",
    verticalAlignment: opts.valign || "top",
    autoFit: opts.autoFit || "shrinkText",
    wrap: "square",
  };
  return shape;
}

function addBox(slide, x, y, w, h, opts = {}) {
  const geometry = opts.geometry || "roundRect";
  const config = {
    geometry,
    position: { left: x, top: y, width: w, height: h },
    fill: opts.fill || faint,
    line: { style: "solid", fill: opts.line || "none", width: opts.lineWidth ?? 0 },
  };
  if (["rect", "textbox", "roundRect"].includes(geometry)) {
    config.borderRadius = opts.radius || "rounded-xl";
  }
  return slide.shapes.add(config);
}

function addFooter(slide, n) {
  addText(slide, String(n).padStart(2, "0"), 1182, 658, 56, 24, { size: 13, align: "right", valign: "bottom" });
}

function addTitle(slide, title, n, subtitle) {
  addText(slide, title, 42, 34, 930, 98, { size: 38, bold: false });
  if (subtitle) addText(slide, subtitle, 42, 122, 840, 54, { size: 20, color: muted });
  addFooter(slide, n);
}

function setNotes(slide, lines) {
  slide.speakerNotes.textFrame.setText(["[Sources]", "Internal implementation state from the Magnafic AI workspace and conversation history.", "", ...lines]);
  slide.speakerNotes.setVisible(true);
}

function cover(p, n) {
  const slide = p.slides.add();
  slide.background.fill = "#FFFFFF";
  addText(slide, "Magnafic AI", 42, 40, 420, 60, { size: 32, bold: true });
  addText(slide, "Stakeholder pre-read", 42, 175, 520, 64, { size: 36 });
  addText(slide, "Enterprise AI consulting platform", 42, 252, 560, 54, { size: 28, color: muted });
  addText(slide, "What is built, what remains, and how the demo will flow", 42, 535, 620, 72, { size: 28 });
  addBox(slide, 658, 42, 582, 588, { fill: accentLight, line: rule, lineWidth: 1, radius: "rounded-2xl" });
  addText(slide, "AI-ready consulting workflow", 710, 135, 420, 58, { size: 30, bold: true });
  const items = ["Client workspace", "Project onboarding", "Company discovery", "Knowledge + research", "Chat + reports"];
  items.forEach((it, i) => {
    addBox(slide, 710, 230 + i * 64, 32, 32, { fill: i < 3 ? accent : "#FFFFFF", line: accent, lineWidth: 2, radius: "rounded-md" });
    addText(slide, it, 762, 226 + i * 64, 350, 40, { size: 24 });
  });
  addFooter(slide, n);
  setNotes(slide, ["Use this as the opening: this deck is a pre-read so the live meeting can focus on running the product."]);
}

function agenda(p, n) {
  const slide = p.slides.add();
  addTitle(slide, "The meeting can focus on the product demo", n, "This pre-read aligns stakeholders before the live walkthrough.");
  const rows = [
    ["01", "What we are building", "A governed AI consulting workspace, not a generic chatbot."],
    ["02", "How users enter the system", "Role-based logins protect data and separate responsibilities."],
    ["03", "Current implementation status", "Frontend flow, architecture, backend foundations, and Prisma schema are in place."],
    ["04", "Demo flow", "Create/select workspace, onboard project, review discovery, explore AI outputs."],
    ["05", "Pending milestones", "Live auth, DB migrations, real discovery, knowledge ingestion, agents, reports."],
    ["06", "Stakeholder decisions", "Confirm MVP scope, demo boundaries, priorities, and rollout plan."],
  ];
  let y = 190;
  rows.forEach(([num, head, body]) => {
    addText(slide, num, 74, y, 48, 34, { size: 20, bold: true, color: accent });
    addText(slide, head, 145, y - 2, 320, 38, { size: 24, bold: true });
    addText(slide, body, 500, y, 650, 34, { size: 21, color: muted });
    slide.shapes.add({ geometry: "straightConnector1", position: { left: 70, top: y + 48, width: 1085, height: 0 }, fill: "none", line: { style: "solid", fill: rule, width: 1 } });
    y += 72;
  });
  setNotes(slide, ["The deck is intentionally structured as a stakeholder pre-read, not a technical appendix."]);
}

function vision(p, n) {
  const slide = p.slides.add();
  addTitle(slide, "We are building a governed AI consulting platform", n);
  addText(slide, "The product helps consulting teams turn a client company into an AI-ready project workspace: onboarding captures context, discovery builds a company profile, knowledge sources are organized, and AI workflows produce research, chat answers, and reports.", 42, 158, 590, 230, { size: 28 });
  const checks = ["Company-specific answers instead of generic AI", "Tenant separation for each client organization", "Human approval before outputs become trusted", "Reusable architecture for future agents and reports"];
  checks.forEach((c, i) => {
    addBox(slide, 778, 210 + i * 72, 24, 24, { fill: accent, line: accent, lineWidth: 1, radius: "rounded-md" });
    addText(slide, c, 825, 202 + i * 72, 380, 42, { size: 24 });
  });
  addText(slide, "Central idea", 42, 470, 200, 32, { size: 24, bold: true, color: accent });
  addText(slide, "AI should work only after it understands the client, the project objective, and the approved knowledge context.", 42, 505, 620, 85, { size: 28, bold: true });
  setNotes(slide, ["Explain that the architecture is intentionally project-first and context-first."]);
}

function roles(p, n) {
  const slide = p.slides.add();
  addTitle(slide, "Different logins exist to protect control and accountability", n, "Each role maps to a different responsibility level.");
  const cols = [
    ["Super Admin", "Runs the platform", ["All organizations", "Plans, billing, models", "Prompt/model governance"]],
    ["Org Admin", "Owns one client workspace", ["Invite users", "Create projects", "Approve outputs"]],
    ["Consultant", "Runs project delivery", ["Onboarding", "Discovery review", "Research and reports"]],
    ["Viewer", "Reviews outcomes", ["Read dashboards", "View profiles", "See reports only"]],
  ];
  cols.forEach((col, i) => {
    const x = 42 + i * 300;
    addText(slide, col[0], x, 210, 240, 36, { size: 27, bold: true });
    addText(slide, col[1], x, 258, 230, 52, { size: 22, color: muted });
    col[2].forEach((b, j) => addText(slide, `• ${b}`, x, 345 + j * 48, 240, 34, { size: 22 }));
    addBox(slide, x, 540, 240, 52, { fill: i < 2 ? accentLight : faint, line: "none" });
    addText(slide, i < 2 ? "Can change data" : "Limited access", x + 18, 550, 205, 28, { size: 20, bold: true });
  });
  setNotes(slide, ["Connect this slide to the user's question: admin is only one login; the other roles keep client data and approvals safe."]);
}

function workflow(p, n) {
  const slide = p.slides.add();
  addTitle(slide, "Every project follows onboarding before AI work starts", n);
  const steps = [
    ["Login", "User enters with role-based permissions"],
    ["Organization", "Client workspace is selected or created"],
    ["Project", "Consulting engagement is created"],
    ["Onboarding", "Goals, website, industry, and context are captured"],
    ["Discovery", "System drafts a company profile"],
    ["Approval", "Human validates the profile"],
    ["AI outputs", "Knowledge, research, chat, and reports unlock"]
  ];
  const startX = 55;
  const y = 330;
  slide.shapes.add({ geometry: "straightConnector1", position: { left: startX, top: y, width: 1130, height: 0 }, fill: "none", line: { style: "solid", fill: ink, width: 1 } });
  steps.forEach((s, i) => {
    const x = startX + i * 182;
    addBox(slide, x - 9, y - 9, 18, 18, { fill: i >= 4 ? accent : ink, geometry: "ellipse", radius: "rounded-full" });
    addText(slide, s[0], x - 50, 232, 150, 44, { size: 24, bold: true, align: "center" });
    addText(slide, s[1], x - 72, 380, 160, 82, { size: 18, color: muted, align: "center" });
  });
  addText(slide, "Why onboarding is mandatory", 42, 535, 380, 34, { size: 24, bold: true, color: accent });
  addText(slide, "It prevents generic answers and creates a trusted context boundary for every new project.", 42, 575, 820, 42, { size: 26 });
  setNotes(slide, ["Clarify that onboarding repeats per project, not just once per account."]);
}

function completed(p, n) {
  const slide = p.slides.add();
  addTitle(slide, "A strong product foundation is already implemented", n, "The current build is demoable on the frontend and structured for backend integration.");
  const cards = [
    ["Monorepo + docs", "Apps, packages, services, architecture docs, deployment docs, and milestone documentation."],
    ["Prisma data model", "Organizations, users, memberships, projects, onboarding, discovery, company profiles, knowledge, AI, billing."],
    ["Auth/RBAC backend", "Firebase token verifier, platform JWT, guards, tenant context, roles, and session repository."],
    ["Core APIs", "Organizations, projects, onboarding, discovery jobs, company profile, and knowledge endpoints."],
    ["Discovery worker", "BullMQ worker foundation with progress, retry, profile persistence, and lifecycle transitions."],
    ["Frontend experience", "Polished Magnafic AI routes for dashboard, projects, onboarding, discovery, profile, research, chat, reports, admin."],
  ];
  cards.forEach((c, i) => {
    const x = 42 + (i % 3) * 400;
    const y = 185 + Math.floor(i / 3) * 220;
    addBox(slide, x, y, 350, 160, { fill: faint, line: "none" });
    addText(slide, c[0], x + 24, y + 24, 300, 34, { size: 24, bold: true });
    addText(slide, c[1], x + 24, y + 72, 300, 68, { size: 18, color: muted });
  });
  setNotes(slide, ["These items reflect completed project files and validated type checks in the local workspace."]);
}

function demo(p, n) {
  const slide = p.slides.add();
  addTitle(slide, "The stakeholder demo should show one clean journey", n, "Keep the meeting focused on the business flow, not engineering internals.");
  const left = ["Open Magnafic AI", "Show dashboard", "Explain role-based access", "Open Projects", "Walk through demo project"];
  const right = ["Complete onboarding", "Show discovery progress", "Review company profile", "Open knowledge/research", "Show chat and reports screens"];
  addText(slide, "First half: setup and context", 42, 200, 500, 40, { size: 28, bold: true });
  addText(slide, "Second half: AI-ready outputs", 680, 200, 500, 40, { size: 28, bold: true });
  left.forEach((t, i) => addText(slide, `${i + 1}. ${t}`, 70, 270 + i * 55, 470, 34, { size: 24 }));
  right.forEach((t, i) => addText(slide, `${i + 6}. ${t}`, 710, 270 + i * 55, 470, 34, { size: 24 }));
  slide.shapes.add({ geometry: "straightConnector1", position: { left: 640, top: 190, width: 0, height: 360 }, fill: "none", line: { style: "solid", fill: rule, width: 1 } });
  addBox(slide, 42, 600, 1120, 48, { fill: accentLight, line: "none" });
  addText(slide, "Demo message: Magnafic AI turns onboarding context into governed AI consulting outputs.", 64, 611, 1050, 28, { size: 22, bold: true });
  setNotes(slide, ["Use this as the live demo checklist tomorrow."]);
}

function pending(p, n) {
  const slide = p.slides.add();
  addTitle(slide, "The remaining work turns the prototype into a live MVP", n);
  const rows = [
    ["1", "Live auth/session", "Firebase login to backend session JWT and frontend token storage."],
    ["2", "Database migrations + seed", "Run PostgreSQL schema, seed demo org/project/users, verify persistence."],
    ["3", "Real discovery", "Fetch public website content safely and replace deterministic demo profile generation."],
    ["4", "Knowledge ingestion", "Upload documents, parse, chunk, embed, and search with pgvector."],
    ["5", "AI orchestration", "LiteLLM gateway, LangGraph agents, project-aware chat, and report generation."],
    ["6", "Production hardening", "Tests, CI/CD, Docker production setup, observability, and security review."],
  ];
  let y = 178;
  rows.forEach((r) => {
    addText(slide, r[0], 55, y, 36, 36, { size: 22, bold: true, color: accent });
    addText(slide, r[1], 120, y - 2, 315, 36, { size: 24, bold: true });
    addText(slide, r[2], 465, y, 680, 34, { size: 21, color: muted });
    y += 72;
  });
  setNotes(slide, ["This slide separates demo-ready work from MVP-complete work."]);
}

function plan(p, n) {
  const slide = p.slides.add();
  addTitle(slide, "Recommended next milestones after the demo", n, "A practical order keeps visible progress aligned with real platform readiness.");
  const phases = [
    ["Milestone 1", "Make login real", "Wire Firebase login, session API, role-aware navigation."],
    ["Milestone 2", "Persist project flow", "Run DB migrations, seed data, connect onboarding to backend."],
    ["Milestone 3", "Make discovery real", "Website fetch, extraction, profile approval, retry/error handling."],
    ["Milestone 4", "Enable AI outputs", "Knowledge upload, embeddings, research agent, chat, reports."],
  ];
  phases.forEach((p0, i) => {
    const x = 42 + i * 300;
    addBox(slide, x, 246, 248, 250, { fill: i === 0 ? accentLight : faint, line: "none" });
    addText(slide, p0[0], x + 24, 270, 180, 30, { size: 20, color: accent, bold: true });
    addText(slide, p0[1], x + 24, 322, 200, 68, { size: 28, bold: true });
    addText(slide, p0[2], x + 24, 420, 200, 58, { size: 18, color: muted });
  });
  addText(slide, "Suggested meeting ask", 42, 574, 300, 32, { size: 24, bold: true, color: accent });
  addText(slide, "Approve the demo story and prioritize the first two milestones for the next implementation sprint.", 42, 610, 900, 36, { size: 24 });
  setNotes(slide, ["End with a concrete decision rather than a generic status update."]);
}

function close(p, n) {
  const slide = p.slides.add();
  addText(slide, "Magnafic AI", 42, 42, 220, 40, { size: 28, bold: true });
  addText(slide, "Ready for stakeholder walkthrough", 42, 180, 920, 118, { size: 68, bold: false });
  addText(slide, ["Run the frontend demo", "Align on MVP boundaries", "Start live integration milestones"], 42, 520, 560, 110, { size: 28 });
  addFooter(slide, n);
  setNotes(slide, ["Close by switching from deck to the running app."]);
}

async function main() {
  await fs.mkdir(BUILD, { recursive: true });
  const presentation = Presentation.create({ slideSize: { width: W, height: H } });
  cover(presentation, 1);
  agenda(presentation, 2);
  vision(presentation, 3);
  roles(presentation, 4);
  workflow(presentation, 5);
  completed(presentation, 6);
  demo(presentation, 7);
  pending(presentation, 8);
  plan(presentation, 9);
  close(presentation, 10);

  for (const [index, slide] of presentation.slides.items.entries()) {
    const stem = `slide-${String(index + 1).padStart(2, "0")}`;
    await writeBlob(`${BUILD}/${stem}.png`, await presentation.export({ slide, format: "png", scale: 1 }));
    await fs.writeFile(`${BUILD}/${stem}.layout.json`, await (await slide.export({ format: "layout" })).text());
  }
  await writeBlob(`${BUILD}/deck-montage.webp`, await presentation.export({ format: "webp", montage: true, scale: 1 }));
  const pptx = await PresentationFile.exportPptx(presentation);
  await pptx.save(OUT);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});