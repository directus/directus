#!/usr/bin/env node
/**
 * Pattern Seeder
 * Main script that combines all extractors
 *
 * Phase 1 Day 3: Pattern Pre-Seeding Integration
 * GitHub Issue: #37
 */

import { extractContext7Patterns } from './extractors/context7-extractor.js';
import { discoverGitHubPatterns } from './extractors/github-extractor.js';
import { writeFileSync, mkdirSync, readdirSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface UnifiedPattern {
  name: string;
  source: 'context7' | 'github';
  confidence: number;
  score: number;
  framework?: string;
  projectType?: string;
  pattern: any;
  // Context7 specific
  topic?: string;
  // GitHub specific
  frequency?: number;
  quality?: number;
  examples?: string[];
}

interface SeedingResult {
  patterns: UnifiedPattern[];
  sources: {
    context7: number;
    github: number;
  };
  recommendations: {
    primary: UnifiedPattern;
    secondary: UnifiedPattern[];
  };
}

/**
 * Seed patterns for a new project
 * @param projectName - Name of the project
 * @param projectType - Type of project (e.g., "directus-extension")
 * @param techStack - Array of technologies
 */
async function seedPatternsForProject(
  projectName: string,
  projectType: string,
  techStack: string[]
): Promise<SeedingResult> {
  console.log('\n🌱 Pattern Seeder - Intelligent Pre-Seeding System\n');
  console.log(`Project: ${projectName}`);
  console.log(`Type: ${projectType}`);
  console.log(`Tech Stack: ${techStack.join(', ')}\n`);
  console.log('━'.repeat(60) + '\n');

  const allPatterns: UnifiedPattern[] = [];

  // 1. Extract from Context7 (framework docs)
  console.log('📚 Step 1: Extracting patterns from Context7...');
  const context7Patterns = await extractContext7Patterns(techStack);
  allPatterns.push(...context7Patterns as any[]);
  console.log(`   ✓ Found ${context7Patterns.length} framework patterns\n`);

  // 2. Discover from GitHub (community)
  console.log('🔍 Step 2: Discovering patterns from GitHub...');
  const githubPatterns = await discoverGitHubPatterns(techStack, projectType);
  allPatterns.push(...githubPatterns as any[]);
  console.log(`   ✓ Found ${githubPatterns.length} community patterns\n`);

  // 3. Rank patterns by relevance
  console.log('🎯 Step 3: Ranking patterns by relevance...');
  const rankedPatterns = rankPatterns(allPatterns, projectType, techStack);
  console.log(`   ✓ Ranked ${rankedPatterns.length} patterns\n`);

  // 4. Select top recommendations
  console.log('⭐ Step 4: Selecting recommendations...');
  const recommendations = selectRecommendations(rankedPatterns);
  console.log(`   ✓ Primary: ${recommendations.primary.name} (score: ${recommendations.primary.score.toFixed(0)})`);
  console.log(`   ✓ Secondary: ${recommendations.secondary.length} patterns\n`);

  // 5. Save patterns to project directory
  console.log('💾 Step 5: Saving patterns...');
  const projectRoot = join(__dirname, '../..');
  const projectPatternsDir = join(
    projectRoot,
    '.claude/memory/patterns',
    projectName
  );

  mkdirSync(projectPatternsDir, { recursive: true });

  // Save top 50 patterns
  const topPatterns = rankedPatterns.slice(0, 50);
  for (const pattern of topPatterns) {
    const filename = `${pattern.name}.json`;
    writeFileSync(
      join(projectPatternsDir, filename),
      JSON.stringify(pattern, null, 2),
      'utf-8'
    );
  }

  console.log(`   ✓ Saved ${topPatterns.length} patterns to ${projectPatternsDir}\n`);

  // 6. Generate pattern summary
  generatePatternSummary(projectPatternsDir, {
    projectName,
    projectType,
    techStack,
    patterns: topPatterns,
    sources: {
      context7: context7Patterns.length,
      github: githubPatterns.length
    },
    recommendations
  });

  // 7. Return results
  return {
    patterns: topPatterns,
    sources: {
      context7: context7Patterns.length,
      github: githubPatterns.length
    },
    recommendations
  };
}

/**
 * Rank patterns by calculating relevance score
 */
function rankPatterns(
  patterns: UnifiedPattern[],
  projectType: string,
  techStack: string[]
): UnifiedPattern[] {
  console.log('   → Calculating relevance scores...');

  const scored = patterns.map(p => ({
    ...p,
    score: calculateScore(p, projectType, techStack)
  }));

  console.log('   → Sorting by score...');
  scored.sort((a, b) => b.score - a.score);

  // Show top 3 scores
  console.log('   → Top 3 patterns:');
  scored.slice(0, 3).forEach((p, i) => {
    console.log(`      ${i + 1}. ${p.name} (${p.score.toFixed(0)} points)`);
  });

  return scored;
}

/**
 * Calculate relevance score for a pattern
 */
function calculateScore(
  pattern: UnifiedPattern,
  projectType: string,
  techStack: string[]
): number {
  let score = 0;

  // 1. Base confidence from source (40 points max)
  score += (pattern.confidence || 0) * 40;

  // 2. Project type match (25 points)
  if (pattern.pattern?.applicableTo?.includes(projectType) ||
      pattern.projectType === projectType) {
    score += 25;
  }

  // 3. Tech stack relevance (20 points max)
  const techMatches = techStack.filter(tech => {
    const frameworks = pattern.pattern?.frameworks || [];
    return pattern.framework === tech || frameworks.includes(tech);
  });
  score += (techMatches.length / techStack.length) * 20;

  // 4. Community validation - GitHub frequency (15 points max)
  if (pattern.frequency) {
    score += pattern.frequency * 15;
  }

  // 5. Source bonus
  if (pattern.source === 'context7') {
    score += 5; // Official docs get small bonus
  } else if (pattern.source === 'github' && pattern.frequency && pattern.frequency > 0.8) {
    score += 5; // High-consensus GitHub patterns get bonus
  }

  return Math.min(score, 100); // Cap at 100
}

/**
 * Select primary and secondary pattern recommendations
 */
function selectRecommendations(rankedPatterns: UnifiedPattern[]): {
  primary: UnifiedPattern;
  secondary: UnifiedPattern[];
} {
  if (rankedPatterns.length === 0) {
    throw new Error('No patterns available for recommendations');
  }

  // Primary: Highest scoring GitHub pattern (workflow-level if available)
  let primary = rankedPatterns.find(p =>
    p.source === 'github' &&
    p.pattern?.category === 'folder-structure'
  );

  // Fallback to highest scoring pattern
  if (!primary) {
    primary = rankedPatterns[0];
  }

  // Secondary: Next 5 high-scoring patterns (different from primary)
  const secondary = rankedPatterns
    .filter(p => p !== primary)
    .slice(0, 5);

  return { primary, secondary };
}

/**
 * Generate a summary file for the pattern collection
 */
function generatePatternSummary(
  outputDir: string,
  data: {
    projectName: string;
    projectType: string;
    techStack: string[];
    patterns: UnifiedPattern[];
    sources: { context7: number; github: number };
    recommendations: { primary: UnifiedPattern; secondary: UnifiedPattern[] };
  }
): void {
  const summary = `# Pattern Collection Summary

**Project**: ${data.projectName}
**Type**: ${data.projectType}
**Tech Stack**: ${data.techStack.join(', ')}
**Generated**: ${new Date().toISOString()}

## Statistics

- **Total Patterns**: ${data.patterns.length}
- **From Context7**: ${data.sources.context7} (official docs)
- **From GitHub**: ${data.sources.github} (community consensus)
- **Average Score**: ${(data.patterns.reduce((sum, p) => sum + p.score, 0) / data.patterns.length).toFixed(1)}

## Top Recommendations

### 🎯 Primary Pattern

**${data.recommendations.primary.name}**
- Source: ${data.recommendations.primary.source}
- Score: ${data.recommendations.primary.score.toFixed(0)}/100
- Confidence: ${((data.recommendations.primary.confidence || 0) * 100).toFixed(0)}%

${data.recommendations.primary.pattern?.description || 'No description'}

### ⭐ Secondary Patterns

${data.recommendations.secondary.map((p, i) => `${i + 1}. **${p.name}** (${p.score.toFixed(0)} points, ${p.source})`).join('\n')}

## Pattern Breakdown by Source

### Context7 Patterns (${data.sources.context7})

${data.patterns
  .filter(p => p.source === 'context7')
  .slice(0, 10)
  .map((p, i) => `${i + 1}. ${p.name} - ${p.topic || 'N/A'}`)
  .join('\n')}

### GitHub Patterns (${data.sources.github})

${data.patterns
  .filter(p => p.source === 'github')
  .map((p, i) => `${i + 1}. ${p.name} - ${p.pattern?.category || 'N/A'}`)
  .join('\n')}

## Usage

These patterns are available for use in your project planning and development.
They represent a combination of:
- Official framework best practices (Context7)
- Community-validated approaches (GitHub)

Patterns are ranked by relevance to your specific project type and tech stack.

---

*Generated by Pattern Seeder v1.0*
`;

  writeFileSync(
    join(outputDir, 'PATTERN_SUMMARY.md'),
    summary,
    'utf-8'
  );

  console.log(`   ✓ Generated pattern summary`);
}

/**
 * Main execution function
 */
async function main() {
  const args = process.argv.slice(2);

  // Parse arguments
  const projectName = args[0];
  const projectType = args[1] || 'directus-extension';
  const techStack = args.length > 2 ? args.slice(2) : ['directus', 'vue3', 'typescript'];

  if (!projectName) {
    console.error('❌ Error: Project name required\n');
    console.error('Usage: npx tsx pattern-seeder.ts <project-name> [project-type] [tech-stack...]');
    console.error('\nExample:');
    console.error('  npx tsx pattern-seeder.ts my-app directus-extension directus vue3 typescript');
    console.error('\nDefaults:');
    console.error('  project-type: directus-extension');
    console.error('  tech-stack: directus vue3 typescript');
    process.exit(1);
  }

  try {
    // Run seeder
    const result = await seedPatternsForProject(projectName, projectType, techStack);

    // Display results
    console.log('━'.repeat(60));
    console.log('✅ Pattern seeding complete!\n');
    console.log('📊 Final Summary:');
    console.log(`   - Total patterns: ${result.patterns.length}`);
    console.log(`   - From Context7: ${result.sources.context7} (${((result.sources.context7 / (result.sources.context7 + result.sources.github)) * 100).toFixed(0)}%)`);
    console.log(`   - From GitHub: ${result.sources.github} (${((result.sources.github / (result.sources.context7 + result.sources.github)) * 100).toFixed(0)}%)`);
    console.log(`\n🎯 Primary Recommendation:`);
    console.log(`   ${result.recommendations.primary.name}`);
    console.log(`   Score: ${result.recommendations.primary.score.toFixed(0)}/100`);
    console.log(`   Source: ${result.recommendations.primary.source}`);
    console.log(`\n⭐ Secondary Recommendations:`);
    result.recommendations.secondary.forEach((p, i) => {
      console.log(`   ${i + 1}. ${p.name} (${p.score.toFixed(0)} points)`);
    });
    console.log(`\n📁 Patterns saved to:`);
    console.log(`   .claude/memory/patterns/${projectName}/`);
    console.log('\n💡 Next Step: Update /project-init to use this seeder');
    console.log('   See: .claude/docs/PHASE_1_IMPLEMENTATION_PLAN.md - Day 4');

  } catch (error) {
    console.error('\n❌ Error during pattern seeding:', (error as Error).message);
    console.error((error as Error).stack);
    process.exit(1);
  }
}

// Export for use in other scripts
export { seedPatternsForProject, rankPatterns, calculateScore, selectRecommendations };

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
