#!/usr/bin/env node
/**
 * GitHub Pattern Discoverer
 * Finds similar projects and extracts common patterns
 *
 * Phase 1 Day 2: Pattern Pre-Seeding
 * GitHub Issue: #36
 */

import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface GitHubPattern {
  name: string;
  source: 'github';
  frequency: number; // How many repos use this (0-1)
  quality: number; // Average stars/recency score (0-1)
  confidence: number; // Combined score (0-1)
  examples: string[]; // Links to repos
  projectType: string;
  pattern: {
    description: string;
    category: 'folder-structure' | 'testing' | 'dependencies' | 'configuration';
    commonImplementation: any;
    alternatives: any[];
    applicableTo?: string[];
    frameworks?: string[];
  };
}

interface RepoInfo {
  fullName: string;
  stars: number;
  updatedAt: string;
  description: string;
}

/**
 * Discover patterns from GitHub repositories
 * @param techStack - Technologies to search for
 * @param projectType - Type of project (e.g., "directus-extension")
 * @returns Promise<GitHubPattern[]>
 */
async function discoverGitHubPatterns(
  techStack: string[],
  projectType: string
): Promise<GitHubPattern[]> {
  console.log('🔍 Discovering patterns from GitHub...\n');
  console.log(`Project Type: ${projectType}`);
  console.log(`Tech Stack: ${techStack.join(', ')}\n`);
  console.log('━'.repeat(60) + '\n');

  // Build search query
  const query = buildSearchQuery(techStack, projectType);
  console.log(`📝 Search Query: "${query}"\n`);

  // Search for repositories (this will use MCP during execution)
  const repos = await searchRepositories(query);
  console.log(`✓ Found ${repos.length} repositories\n`);

  if (repos.length === 0) {
    console.log('⚠️  No repositories found. Try adjusting search criteria.\n');
    return [];
  }

  // Analyze repositories for patterns
  const patterns = await analyzeRepositories(repos, projectType, techStack);

  return patterns;
}

/**
 * Build GitHub search query from tech stack and project type
 */
function buildSearchQuery(techStack: string[], projectType: string): string {
  // Build query parts
  const techQuery = techStack.join(' ');

  // Adjust for specific project types
  let typeQuery = projectType;
  if (projectType === 'directus-extension') {
    typeQuery = 'directus extension OR directus-extension';
  }

  // Search criteria:
  // - Must mention tech stack
  // - Minimum 10 stars (quality threshold)
  // - Updated in last 2 years (active projects)
  return `${typeQuery} ${techQuery} stars:>10 pushed:>2023-01-01`;
}

/**
 * Search GitHub repositories
 * Note: Uses GitHub MCP server during execution
 */
async function searchRepositories(query: string): Promise<RepoInfo[]> {
  console.log('🔎 Searching GitHub repositories...\n');

  // This will be replaced with actual MCP call during execution
  // For now, return mock data structure
  const mockRepos: RepoInfo[] = [
    {
      fullName: 'directus-community/example-extension',
      stars: 150,
      updatedAt: '2024-12-01',
      description: 'Example Directus extension'
    },
    {
      fullName: 'directus-labs/panel-template',
      stars: 89,
      updatedAt: '2024-11-15',
      description: 'Panel development template'
    }
  ];

  console.log('   → Would use GitHub MCP to search for:');
  console.log(`     "${query}"`);
  console.log(`   → Mock: Returning ${mockRepos.length} example repos\n`);

  return mockRepos;
}

/**
 * Analyze repositories for common patterns
 */
async function analyzeRepositories(
  repos: RepoInfo[],
  projectType: string,
  techStack: string[]
): Promise<GitHubPattern[]> {
  console.log('🔬 Analyzing repository patterns...\n');

  const patterns: GitHubPattern[] = [];

  // Pattern categories to analyze
  const patternChecks = [
    {
      name: 'folder-structure',
      analyzer: analyzeFolderStructure
    },
    {
      name: 'testing-approach',
      analyzer: analyzeTestingApproach
    },
    {
      name: 'common-dependencies',
      analyzer: analyzeDependencies
    },
    {
      name: 'configuration-patterns',
      analyzer: analyzeConfiguration
    }
  ];

  for (const check of patternChecks) {
    console.log(`   📂 Analyzing: ${check.name}`);

    // Analyze each repo
    const results = await Promise.all(
      repos.map(repo => check.analyzer(repo))
    );

    // Find consensus (patterns used by >60% of repos)
    const consensus = findConsensus(results, repos);

    if (consensus && consensus.frequency >= 0.6) {
      const pattern: GitHubPattern = {
        name: check.name,
        source: 'github',
        frequency: consensus.frequency,
        quality: consensus.quality,
        confidence: consensus.frequency * consensus.quality,
        examples: consensus.examples,
        projectType,
        pattern: {
          description: consensus.description,
          category: check.name as any,
          commonImplementation: consensus.commonPattern,
          alternatives: consensus.alternatives,
          applicableTo: [projectType],
          frameworks: techStack
        }
      };

      patterns.push(pattern);
      console.log(`      ✓ Consensus found: ${(consensus.frequency * 100).toFixed(0)}% frequency\n`);
    } else {
      console.log(`      ✗ No consensus (${consensus ? (consensus.frequency * 100).toFixed(0) : 0}% < 60%)\n`);
    }
  }

  return patterns;
}

/**
 * Analyze folder structure patterns
 */
