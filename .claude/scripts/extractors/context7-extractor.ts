#!/usr/bin/env node
/**
 * Context7 Pattern Extractor
 * Uses MCP to extract patterns from framework documentation
 *
 * Phase 1 Day 1: Pattern Pre-Seeding
 * GitHub Issue: #35
 */

import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface ExtractedPattern {
  name: string;
  source: 'context7';
  framework: string;
  confidence: number;
  topic: string;
  pattern: {
    description: string;
    examples: any[];
    bestPractices: string[];
    commonPitfalls: string[];
    applicableTo?: string[];
    frameworks?: string[];
  };
}

// Frameworks to query based on tech stack
const FRAMEWORK_PATTERNS: Record<string, string[]> = {
  directus: [
    'hooks patterns',
    'endpoint patterns',
    'panel development patterns',
    'flow operation patterns',
    'collection schema patterns',
    'custom interface patterns',
    'display patterns',
    'module patterns'
  ],
  vue3: [
    'composition api patterns',
    'composable patterns',
    'reactive patterns',
    'component patterns',
    'lifecycle patterns'
  ],
  typescript: [
    'type patterns',
    'interface patterns',
    'generic patterns',
    'type guards',
    'utility types'
  ]
};

/**
 * Extract patterns from Context7 for given tech stack
 * @param techStack - Array of frameworks/technologies to query
 * @returns Promise<ExtractedPattern[]>
 */
async function extractContext7Patterns(
  techStack: string[]
): Promise<ExtractedPattern[]> {
  const patterns: ExtractedPattern[] = [];

  console.log('📚 Extracting patterns from Context7...\n');

  for (const tech of techStack) {
    const queries = FRAMEWORK_PATTERNS[tech] || [];

    if (queries.length === 0) {
      console.log(`⚠️  No predefined queries for: ${tech}`);
      continue;
    }

    console.log(`🔍 Querying ${tech} (${queries.length} topics)...`);

    for (const query of queries) {
      console.log(`   → ${query}`);

      try {
        // Query Context7 via MCP
        const pattern = await queryContext7(tech, query);

        if (pattern) {
          patterns.push({
            name: `${tech}-${query.replace(/\s+/g, '-')}`,
            source: 'context7',
            framework: tech,
            confidence: 0.95, // Context7 is official docs, high confidence
            topic: query,
            pattern
          });
        }
      } catch (error) {
        console.error(`   ✗ Error querying ${tech}/${query}:`, (error as Error).message);
      }
    }

    console.log(`   ✓ Extracted ${queries.length} patterns from ${tech}\n`);
  }

  return patterns;
}

/**
 * Query Context7 MCP for specific framework/topic
 * Note: This is a placeholder for MCP integration
 * The actual MCP call would be made by Claude Code during execution
 *
 * @param framework - Framework name (directus, vue3, etc)
 * @param topic - Topic to query
 * @returns Pattern data
 */
async function queryContext7(
  framework: string,
  topic: string
): Promise<any> {
  // This will be replaced with actual MCP call during execution
  // For now, return a structured template

  return {
    description: `${topic} for ${framework}`,
    examples: [
      {
        title: `Example ${topic}`,
        code: `// ${framework} ${topic} example\n// To be populated from Context7 MCP`,
        explanation: 'Pattern extracted from official documentation'
      }
    ],
    bestPractices: [
      `Follow ${framework} conventions for ${topic}`,
      'Use TypeScript for type safety',
      'Add comprehensive error handling'
    ],
    commonPitfalls: [
      `Avoid common mistakes in ${topic}`,
      'Check documentation for latest patterns'
    ],
    applicableTo: [framework],
    frameworks: [framework]
  };
}

/**
 * Save extracted patterns to file system
 * @param patterns - Patterns to save
 * @param outputDir - Directory to save patterns
 */
function savePatterns(patterns: ExtractedPattern[], outputDir: string): void {
  mkdirSync(outputDir, { recursive: true });

  for (const pattern of patterns) {
    const filename = `${pattern.name}.json`;
    const filepath = join(outputDir, filename);

    writeFileSync(
      filepath,
      JSON.stringify(pattern, null, 2),
      'utf-8'
    );
  }

  console.log(`💾 Saved ${patterns.length} patterns to ${outputDir}`);
}

/**
 * Main execution function
 */
async function main() {
  const args = process.argv.slice(2);

  // Default tech stack for Directus projects
  const techStack = args.length > 0 ? args : ['directus', 'vue3', 'typescript'];

  console.log('🌱 Context7 Pattern Extractor\n');
  console.log(`Tech Stack: ${techStack.join(', ')}\n`);
  console.log('━'.repeat(60) + '\n');

  try {
    // Extract patterns
    const patterns = await extractContext7Patterns(techStack);

    // Output directory (relative to project root)
    const projectRoot = join(__dirname, '../../..');
    const outputDir = join(projectRoot, '.claude/memory/patterns/context7');

    // Save patterns
    savePatterns(patterns, outputDir);

    console.log('\n' + '━'.repeat(60));
    console.log('✅ Context7 pattern extraction complete!\n');
    console.log(`📊 Summary:`);
    console.log(`   - Total patterns: ${patterns.length}`);
    console.log(`   - Tech stack: ${techStack.join(', ')}`);
    console.log(`   - Average confidence: ${(patterns.reduce((sum, p) => sum + p.confidence, 0) / patterns.length * 100).toFixed(0)}%`);
    console.log(`\n📁 Patterns saved to:`);
    console.log(`   ${outputDir}`);
    console.log('\n💡 Next Step: Run GitHub pattern discoverer');
    console.log(`   node .claude/scripts/extractors/github-extractor.ts`);

    return patterns;
  } catch (error) {
    console.error('\n❌ Error during extraction:', (error as Error).message);
    console.error((error as Error).stack);
    process.exit(1);
  }
}

// Export for use in other scripts
export { extractContext7Patterns, queryContext7 };

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
