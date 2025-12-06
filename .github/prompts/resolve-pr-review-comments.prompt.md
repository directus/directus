# Resolve PR Review Comments

This prompt guides you through resolving CodeRabbit (or other automated reviewer) comments on a pull request, with proper thread replies and resolution.

## Instructions

1. First, fetch all unresolved review threads from the current PR
2. For each issue, determine if it requires a code fix or is a false positive
3. Make fixes, commit, and reply to threads with explanations
4. Resolve threads once addressed

## Step 1: Fetch Unresolved Review Threads

Query the current PR for all unresolved review threads:

```bash
gh api graphql -f query='
query {
  repository(owner: "<OWNER>", name: "<REPO>") {
    pullRequest(number: <PR_NUMBER>) {
      reviewThreads(first: 50) {
        nodes {
          id
          isResolved
          isOutdated
          path
          line
          comments(first: 5) {
            nodes {
              author { login }
              body
              createdAt
              outdated
            }
          }
        }
      }
    }
  }
}'
```

Filter for `isResolved: false` to get the list of issues to address. Check `isOutdated: true` or comment `outdated: true` to identify stale comments where the code has changed since the comment was made.

## Step 2: Categorize Each Issue

For each unresolved thread, determine:

- **Requires Fix**: Code change needed to address the concern
- **False Positive**: The reviewer's concern doesn't apply (explain why)
- **Won't Fix**: Intentional decision (explain rationale)
- **Needs Clarification**: Ask the reviewer for more details
- **Stale**: The comment refers to code that has since been modified by new commits

## Step 3: Address Each Issue

### For Issues Requiring Code Fixes

```bash
# 1. Make the fix in the relevant file(s)

# 2. Commit with descriptive message
git add -A && git commit -m "fix: <description of fix>"

# 3. Push the changes
git push

# 4. Reply to the review thread explaining the fix
gh api graphql -f query='
mutation {
  addPullRequestReviewThreadReply(input: {
    pullRequestReviewThreadId: "<THREAD_ID>"
    body: "Fixed in commit <SHA>. <BRIEF_EXPLANATION>"
  }) {
    comment { id }
  }
}'

# 5. Resolve the thread
gh api graphql -f query='
mutation {
  resolveReviewThread(input: {
    threadId: "<THREAD_ID>"
  }) {
    thread { id isResolved }
  }
}'
```

### For False Positives / Won't Fix

```bash
# 1. Reply explaining why no change is needed
gh api graphql -f query='
mutation {
  addPullRequestReviewThreadReply(input: {
    pullRequestReviewThreadId: "<THREAD_ID>"
    body: "<EXPLANATION_OF_WHY_NO_CHANGE_NEEDED>"
  }) {
    comment { id }
  }
}'

# 2. Resolve the thread
gh api graphql -f query='
mutation {
  resolveReviewThread(input: {
    threadId: "<THREAD_ID>"
  }) {
    thread { id isResolved }
  }
}'
```

### For Stale Comments

When new commits have been pushed and comments no longer apply to the current code:

```bash
# 1. Reply indicating the comment is stale
gh api graphql -f query='
mutation {
  addPullRequestReviewThreadReply(input: {
    pullRequestReviewThreadId: "<THREAD_ID>"
    body: "This comment is now stale. The code referenced has been modified in subsequent commits and this feedback no longer applies to the current state of the PR."
  }) {
    comment { id }
  }
}'

# 2. Resolve the thread
gh api graphql -f query='
mutation {
  resolveReviewThread(input: {
    threadId: "<THREAD_ID>"
  }) {
    thread { id isResolved }
  }
}'
```

## Step 4: Track Progress

Maintain a tracking table as you work through issues:

| # | File | Issue Summary | Status | Thread ID | Commit/Notes |
|---|------|---------------|--------|-----------|--------------|
| 1 | path/to/file.yaml | Brief description | ✅ Fixed | PRRT_xxx | abc1234 |
| 2 | path/to/other.yaml | Brief description | ⏭️ Won't Fix | PRRT_yyy | Intentional |
| 3 | path/to/another.yaml | Brief description | 🔄 In Progress | PRRT_zzz | |
| 4 | path/to/changed.yaml | Brief description | ⏳ Stale | PRRT_aaa | Code modified |

## Common Issue Patterns

### Security Concerns
- Least-privilege RBAC roles
- Secret management practices
- Hard-coded credentials or endpoints

### Code Quality
- Duplicate definitions
- Missing or invalid references
- Format string mismatches
- Empty selectors or values

### Configuration Issues
- Invalid schema references
- Missing required files
- Incorrect file paths

## Notes

- The GitHub MCP tools (`mcp_github_add_issue_comment`) only add top-level PR comments, not thread replies
- Use `gh api graphql` with the mutations above for thread-specific operations
- Always verify the fix before committing by reviewing the file changes
- Group related fixes into single commits when appropriate
- For large PRs, consider addressing issues in batches and pushing periodically

## Getting PR Context

To get the current PR number and repository info:

```bash
# Get current branch
git branch --show-current

# Find associated PR
gh pr view --json number,url,headRefName
```