async function analyzeFolderStructure(repo: RepoInfo): Promise<any> {
  // Mock implementation - would use GitHub API to get tree
  console.log(`      → Analyzing structure: ${repo.fullName}`);

  return {
    repo: repo.fullName,
    hasSourceDir: true,
    hasSrcDir: false,
    hasDistDir: true,
    hasPanelsDir: true, // Directus-specific
    hasHooksDir: true,  // Directus-specific
    structure: 'feature-based'
  };
}

/**
 * Analyze testing approach
 */
async function analyzeTestingApproach(repo: RepoInfo): Promise<any> {
  console.log(`      → Analyzing tests: ${repo.fullName}`);

  return {
    repo: repo.fullName,
    hasTests: true,
    framework: 'vitest',
    coverage: true,
    e2eTests: false
  };
}

/**
 * Analyze common dependencies
 */
async function analyzeDependencies(repo: RepoInfo): Promise<any> {
  console.log(`      → Analyzing dependencies: ${repo.fullName}`);

  return {
    repo: repo.fullName,
    dependencies: {
      'vue': '3.x',
      'typescript': '5.x',
      '@directus/extensions-sdk': 'latest'
    },
    devDependencies: {
      'vitest': 'latest',
      'typescript': '5.x'
    }
  };
}

/**
 * Analyze configuration patterns
 */
async function analyzeConfiguration(repo: RepoInfo): Promise<any> {
  console.log(`      → Analyzing config: ${repo.fullName}`);

  return {
    repo: repo.fullName,
    hasTypeScript: true,
    hasEslint: true,
    hasPrettier: true,
    hasViteConfig: true
  };
}

/**
 * Find consensus patterns from analysis results
 */
function findConsensus(results: any[], repos: RepoInfo[]): any | null {
  if (results.length === 0) return null;

  // Count how many repos have each pattern
  const patternCounts = new Map<string, number>();
  const patternExamples = new Map<string, string[]>();

  // Analyze results to find common patterns
  // This is simplified - real implementation would do deeper analysis

  const totalRepos = results.length;
  const validResults = results.filter(r => r && r.repo);

  if (validResults.length === 0) return null;

  // Calculate frequency (what % of repos use this pattern)
  const frequency = validResults.length / totalRepos;

  // Calculate quality (average star rating, normalized)
  const avgStars = repos.reduce((sum, r) => sum + r.stars, 0) / repos.length;
  const quality = Math.min(avgStars / 200, 1); // Normalize to 0-1 (200+ stars = 1.0)

  // Get examples
  const examples = validResults.slice(0, 5).map(r => r.repo);

  // Determine common pattern
  const commonPattern = determineCommonPattern(validResults);

  return {
    frequency,
    quality,
    examples,
    description: `Pattern found in ${(frequency * 100).toFixed(0)}% of analyzed repositories`,
    commonPattern,
    alternatives: []
  };
}

/**
 * Determine the most common pattern from results
 */
function determineCommonPattern(results: any[]): any {
  // Simplified - would analyze actual patterns
  const firstResult = results[0];

  // Return the pattern structure
  return {
    ...firstResult,
    confidence: 'high',
    adoption: `${results.length} repositories`
  };
}

/**
 * Save patterns to file system
 */
function savePatterns(patterns: GitHubPattern[], outputDir: string): void {
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

  // Default: Directus extension project
  const projectType = args[0] || 'directus-extension';
  const techStack = args.length > 1 ? args.slice(1) : ['directus', 'vue3', 'typescript'];

  console.log('🌱 GitHub Pattern Discoverer\n');
  console.log(`Project Type: ${projectType}`);
  console.log(`Tech Stack: ${techStack.join(', ')}\n`);
  console.log('━'.repeat(60) + '\n');

  try {
    // Discover patterns
    const patterns = await discoverGitHubPatterns(techStack, projectType);

    if (patterns.length === 0) {
      console.log('⚠️  No patterns discovered.\n');
      console.log('This might be because:');
      console.log('  1. No repositories match the search criteria');
      console.log('  2. No patterns reached the 60% consensus threshold');
      console.log('  3. Try different tech stack or project type\n');
      return;
    }

    // Output directory
    const projectRoot = join(__dirname, '../../..');
    const outputDir = join(projectRoot, '.claude/memory/patterns/github');

    // Save patterns
    savePatterns(patterns, outputDir);

    console.log('\n' + '━'.repeat(60));
    console.log('✅ GitHub pattern discovery complete!\n');
    console.log('📊 Summary:');
    console.log(`   - Total patterns: ${patterns.length}`);
    console.log(`   - Average frequency: ${(patterns.reduce((sum, p) => sum + p.frequency, 0) / patterns.length * 100).toFixed(0)}%`);
    console.log(`   - Average quality: ${(patterns.reduce((sum, p) => sum + p.quality, 0) / patterns.length * 100).toFixed(0)}%`);
    console.log(`   - Average confidence: ${(patterns.reduce((sum, p) => sum + p.confidence, 0) / patterns.length * 100).toFixed(0)}%`);
    console.log(`\n📁 Patterns saved to:`);
    console.log(`   ${outputDir}`);
    console.log('\n💡 Next Step: Integrate patterns in seeder');
    console.log(`   node .claude/scripts/pattern-seeder.ts`);

    return patterns;
  } catch (error) {
    console.error('\n❌ Error during discovery:', (error as Error).message);
    console.error((error as Error).stack);
    process.exit(1);
  }
}

// Export for use in other scripts
export { discoverGitHubPatterns, searchRepositories };

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
