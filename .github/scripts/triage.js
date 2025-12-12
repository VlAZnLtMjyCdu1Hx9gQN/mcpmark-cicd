const { Octokit } = require('@octokit/rest');
const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

async function main() {
  const { issue } = require(process.env.GITHUB_EVENT_PATH);
  const { number: issueNumber, title, body, labels: existingLabels } = issue;
  const repo = process.env.GITHUB_REPOSITORY.split('/');
  const owner = repo[0];
  const repoName = repo[1];

  // Check if issue already has needs-triage label
  const needsTriageLabel = existingLabels.some(label => label.name === 'needs-triage');
  if (!needsTriageLabel) {
    await octokit.rest.issues.addLabels({
      owner,
      repo: repoName,
      issue_number: issueNumber,
      labels: ['needs-triage']
    });
  }

  // Add category labels
  const categoryLabels = [];
  if (title.toLowerCase().includes('bug')) {
    categoryLabels.push('bug');
  }
  if (title.toLowerCase().includes('epic')) {
    categoryLabels.push('epic');
  }
  if (title.toLowerCase().includes('maintenance')) {
    categoryLabels.push('maintenance');
  }

  if (categoryLabels.length > 0) {
    await octokit.rest.issues.addLabels({
      owner,
      repo: repoName,
      issue_number: issueNumber,
      labels: categoryLabels
    });
  }

  // Add priority labels
  const priorityKeywords = [
    { keywords: ['critical', 'urgent', 'production', 'outage'], label: 'priority-critical' },
    { keywords: ['important', 'high', 'blocking'], label: 'priority-high' },
    { keywords: ['medium', 'normal'], label: 'priority-medium' },
    { keywords: ['low', 'nice-to-have', 'minor'], label: 'priority-low' }
  ];

  let priorityLabel = 'priority-medium'; // default

  for (const { keywords, label } of priorityKeywords) {
    const hasKeyword = keywords.some(keyword => 
      title.toLowerCase().includes(keyword) || 
      (body && body.toLowerCase().includes(keyword))
    );
    if (hasKeyword) {
      priorityLabel = label;
      break; // highest priority wins
    }
  }

  await octokit.rest.issues.addLabels({
    owner,
    repo: repoName,
    issue_number: issueNumber,
    labels: [priorityLabel]
  });
}

main().catch(console.error);