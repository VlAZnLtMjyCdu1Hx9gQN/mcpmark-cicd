const { Octokit } = require('@octokit/rest');
const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

async function main() {
  const repo = process.env.GITHUB_REPOSITORY.split('/');
  const owner = repo[0];
  const repoName = repo[1];

  // Create category labels
  const categoryLabels = [
    { name: 'bug', description: 'Something isn\'t working', color: 'e11d21' },
    { name: 'enhancement', description: 'New feature or request', color: '005cc5' },
    { name: 'epic', description: 'Large feature requiring multiple sub-tasks', color: '9900ff' },
    { name: 'maintenance', description: 'Maintenance and housekeeping tasks', color: 'ff9900' }
  ];

  // Create priority labels
  const priorityLabels = [
    { name: 'priority-critical', description: 'Critical priority issue', color: 'e11d21' },
    { name: 'priority-high', description: 'High priority issue', color: 'ff6b00' },
    { name: 'priority-medium', description: 'Medium priority issue', color: 'ffc107' },
    { name: 'priority-low', description: 'Low priority issue', color: '007bff' }
  ];

  // Create status labels
  const statusLabels = [
    { name: 'needs-triage', description: 'Needs to be reviewed by maintainers', color: 'ffc107' },
    { name: 'needs-review', description: 'Awaiting review from maintainers', color: '007bff' },
    { name: 'first-time-contributor', description: 'Issue created by first-time contributor', color: '28a745' }
  ];

  // Create all labels
  const allLabels = [...categoryLabels, ...priorityLabels, ...statusLabels];
  
  for (const label of allLabels) {
    try {
      await octokit.rest.issues.createLabel({
        owner,
        repo: repoName,
        name: label.name,
        description: label.description,
        color: label.color
      });
    } catch (error) {
      if (error.status !== 422) {
        console.error(`Error creating label ${label.name}:`, error);
      }
      // If label already exists, do nothing
    }
  }
}

main().catch(console.error);