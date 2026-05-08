/**
 * PARA Organization utilities
 * 
 * PARA = Projects, Areas, Resources, Archives
 * A method for organizing digital information by productivity consultant Tiago Forte
 */

import { join, existsSync, mkdirSync, writeFileSync } from "fs";
import type { DayData, ProjectData } from "./types";
import { formatDuration } from "./interval-merge";

/**
 * Organize vault using PARA method
 */
export function organizePARA(
  vaultPath: string,
  dayData: Map<string, DayData>,
  projectData: Map<string, { sessions: any[] }>
): void {
  console.log("  Creating PARA structure...");

  // Create PARA directories
  const paraDirs = [
    join(vaultPath, "Projects", "01_Active"),
    join(vaultPath, "Projects", "02_On_Hold"),
    join(vaultPath, "Projects", "03_Completed"),
    join(vaultPath, "Areas"),
    join(vaultPath, "Resources", "Templates"),
    join(vaultPath, "Resources", "References"),
    join(vaultPath, "Archives"),
  ];

  for (const dir of paraDirs) {
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
      console.log(`    [✓] Created: ${dir}`);
    }
  }

  // Create main category index files
  createProjectsIndex(vaultPath, projectData);
  createAreasIndex(vaultPath);
  createResourcesIndex(vaultPath);
  createArchivesIndex(vaultPath);

  console.log("  [✓] PARA structure created");
}

/**
 * Create Projects index with Dataview
 */
function createProjectsIndex(
  vaultPath: string,
  projectData: Map<string, { sessions: any[] }>
): void {
  const projectsPath = join(vaultPath, "Projects");
  const indexPath = join(projectsPath, "index.md");

  let content = `# Projects\n\n`;
  content += `## Active Projects\n\n`;

  // List projects with session counts
  for (const [projectId, data] of projectData) {
    const sessionCount = data.sessions.length;
    const totalTime = data.sessions.reduce((sum: number, s: any) => {
      return sum + (s.time_updated - s.time_created) / 1000;
    }, 0);

    content += `### ${projectId}\n`;
    content += `- Sessions: ${sessionCount}\n`;
    content += `- Time: ${formatDuration(totalTime)}\n`;
    content += `- [Details](<${projectId}.md>)\n\n`;
  }

  // Dataview query
  content += `\n## All Projects (Dataview)\n\n`;
  content += `\`\`\`dataview\n`;
  content += `TABLE without id file.link as "Project", length(file.outlinks) as "Sessions"\n`;
  content += `FROM "Projects"\nWHERE file.name != "index"\nSORT file.mtime DESC\n`;
  content += `\`\`\`\n`;

  writeFileSync(indexPath, content, "utf-8");
  console.log("    [✓] Created Projects/index.md");
}

/**
 * Create Areas index
 */
function createAreasIndex(vaultPath: string): void {
  const areasPath = join(vaultPath, "Areas");
  const indexPath = join(areasPath, "index.md");

  let content = `# Areas\n\n`;
  content += `Areas are ongoing responsibilities or domains that require continuous attention.\n\n`;
  content += `## My Areas\n\n`;
  content += `- OpenCode Development\n`;
  content += `- Personal Projects\n`;
  content += `- Learning & Research\n\n`;

  content += `\`\`\`dataview\n`;
  content += `LIST\nFROM "Areas"\nWHERE file.name != "index"\nSORT file.name ASC\n`;
  content += `\`\`\`\n`;

  writeFileSync(indexPath, content, "utf-8");
  console.log("    [✓] Created Areas/index.md");
}

/**
 * Create Resources index
 */
function createResourcesIndex(vaultPath: string): void {
  const resourcesPath = join(vaultPath, "Resources");
  const indexPath = join(resourcesPath, "index.md");

  let content = `# Resources\n\n`;
  content += `Resources are reference materials, documentation, and tools.\n\n`;
  content += `## Categories\n\n`;
  content += `- Templates/\n`;
  content += `- References/\n\n`;

  content += `\`\`\`dataview\n`;
  content += `LIST\nFROM "Resources"\nWHERE file.name != "index"\nSORT file.ctime DESC\n`;
  content += `\`\`\`\n`;

  writeFileSync(indexPath, content, "utf-8");
  console.log("    [✓] Created Resources/index.md");
}

/**
 * Create Archives index
 */
function createArchivesIndex(vaultPath: string): void {
  const archivesPath = join(vaultPath, "Archives");
  const indexPath = join(archivesPath, "index.md");

  let content = `# Archives\n\n`;
  content += `Completed projects and archived materials.\n\n`;

  content += `\`\`\`dataview\n`;
  content += `LIST\nFROM "Archives"\nSORT file.ctime DESC\n`;
  content += `\`\`\`\n`;

  writeFileSync(indexPath, content, "utf-8");
  console.log("    [✓] Created Archives/index.md");
}
